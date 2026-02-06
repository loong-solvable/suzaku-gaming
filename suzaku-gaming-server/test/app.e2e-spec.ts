import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // 与 main.ts 保持一致的全局管道配置
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) health check or root should respond', async () => {
    // 根据实际路由调整；至少验证应用能启动并响应
    const res = await request(app.getHttpServer()).get('/');
    expect([200, 404]).toContain(res.status); // 有或无根路由均可
  });

  it('/api/auth/profile (GET) without token should return 401', async () => {
    // 当前后端受保护接口为 /api/auth/profile（auth.controller.ts:26）
    const res = await request(app.getHttpServer()).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});
