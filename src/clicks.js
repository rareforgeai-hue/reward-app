const crypto = require('crypto');
const db = require('./db');
const { evaluateClickRisk } = require('./fraud');

function createClick(req, res) {
  const offerId = req.params.offerId;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  const risk = evaluateClickRisk({ userId: req.user.id, offerId, ip, userAgent });
  const clickRef = crypto.randomUUID();

  db.prepare(`INSERT INTO clicks(user_id, offer_id, ip, user_agent, fingerprint_hash, click_ref, blocked, block_reason)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, offerId, ip, userAgent, risk.fp, clickRef, risk.blocked ? 1 : 0, risk.reason || null);

  if (risk.blocked) {
    return res.status(429).json({ error: risk.reason, click_ref: clickRef });
  }

  return res.status(201).json({ click_ref: clickRef, status: 'tracked' });
}

module.exports = { createClick };
