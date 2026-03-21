const express = require('express');
const db = require('./db');
const config = require('./config');
const { verifyWebhookSignature } = require('./security');
const { applyLedgerEntry } = require('./wallet');

const router = express.Router();
router.use(express.raw({ type: 'application/json' }));

router.post('/bitlabs/conversion', (req, res) => {
  const signature = req.headers['x-bitlabs-signature'];
  const rawBody = req.body;

  if (!verifyWebhookSignature(rawBody, signature, config.bitlabs.webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let body;
  try { body = JSON.parse(rawBody.toString('utf8')); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const clickRef = body.click_ref || body.subid || null;
  const offerId = String(body.offer_id || body.campaign_id || 'unknown');
  const externalTxnId = body.conversion_id || body.transaction_id || null;
  const amountCents = Math.round(Number(body.payout || body.amount || 0) * 100);
  const status = String(body.status || 'approved').toLowerCase();

  const click = clickRef
    ? db.prepare('SELECT user_id FROM clicks WHERE click_ref = ?').get(clickRef)
    : null;

  if (!click?.user_id) return res.status(404).json({ error: 'Unknown click_ref' });
  if (amountCents <= 0) return res.status(400).json({ error: 'Invalid payout amount' });

  const existing = externalTxnId
    ? db.prepare('SELECT id FROM conversions WHERE external_txn_id = ?').get(externalTxnId)
    : null;

  if (existing) return res.status(200).json({ status: 'duplicate_ignored' });

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO conversions(click_ref, user_id, offer_id, external_txn_id, amount_cents, status, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(clickRef, click.user_id, offerId, externalTxnId, amountCents, status, JSON.stringify(body));

    if (status === 'approved') {
      applyLedgerEntry(click.user_id, 'credit', amountCents, `conversion:${externalTxnId || clickRef}`);
    }
  });

  tx();
  return res.status(200).json({ status: 'ok' });
});

module.exports = router;
