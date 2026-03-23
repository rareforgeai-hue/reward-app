process.env.JWT_SECRET = 'test-secret';
process.env.DB_PATH = ':memory:';
process.env.BITLABS_API_KEY = 'bitlabs-test-token';
process.env.BITLABS_WEBHOOK_SECRET = 'bitlabs-webhook-secret';

const crypto = require('crypto');
const request = require('supertest');
const app = require('./app');
const db = require('./db');

jest.setTimeout(20000);

describe('reward-app API', () => {
  let token;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

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

    const reg = await request(app).post('/api/auth/register').send({ email: 'wallet@example.com', password: 'Password123' });
    const auth = await request(app).get('/api/wallet').set('Authorization', `Bearer ${reg.body.token}`);
    expect(auth.status).toBe(200);
    expect(auth.body.balance_cents).toBe(0);
  });

  test('offers endpoint fetches from BitLabs and uses cache', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: 'offers@example.com', password: 'Password123' });
    token = reg.body.token;

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ offers: [{ id: 'offer-1', payout: 1.23 }] })
    });

    const first = await request(app)
      .get('/api/offers?country=US')
      .set('Authorization', `Bearer ${token}`);
    expect(first.status).toBe(200);
    expect(first.body.source).toBe('upstream');
    expect(first.body.data.offers).toHaveLength(1);

    const second = await request(app)
      .get('/api/offers?country=US')
      .set('Authorization', `Bearer ${token}`);
    expect(second.status).toBe(200);
    expect(second.body.source).toBe('cache');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('returns 504 when BitLabs offer request times out', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: 'timeout@example.com', password: 'Password123' });

    const timeoutError = new Error('timed out');
    timeoutError.name = 'AbortError';
    global.fetch.mockRejectedValue(timeoutError);

    const res = await request(app)
      .get('/api/offers?country=US')
      .set('Authorization', `Bearer ${reg.body.token}`);

    expect(res.status).toBe(504);
    expect(res.body.error).toBe('BitLabs fetch timeout');
  });

  test('bitlabs conversion webhook credits approved conversions and ignores duplicates', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: 'webhook@example.com', password: 'Password123' });
    const userToken = reg.body.token;

    const clickRes = await request(app)
      .post('/api/offers/offer-42/click')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(clickRes.status).toBe(201);
    const clickRef = clickRes.body.click_ref;

    const payload = {
      click_ref: clickRef,
      offer_id: 'offer-42',
      conversion_id: 'txn-123',
      payout: 2.5,
      status: 'approved'
    };
    const raw = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', process.env.BITLABS_WEBHOOK_SECRET).update(raw).digest('hex');

    const firstWebhook = await request(app)
      .post('/webhooks/bitlabs/conversion')
      .set('Content-Type', 'application/json')
      .set('x-bitlabs-signature', sig)
      .send(raw);

    expect(firstWebhook.status).toBe(200);
    expect(firstWebhook.body.status).toBe('ok');

    const wallet = await request(app).get('/api/wallet').set('Authorization', `Bearer ${userToken}`);
    expect(wallet.status).toBe(200);
    expect(wallet.body.balance_cents).toBe(250);

    const secondWebhook = await request(app)
      .post('/webhooks/bitlabs/conversion')
      .set('Content-Type', 'application/json')
      .set('x-bitlabs-signature', sig)
      .send(raw);

    expect(secondWebhook.status).toBe(200);
    expect(secondWebhook.body.status).toBe('duplicate_ignored');

    const conversions = db.prepare('SELECT count(*) as count FROM conversions WHERE external_txn_id = ?').get('txn-123');
    expect(conversions.count).toBe(1);
  });
});
