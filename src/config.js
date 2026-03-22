require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bitlabs: {
    apiToken: process.env.BITLABS_OFFERS_V2_TOKEN || process.env.BITLABS_API_KEY || '',
    baseUrl: process.env.BITLABS_BASE_URL || 'https://api.bitlabs.ai/v2/client/offers',
    appId: process.env.BITLABS_APP_ID || '',
    webhookSecret: process.env.BITLABS_WEBHOOK_SECRET || ''
  },
  cacheTtlSeconds: Number(process.env.OFFERS_CACHE_TTL_SECONDS || 120),
  dbPath: process.env.DB_PATH || './data/reward-app.db'
};
