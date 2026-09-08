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
  // The server's own publicly reachable base URL. Used to build absolute
  // links to uploaded files (logos) so they still render once the client is
  // deployed on a different domain than the API — set this to the real
  // deployed API URL in production.
  publicUrl: process.env.PUBLIC_SERVER_URL ?? `http://localhost:${port}`,
  platformName: process.env.PLATFORM_NAME ?? 'Receipt',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
};

export const isProd = env.nodeEnv === 'production';
