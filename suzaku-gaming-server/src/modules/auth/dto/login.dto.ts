// src/modules/auth/dto/login.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: '用户名' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'password123', description: '密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
