import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('allows a valid applicant to login', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'applicant@test.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'applicant@test.com',
      role: 'APPLICANT',
    });
  });

  it('allows a valid reviewer to login', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'reviewer@test.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'reviewer@test.com',
      role: 'REVIEWER',
    });
  });

  it('rejects an invalid password', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'applicant@test.com',
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body.accessToken).toBeUndefined();
  });

  it('rejects an unknown email', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'password123',
      })
      .expect(401);

    expect(response.body.accessToken).toBeUndefined();
  });

  it('rejects missing login fields', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({})
      .expect(400);

    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'Email is required',
        'Password is required',
      ]),
    );
  });

  it('allows a logged-in applicant to call a protected endpoint with the token', async () => {
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'applicant@test.com',
        password: 'password123',
      })
      .expect(200);

    await request(httpServer)
      .get('/applications/my')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);
  });

  it('blocks protected endpoints when no token is provided', async () => {
    const response = await request(httpServer)
      .get('/applications/my')
      .expect(401);

    expect(response.body.accessToken).toBeUndefined();
  });
});
