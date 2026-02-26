import { FastifyRequest, FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

// Extend Fastify request to carry the decoded user
declare module 'fastify' {
    interface FastifyRequest {
        currentUser?: JwtPayload;
    }
}

/**
 * Fastify preHandler hook — verifies JWT Bearer token and attaches
 * the decoded payload to `request.currentUser`.
 */
export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        request.currentUser = decoded;
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            throw AppError.unauthorized('Token expired');
        }
        throw AppError.unauthorized('Invalid token');
    }
}
