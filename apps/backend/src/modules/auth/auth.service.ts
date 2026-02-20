import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/prisma/client";
import { env } from "../../config/env";
import { BCRYPT_SALT_ROUNDS } from "../../config/constants";
import { AuthTokens, JwtPayload, RegisterInput, LoginInput } from "../../core/types";
import { ConflictError, UnauthorizedError } from "../../core/errors";
import { logger } from "../../infrastructure/logger/logger";

// ── Token helpers ────────────────────────────────────

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function generateTokens(payload: JwtPayload): AuthTokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

// ── Public API ───────────────────────────────────────

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase().trim(),
      name: input.name?.trim() || null,
      password: hashedPassword,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  logger.info(`User registered: ${user.email}`);
  return { user, tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const { password: _, ...safeUser } = user;

  logger.info(`User logged in: ${user.email}`);
  return { user: safeUser, tokens };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return user;
}
