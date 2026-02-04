// src/api/auth.ts
import { request } from '@/utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
  avatar?: string;
}

export interface LoginResult {
  token: string;
  userInfo: UserInfo;
}

export const authApi = {
  login(params: LoginParams): Promise<LoginResult> {
    return request.post('/auth/login', params);
  },

  getProfile(): Promise<UserInfo> {
    return request.get('/auth/profile');
  },

  logout(): Promise<void> {
    return request.post('/auth/logout');
  }
};
