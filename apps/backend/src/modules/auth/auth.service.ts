import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/prisma/client';
import { env } from '../../config/env';
import { APP_CONSTANTS } from '../../config/constants';
import { AppError } from '../../core/errors/AppError';
import type { JwtPayload } from '../../core/middleware/auth.middleware';

interface RegisterInput {
    email: string;
    password: string;
    name?: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthResult {
    token: string;
    user: { id: number; email: string; name: string | null; role: string };
}

function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: APP_CONSTANTS.JWT_EXPIRY_SECONDS,
    });
}

export const authService = {
    /**
     * Register a new user — hashes password, creates DB record, returns JWT.
     */
    async register(input: RegisterInput): Promise<AuthResult> {
        const existing = await prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw AppError.badRequest('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(input.password, APP_CONSTANTS.BCRYPT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email: input.email,
                password: hashedPassword,
                name: input.name ?? null,
            },
        });

        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    },

    /**
     * Login — validates credentials, returns JWT.
     */
    async login(input: LoginInput): Promise<AuthResult> {
        const user = await prisma.user.findUnique({ where: { email: input.email } });
        if (!user) {
            throw AppError.unauthorized('Invalid email or password');
        }

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
            throw AppError.unauthorized('Invalid email or password');
        }

        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    },
};
