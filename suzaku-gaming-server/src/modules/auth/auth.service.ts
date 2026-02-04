// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ip?: string) {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.prisma.adminUser.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    // 更新最后登录时间和 IP
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'login',
        module: 'auth',
        ip: ip || null,
      },
    });

    this.logger.log(`User ${username} logged in from ${ip}`);

    return {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        avatar: true,
        lastLoginAt: true,
        lastLoginIp: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  async logout(userId: number, ip?: string) {
    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        adminId: userId,
        action: 'logout',
        module: 'auth',
        ip: ip || null,
      },
    });

    return { message: '已退出登录' };
  }
}
