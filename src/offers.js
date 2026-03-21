const db = require('./db');
const config = require('./config');

function cacheKeyFromQuery(query) {
  const keys = Object.keys(query).sort();
  return keys.map(k => `${k}=${query[k]}`).join('&') || 'default';
}

async function fetchBitlabsOffers(query = {}) {
  const url = new URL(config.bitlabs.baseUrl);
  Object.entries(query).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => url.searchParams.append(k, String(x)));
    else if (v !== undefined) url.searchParams.set(k, String(v));
  });
  if (config.bitlabs.appId) url.searchParams.set('app_id', config.bitlabs.appId);

  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Token': config.bitlabs.apiToken,
      Accept: 'application/json'
    }
  });

  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  if (!response.ok) {
    const err = new Error('BitLabs fetch failed');
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

async function getOffers(req, res) {
  if (!config.bitlabs.apiToken) return res.status(500).json({ error: 'BITLABS_API_KEY is required' });

  const cacheKey = cacheKeyFromQuery(req.query);
  const nowIso = new Date().toISOString();

  const cached = db.prepare(`SELECT payload_json FROM offer_cache
      WHERE user_id = ? AND cache_key = ? AND expires_at > ?`).get(req.user.id, cacheKey, nowIso);

  if (cached) return res.json({ source: 'cache', data: JSON.parse(cached.payload_json) });

  try {
    const data = await fetchBitlabsOffers(req.query);
    const expiresAt = new Date(Date.now() + config.cacheTtlSeconds * 1000).toISOString();
    db.prepare(`INSERT INTO offer_cache(user_id, cache_key, payload_json, expires_at)
      VALUES(?, ?, ?, ?)
      ON CONFLICT(user_id, cache_key) DO UPDATE SET payload_json=excluded.payload_json, expires_at=excluded.expires_at`).run(
      req.user.id,
      cacheKey,
      JSON.stringify(data),
      expiresAt
    );
    return res.json({ source: 'upstream', data });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message, details: err.payload || null });
  }
}

module.exports = { getOffers };
