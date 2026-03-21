const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { register, login, authMiddleware } = require('./auth');
const { getOffers } = require('./offers');
const { createClick } = require('./clicks');
const { walletSummary } = require('./wallet');
const webhookRoutes = require('./webhooks');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '200kb' }));

app.use('/api', rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.get('/api/offers', authMiddleware, getOffers);
app.post('/api/offers/:offerId/click', authMiddleware, createClick);
app.get('/api/wallet', authMiddleware, walletSummary);

app.use('/webhooks', webhookRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
