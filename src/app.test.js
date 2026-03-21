process.env.JWT_SECRET = 'test-secret';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('./app');

describe('reward-app API', () => {
  let token;

  test('health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('register and login', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'Password123' });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'Password123' });
    expect(login.status).toBe(200);
    token = login.body.token;
  });

  test('wallet endpoint requires auth', async () => {
    const unauth = await request(app).get('/api/wallet');
    expect(unauth.status).toBe(401);

    const auth = await request(app).get('/api/wallet').set('Authorization', `Bearer ${token}`);
    expect(auth.status).toBe(200);
    expect(auth.body.balance_cents).toBe(0);
  });
});
