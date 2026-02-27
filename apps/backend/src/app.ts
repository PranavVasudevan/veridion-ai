import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import routes from "./routes";
import { AppError, ValidationError } from "./core/errors";
import { logger } from "./infrastructure/logger/logger";

const app = express();

// ── Global Middleware ────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging ──────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Routes ───────────────────────────────────────────

app.use("/api", routes);

// ── 404 handler ──────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// ── Global error handler ─────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Known operational errors
  if (err instanceof AppError) {
    const body: Record<string, any> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err instanceof ValidationError) {
      body.error.errors = err.errors;
    }

    return res.status(err.statusCode).json(body);
  }

  // Unknown / programmer errors
  logger.error(err, "Unhandled error");

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
    },
  });
});

export default app;
