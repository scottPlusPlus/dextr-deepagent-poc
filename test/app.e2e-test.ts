import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app-server/src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/ping (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/ping')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/chat (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/chat')
      .send({
        userId: 'test-user',
        threadId: 'test-thread-1',
        message: 'hello',
      })
      .expect(201)
      .expect((res: { body: { response?: string } }) => {
        expect(res.body).toHaveProperty('response');
        expect(typeof res.body.response).toBe('string');
      });
  }, 60000);
});
