const crypto = require('crypto');

function hashToken(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function fingerprint(ip, userAgent = '') {
  return crypto.createHash('sha256').update(`${ip || 'na'}|${userAgent}`).digest('hex');
}

function verifyWebhookSignature(rawBody, provided, secret) {
  if (!provided || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

module.exports = { hashToken, fingerprint, verifyWebhookSignature };
