const db = require('./db');
const { fingerprint } = require('./security');

function logFraud(userId, severity, reason, metadata) {
  db.prepare('INSERT INTO fraud_events(user_id, severity, reason, metadata_json) VALUES(?, ?, ?, ?)')
    .run(userId || null, severity, reason, JSON.stringify(metadata || {}));
}

function evaluateClickRisk({ userId, offerId, ip, userAgent }) {
  const fp = fingerprint(ip, userAgent);

  const recentByUser = db.prepare(`SELECT COUNT(*) AS c FROM clicks
    WHERE user_id = ? AND created_at > datetime('now', '-1 minute')`).get(userId).c;

  if (recentByUser > 20) {
    logFraud(userId, 'high', 'click_velocity_user', { recentByUser });
    return { blocked: true, reason: 'Too many clicks. Try again later.', fp };
  }

  const recentByFingerprint = db.prepare(`SELECT COUNT(*) AS c FROM clicks
    WHERE fingerprint_hash = ? AND created_at > datetime('now', '-5 minute')`).get(fp).c;

  if (recentByFingerprint > 30) {
    logFraud(userId, 'high', 'click_velocity_fingerprint', { recentByFingerprint });
    return { blocked: true, reason: 'Suspicious traffic detected.', fp };
  }

  const duplicate = db.prepare(`SELECT id FROM clicks
    WHERE user_id = ? AND offer_id = ? AND created_at > datetime('now', '-10 seconds')
    ORDER BY id DESC LIMIT 1`).get(userId, offerId);

  if (duplicate) {
    logFraud(userId, 'medium', 'rapid_duplicate_click', { offerId });
    return { blocked: true, reason: 'Duplicate click suppressed.', fp };
  }

  return { blocked: false, fp };
}

module.exports = { evaluateClickRisk };
