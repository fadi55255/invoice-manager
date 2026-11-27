import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin:
    process.env.CLIENT_URL ||
    process.env.CORS_ORIGIN ||
    'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/invoice_manager',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-in-production',
  devBypassAuth:
    process.env.DEV_BYPASS_AUTH === 'true' &&
    process.env.NODE_ENV !== 'production',
};
