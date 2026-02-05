// src/api/upload.ts
import { request } from '@/utils/request';

export interface UploadResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

export const uploadApi = {
  // 上传单个图片
  uploadImage(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 上传多个图片
  uploadImages(files: File[]): Promise<UploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return request.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
