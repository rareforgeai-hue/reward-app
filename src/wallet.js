const db = require('./db');

function getBalance(userId) {
  const row = db.prepare('SELECT balance_after_cents FROM wallet_ledger WHERE user_id=? ORDER BY id DESC LIMIT 1').get(userId);
  return row ? row.balance_after_cents : 0;
}

function applyLedgerEntry(userId, type, amountCents, reference) {
  const current = getBalance(userId);
  const balanceAfter = current + amountCents;
  if (balanceAfter < 0) throw new Error('Insufficient balance');

  db.prepare(`INSERT INTO wallet_ledger(user_id, type, amount_cents, balance_after_cents, reference)
    VALUES(?, ?, ?, ?, ?)`)
    .run(userId, type, amountCents, balanceAfter, reference || null);

  return balanceAfter;
}

function walletSummary(req, res) {
  const balance = getBalance(req.user.id);
  const recent = db.prepare(`SELECT type, amount_cents, balance_after_cents, reference, created_at
    FROM wallet_ledger WHERE user_id=? ORDER BY id DESC LIMIT 50`).all(req.user.id);
  res.json({ balance_cents: balance, recent });
}

module.exports = { getBalance, applyLedgerEntry, walletSummary };
