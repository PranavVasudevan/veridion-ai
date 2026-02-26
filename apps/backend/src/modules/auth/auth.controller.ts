import { FastifyInstance } from 'fastify';
import { authService } from './auth.service';
import { AppError } from '../../core/errors/AppError';

interface RegisterBody {
    email: string;
    password: string;
    name?: string;
}

interface LoginBody {
    email: string;
    password: string;
}

export async function authController(app: FastifyInstance) {
    /**
     * POST /auth/register
     */
    app.post<{ Body: RegisterBody }>('/auth/register', async (request, reply) => {
        const { email, password, name } = request.body;

        if (!email || !password) {
            throw AppError.badRequest('Email and password are required');
        }
        if (password.length < 6) {
            throw AppError.badRequest('Password must be at least 6 characters');
        }

        const result = await authService.register({ email, password, name });
        return reply.status(201).send(result);
    });

    /**
     * POST /auth/login
     */
    app.post<{ Body: LoginBody }>('/auth/login', async (request, reply) => {
        const { email, password } = request.body;

        if (!email || !password) {
            throw AppError.badRequest('Email and password are required');
        }

        const result = await authService.login({ email, password });
        return reply.send(result);
    });
}
