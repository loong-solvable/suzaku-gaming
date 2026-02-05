#!/bin/bash
#
# 朱雀游戏后台 - 快速启动脚本
# 用于服务器首次部署
#

set -e

echo "============================================"
echo "     朱雀游戏后台 - 一键部署"
echo "============================================"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo "[错误] 请使用 root 权限运行"
    echo "使用: sudo bash quick-start.sh"
    exit 1
fi

# 检查 .env.production 是否已配置
if [ -f ".env.production" ]; then
    echo "[提示] 检测到 .env.production 配置文件"
else
    echo "[警告] 未检测到 .env.production 配置文件"
    echo "[提示] 从模板创建并生成随机密码..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        # 替换为随机密码
        RANDOM_PASS=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
        RANDOM_JWT=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        sed -i "s/your_strong_password_here/$RANDOM_PASS/g" .env.production
        sed -i "s/your-super-secret-jwt-key-change-this-in-production-32chars/$RANDOM_JWT/g" .env.production
        echo "[成功] 已生成 .env.production（使用随机密码）"
    else
        cat > .env.production <<EOF
# 数据库配置
POSTGRES_USER=suzaku
POSTGRES_PASSWORD=suzaku_secure_$(date +%s | md5sum | head -c 8)
POSTGRES_DB=suzaku_gaming

# JWT 配置
JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
JWT_EXPIRES_IN=2h

# ThinkingData 配置（可选）
TA_API_HOST=
TA_PROJECT_TOKEN=
TA_SYNC_ENABLED=false
EOF
        echo "[成功] 已生成 .env.production（使用随机密码）"
    fi
fi

# 创建 .env 软链接
ln -sf .env.production .env 2>/dev/null || true

# 运行部署脚本
bash deploy.sh deploy

echo ""
echo "============================================"
echo "     部署完成！"
echo "============================================"
echo ""
echo "访问地址:"
echo "  管理后台: http://$(hostname -I | awk '{print $1}')"
echo "  API 地址: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "默认账号: admin / admin123"
echo ""
echo "常用命令:"
echo "  查看日志: bash deploy.sh logs"
echo "  重启服务: bash deploy.sh restart"
echo "  停止服务: bash deploy.sh stop"
echo ""
