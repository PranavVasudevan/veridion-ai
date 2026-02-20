import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../logger/logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });

if (env.NODE_ENV === "development") {
  (prisma as any).$on("query", (e: any) => {
    logger.debug(`Prisma Query: ${e.query} — ${e.duration}ms`);
  });
}

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected");
  } catch (error) {
    logger.error("❌ Database connection failed", error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}
