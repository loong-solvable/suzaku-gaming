// src/modules/upload/upload.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Roles } from '../../common/decorators/roles.decorator';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 存储配置
const storage = diskStorage({
  destination: (req, file, cb) => {
    // 按日期分目录
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uploadPath = join(UPLOAD_DIR, dateDir);
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// 文件过滤器
const imageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('只允许上传 JPG/PNG/GIF/WEBP 格式的图片'), false);
  }
};

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  @Post('image')
  @Roles('admin', 'manager', 'operator')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: '上传单个图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 返回相对路径
    const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
    
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads${relativePath.replace('/uploads', '')}`,
    };
  }

  @Post('images')
  @Roles('admin', 'manager', 'operator')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
    }),
  )
  @ApiOperation({ summary: '上传多个图片（最多5个）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return files.map((file) => {
      const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads${relativePath.replace('/uploads', '')}`,
      };
    });
  }
}
