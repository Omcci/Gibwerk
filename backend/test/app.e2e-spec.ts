import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('McpController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/mcp/generate (POST)', () => {
    // This test will depend on the OpenAI API key being available
    // In a real-world scenario, you would mock the OpenAI service
    return request(app.getHttpServer())
      .post('/mcp/generate')
      .send({ prompt: 'Test prompt' })
      .expect(201);
  });
});

describe('GitController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/git/repo-status (GET)', () => {
    // This test will depend on a valid repo path
    // In a real-world scenario, you would mock the git service
    return request(app.getHttpServer())
      .get('/git/repo-status')
      .send({ repoPath: '.' }) // Using the current directory as a test
      .expect(200);
  });

  it('/git/user-repos (GET) - should return 400 without auth header', () => {
    return request(app.getHttpServer())
      .get('/git/user-repos')
      .expect(400);
  });

  it('/git/sync-commits (POST)', () => {
    // This test will depend on a valid repo path
    // In a real-world scenario, you would mock the git service
    return request(app.getHttpServer())
      .post('/git/sync-commits')
      .send({ repoPath: '.' }) // Using the current directory as a test
      .expect(201);
  });
});
