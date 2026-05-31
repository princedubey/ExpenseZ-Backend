const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

// Set required env vars before importing app
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.FIREBASE_TYPE = process.env.FIREBASE_TYPE || 'test';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test';
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || 'test';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test@test.iam.gserviceaccount.com';
process.env.FIREBASE_CLIENT_ID = process.env.FIREBASE_CLIENT_ID || 'test';
process.env.FIREBASE_AUTH_URI = process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth';
process.env.FIREBASE_TOKEN_URI = process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token';
process.env.FIREBASE_AUTH_PROVIDER_CERT_URL = process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs';
process.env.FIREBASE_CLIENT_CERT_URL = process.env.FIREBASE_CLIENT_CERT_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/test';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  // Now require the app after MONGODB_URI is set
  app = require('../src/app');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Transactions API', () => {
  let accessToken;

  test('registers a user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken;
  });

  test('creates a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Salary', amount: 1000, type: 'cash_in', category: 'Salary' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Salary');
  });

  test('lists transactions with pagination and filters', async () => {
    const res = await request(app)
      .get('/api/transactions?limit=10&page=1&type=cash_in')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});
