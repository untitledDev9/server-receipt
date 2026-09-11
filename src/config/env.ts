import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT ?? 5000);

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/receipt-platform'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  platformName: process.env.PLATFORM_NAME ?? 'Receipt',
};

export const isProd = env.nodeEnv === 'production';
