import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Application workflow endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;
  let applicantToken: string;
  let reviewerToken: string;

  jest.setTimeout(30000);

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_DATABASE = ':memory:';

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

    const applicantLogin = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'applicant@test.com', password: 'password123' })
      .expect(200);
    applicantToken = applicantLogin.body.accessToken;

    const reviewerLogin = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'reviewer@test.com', password: 'password123' })
      .expect(200);
    reviewerToken = reviewerLogin.body.accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('connects the applicant create, submit, and detail endpoints', async () => {
    const createResponse = await request(httpServer)
      .post('/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .field('title', 'Workflow test claim')
      .field('category', 'TRAVEL')
      .field('description', 'Created by the workflow e2e test')
      .field('amount', '125.50')
      .expect(201);

    expect(createResponse.body).toMatchObject({
      title: 'Workflow test claim',
      category: 'TRAVEL',
      status: 'DRAFT',
    });

    const claimId = createResponse.body.id;

    const myClaimsResponse = await request(httpServer)
      .get('/applications/my')
      .set('Authorization', `Bearer ${applicantToken}`)
      .expect(200);
    expect(myClaimsResponse.body.some((claim: { id: string }) => claim.id === claimId)).toBe(true);

    const submitResponse = await request(httpServer)
      .post(`/applications/${claimId}/submit`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .expect(200);
    expect(submitResponse.body.status).toBe('SUBMITTED');

    const detailResponse = await request(httpServer)
      .get(`/applications/${claimId}`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .expect(200);
    expect(detailResponse.body.auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ newStatus: 'DRAFT' }),
        expect.objectContaining({ oldStatus: 'DRAFT', newStatus: 'SUBMITTED' }),
      ]),
    );
  });

  it('connects the reviewer list, detail, and transition endpoints', async () => {
    const createResponse = await request(httpServer)
      .post('/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .field('title', 'Reviewer workflow claim')
      .field('category', 'MEALS')
      .field('description', 'Reviewer transition smoke test')
      .field('amount', '80')
      .expect(201);

    const claimId = createResponse.body.id;

    await request(httpServer)
      .post(`/applications/${claimId}/submit`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .expect(200);

    const reviewerListResponse = await request(httpServer)
      .get('/reviewer/applications')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(reviewerListResponse.body.some((claim: { id: string }) => claim.id === claimId)).toBe(true);

    const reviewerDetailResponse = await request(httpServer)
      .get(`/reviewer/applications/${claimId}`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(reviewerDetailResponse.body.applicant).toMatchObject({
      email: 'applicant@test.com',
    });

    const startReviewResponse = await request(httpServer)
      .post(`/reviewer/applications/${claimId}/start-review`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(startReviewResponse.body.status).toBe('UNDER_REVIEW');

    const approveResponse = await request(httpServer)
      .post(`/reviewer/applications/${claimId}/approve`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(approveResponse.body.status).toBe('APPROVED');
  });

  it('enforces role guards on applicant and reviewer endpoints', async () => {
    await request(httpServer)
      .get('/reviewer/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .expect(403);

    await request(httpServer)
      .get('/applications/my')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(403);
  });
});
