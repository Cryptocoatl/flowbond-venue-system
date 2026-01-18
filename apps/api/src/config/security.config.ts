export const securityConfig = {
  bcrypt: {
    saltRounds: 12,
  },

  jwt: {
    algorithm: 'HS256' as const,
    issuer: 'flowbond-api',
    audience: 'flowbond-client',
  },

  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
  },

  drinkPass: {
    codeCharset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Excludes confusing chars
    codeLength: 8,
    maxValidityHours: 72,
  },

  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

export function generateSecureCode(length: number = securityConfig.drinkPass.codeLength): string {
  const charset = securityConfig.drinkPass.codeCharset;
  let code = '';
  for (let i = 0; i < length; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return code;
}
