// src/modules/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('list')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '获取用户列表' })
  async getUsers(@Query() query: QueryUserDto, @Req() req: Request) {
    return this.userService.getUsers(query, (req as any).user);
  }

  @Get('parent-options')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '获取可选的上级用户列表' })
  async getParentOptions(@Req() req: Request) {
    return this.userService.getParentOptions((req as any).user);
  }

  @Get('team-options')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取组长和组员选项（用于归因申请）' })
  async getTeamOptions() {
    return this.userService.getTeamOptions();
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '获取用户详情' })
  async getUserById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.userService.getUserById(id, (req as any).user);
  }

  @Post('create')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '创建用户' })
  async createUser(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.userService.createUser(dto, (req as any).user);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '更新用户' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.userService.updateUser(id, dto, (req as any).user);
  }

  @Post(':id/toggle-status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '切换用户状态' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.userService.toggleStatus(id, (req as any).user);
  }
}
