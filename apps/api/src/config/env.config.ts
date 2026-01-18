export const envConfig = () => ({
  port: parseInt(process.env.API_PORT || '3001', 10),
  prefix: process.env.API_PREFIX || 'api',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },

  drinkPass: {
    validityHours: parseInt(process.env.DRINK_PASS_VALIDITY_HOURS || '24', 10),
    codeLength: parseInt(process.env.DRINK_PASS_CODE_LENGTH || '8', 10),
  },

  i18n: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,es,fr').split(','),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@flowbond.io',
  },

  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});

export type EnvConfig = ReturnType<typeof envConfig>;
