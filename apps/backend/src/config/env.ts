import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET ?? 'fallback-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30m',
} as const;

// Validate critical vars at startup
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env');
}
