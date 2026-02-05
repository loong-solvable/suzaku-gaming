#!/bin/bash
#
# 朱雀游戏后台 - 一键部署脚本
# 支持 CentOS 6.5+ / CentOS 7+ / Ubuntu / Debian
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 权限运行此脚本"
        print_info "使用: sudo bash deploy.sh"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
        VERSION=$(cat /etc/redhat-release | grep -oE '[0-9]+\.[0-9]+' | head -1 | cut -d. -f1)
    else
        print_error "无法检测操作系统类型"
        exit 1
    fi
    print_info "检测到操作系统: $OS $VERSION"
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker 已安装"
        docker --version
        return 0
    fi

    print_info "正在安装 Docker..."
    
    case $OS in
        centos|rhel)
            if [ "$VERSION" -lt 7 ]; then
                print_warning "CentOS $VERSION 版本较低，使用兼容安装方式..."
                # CentOS 6 安装方式
                yum install -y epel-release
                yum install -y yum-utils device-mapper-persistent-data lvm2
                # 使用阿里云镜像
                yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
                # CentOS 6 需要安装较老版本
                yum install -y docker-io || yum install -y docker
            else
                # CentOS 7+
                yum install -y yum-utils
                yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
                yum install -y docker-ce docker-ce-cli containerd.io
            fi
            ;;
        ubuntu|debian)
            apt-get update
            apt-get install -y ca-certificates curl gnupg
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io
            ;;
        *)
            print_error "不支持的操作系统: $OS"
            print_info "请手动安装 Docker 后重新运行此脚本"
            exit 1
            ;;
    esac

    # 启动 Docker
    systemctl start docker 2>/dev/null || service docker start
    systemctl enable docker 2>/dev/null || chkconfig docker on 2>/dev/null || true
    
    print_success "Docker 安装完成"
}

# 安装 Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose 已安装"
        docker-compose --version
        return 0
    fi

    # 检查 docker compose 插件
    if docker compose version &> /dev/null; then
        print_success "Docker Compose 插件已安装"
        # 创建兼容命令
        echo '#!/bin/bash' > /usr/local/bin/docker-compose
        echo 'docker compose "$@"' >> /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        return 0
    fi

    print_info "正在安装 Docker Compose..."
    
    # 获取最新版本
    COMPOSE_VERSION="v2.24.0"
    
    # 下载
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # 如果下载失败，尝试使用 pip 安装
    if ! command -v docker-compose &> /dev/null; then
        print_warning "二进制安装失败，尝试使用 pip 安装..."
        if command -v pip &> /dev/null; then
            pip install docker-compose
        elif command -v pip3 &> /dev/null; then
            pip3 install docker-compose
        else
            # 安装 pip
            if [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
                yum install -y python-pip 2>/dev/null || yum install -y python3-pip
            else
                apt-get install -y python3-pip
            fi
            pip3 install docker-compose
        fi
    fi
    
    print_success "Docker Compose 安装完成"
}

# 配置 Docker 镜像加速
configure_docker_mirror() {
    print_info "配置 Docker 镜像加速..."
    
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json <<EOF
{
    "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com",
        "https://docker.mirrors.ustc.edu.cn",
        "https://registry.docker-cn.com"
    ],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    }
}
EOF
    
    # 重启 Docker
    systemctl restart docker 2>/dev/null || service docker restart
    print_success "Docker 镜像加速配置完成"
}

# 检查环境配置
check_env() {
    if [ ! -f ".env.production" ]; then
        print_error "未找到 .env.production 配置文件"
        print_info "请先配置 .env.production 文件"
        exit 1
    fi
    
    # 创建软链接
    if [ ! -f ".env" ]; then
        ln -sf .env.production .env
        print_info "已链接 .env.production -> .env"
    fi
}

# 部署服务
deploy() {
    print_info "开始部署服务..."
    
    # 停止旧服务
    docker-compose down 2>/dev/null || true
    
    # 构建并启动
    docker-compose build --no-cache
    docker-compose up -d
    
    print_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    docker-compose ps
    
    print_success "部署完成！"
    echo ""
    print_info "服务访问地址:"
    echo -e "  前端管理后台: ${GREEN}http://服务器IP${NC}"
    echo -e "  后端 API:    ${GREEN}http://服务器IP:3000${NC}"
    echo ""
    print_info "默认管理员账号:"
    echo -e "  用户名: ${GREEN}admin${NC}"
    echo -e "  密码:   ${GREEN}admin123${NC}"
    echo ""
    print_warning "请登录后立即修改默认密码！"
}

# 查看日志
show_logs() {
    docker-compose logs -f --tail=100
}

# 停止服务
stop_service() {
    print_info "停止服务..."
    docker-compose down
    print_success "服务已停止"
}

# 重启服务
restart_service() {
    print_info "重启服务..."
    docker-compose restart
    print_success "服务已重启"
}

# 清理数据
cleanup() {
    print_warning "此操作将删除所有数据，是否继续？[y/N]"
    read -r confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker-compose down -v
        print_success "数据已清理"
    else
        print_info "操作已取消"
    fi
}

# 显示帮助
show_help() {
    echo "朱雀游戏后台 - 部署脚本"
    echo ""
    echo "用法: sudo bash deploy.sh [命令]"
    echo ""
    echo "命令:"
    echo "  install   仅安装 Docker 和 Docker Compose"
    echo "  deploy    部署服务（默认）"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      查看日志"
    echo "  status    查看服务状态"
    echo "  cleanup   清理所有数据（危险操作）"
    echo "  help      显示此帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-deploy}" in
        install)
            check_root
            detect_os
            install_docker
            install_docker_compose
            configure_docker_mirror
            print_success "安装完成，请运行 'bash deploy.sh deploy' 部署服务"
            ;;
        deploy)
            check_root
            detect_os
            install_docker
            install_docker_compose
            configure_docker_mirror
            check_env
            deploy
            ;;
        start)
            docker-compose up -d
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        logs)
            show_logs
            ;;
        status)
            docker-compose ps
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
