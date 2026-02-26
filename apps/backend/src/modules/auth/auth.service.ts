import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../infrastructure/prisma/client.js';
import { env } from '../../config/env.js';
import { CONSTANTS } from '../../config/constants.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../core/errors/AppError.js';
import type { JwtPayload } from '../../core/middleware/auth.js';

export interface AuthResponse {
    token: string;
    user: { id: number; email: string; name: string; role: string };
}

function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: CONSTANTS.JWT_EXPIRY });
}

export const authService = {
    async register(email: string, password: string, name: string): Promise<AuthResponse> {
        if (!email || !password) {
            throw new BadRequestError('Email and password are required');
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictError('An account with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, CONSTANTS.BCRYPT_SALT_ROUNDS);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: 'user' },
        });

        const payload: JwtPayload = { userId: user.id, email: user.email, name: user.name || '', role: user.role };
        const token = signToken(payload);

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name || '', role: user.role },
        };
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        if (!email || !password) {
            throw new BadRequestError('Email and password are required');
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const payload: JwtPayload = { userId: user.id, email: user.email, name: user.name || '', role: user.role };
        const token = signToken(payload);

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name || '', role: user.role },
        };
    },
};

