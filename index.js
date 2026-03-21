require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const BITLABS_BASE_URL = process.env.BITLABS_BASE_URL || 'https://api.bitlabs.ai/v2/client/offers';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/offers', async (req, res) => {
  try {
    const apiKey = process.env.BITLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing BITLABS_API_KEY in environment variables.'
      });
    }

    const upstreamUrl = new URL(BITLABS_BASE_URL);

    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        value.forEach(v => upstreamUrl.searchParams.append(key, String(v)));
      } else if (value !== undefined) {
        upstreamUrl.searchParams.set(key, String(value));
      }
    }

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Api-Token': apiKey,
        'Accept': 'application/json'
      }
    });

    const text = await upstreamResponse.text();

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: 'BitLabs request failed',
        details: payload
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected server error while fetching offers.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`reward-app backend listening on port ${PORT}`);
});
