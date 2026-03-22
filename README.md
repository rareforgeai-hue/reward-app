# reward-app backend

Production-oriented Node.js backend for a rewards platform integrating BitLabs Offers v2.

## Features
- JWT auth (register/login)
- Offers proxy with per-user caching
- Click tracking with anti-fraud checks (velocity + duplicate suppression)
- Conversion webhook ingestion with HMAC signature verification
- Wallet/earnings ledger with immutable entries
- Security middleware: helmet, rate limits, input validation

## API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/offers` (auth)
- `POST /api/offers/:offerId/click` (auth)
- `GET /api/wallet` (auth)
- `POST /webhooks/bitlabs/conversion` (HMAC-signed)

## BitLabs
BitLabs Offers v2 reference: https://developer.bitlabs.ai/reference/getoffersv2

## Run (Backend)
```bash
cp .env.example .env
npm install
npm start
```

## Frontend Bootstrap (React)
A starter React app is available under `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` and `/webhooks` to `http://localhost:3000`.

## Test
```bash
npm test
```

## Security Notes
- Set strong `JWT_SECRET` and `BITLABS_WEBHOOK_SECRET`
- Put app behind TLS and reverse proxy
- Rotate API keys and secrets regularly
- Add Redis + queue workers for higher scale workloads
