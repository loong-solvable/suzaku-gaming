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
  uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
        ? (e) => { onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0); }
        : undefined,
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
