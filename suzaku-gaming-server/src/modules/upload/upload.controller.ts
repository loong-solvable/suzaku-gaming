// src/modules/upload/upload.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync, promises as fs } from 'fs';
import { join } from 'path';
import { Roles } from '../../common/decorators/roles.decorator';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uploadPath = join(UPLOAD_DIR, dateDir);
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = MIME_EXTENSION_MAP[file.mimetype];
    if (!ext) {
      cb(new BadRequestException('Unsupported file type'), '');
      return;
    }
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = Object.keys(MIME_EXTENSION_MAP);
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only JPG/PNG/GIF/WEBP images are allowed'), false);
  }
};

const hasSignature = (buffer: Buffer, signature: number[]) =>
  signature.every((byte, index) => buffer[index] === byte);

const isValidImageSignature = (buffer: Buffer, mimetype: string): boolean => {
  switch (mimetype) {
    case 'image/jpeg':
      return hasSignature(buffer, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif': {
      const header = buffer.subarray(0, 6).toString('ascii');
      return header === 'GIF87a' || header === 'GIF89a';
    }
    case 'image/webp':
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    default:
      return false;
  }
};

const cleanupFiles = async (files: Express.Multer.File[]) => {
  await Promise.allSettled(
    files.map((file) => fs.unlink(file.path).catch(() => undefined)),
  );
};

const assertValidImages = async (files: Express.Multer.File[]) => {
  for (const file of files) {
    const buffer = await fs.readFile(file.path);
    if (!isValidImageSignature(buffer, file.mimetype)) {
      await cleanupFiles(files);
      throw new BadRequestException('Uploaded file content does not match image type');
    }
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
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a single image' })
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
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select a file to upload');
    }

    await assertValidImages([file]);

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
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({ summary: 'Upload up to 5 images' })
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
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Please select files to upload');
    }

    await assertValidImages(files);

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
