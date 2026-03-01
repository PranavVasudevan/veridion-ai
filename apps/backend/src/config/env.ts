import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw !== undefined) return parseInt(raw, 10);
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  // App
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnvInt("PORT", 4000),

  // Database
  DATABASE_URL: getEnv("DATABASE_URL"),

  // JWT
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "7d"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "refresh-secret-change-me"),
  JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "30d"),

  // Redis
  REDIS_URL: getEnv("REDIS_URL", "redis://localhost:6379"),

  // CORS
  CORS_ORIGIN: getEnv("CORS_ORIGIN", "http://localhost:5173"),

  // Logging
  LOG_LEVEL: getEnv("LOG_LEVEL", "info"),

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
} as const;

export type Env = typeof env;
