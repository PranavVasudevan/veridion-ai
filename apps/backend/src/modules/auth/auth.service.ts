import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../infrastructure/prisma/client';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError } from '../../core/errors/AppError';
export interface JwtPayload { userId: number; email: string; role: string; }

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
    isNewUser?: boolean;
}

const googleClient = env.GOOGLE_CLIENT_ID
    ? new OAuth2Client(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET || undefined,
        'postmessage', // required for auth-code flow from frontend popup
    )
    : null;

function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as any,
    });
}

async function findOrCreateGoogleUser(email: string, name: string) {
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
        isNewUser = true;
        // Google users get a random password hash (they don't use password login)
        const randomPassword = await bcrypt.hash(
            Math.random().toString(36) + Date.now().toString(36),
            10,
        );

        user = await prisma.user.create({
            data: {
                email,
                password: randomPassword,
                name,
            },
        });
    }

    return { user, isNewUser };
}

export const authService = {
    /**
     * Register a new user — hashes password, creates DB record, returns JWT.
     */
    async register(input: RegisterInput): Promise<AuthResult> {
        const existing = await prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw new BadRequestError('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

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
            throw new UnauthorizedError('Invalid email or password');
        }

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    },

    /**
     * Google OAuth — handles BOTH auth-code flow and id-token flow.
     * - auth-code flow: frontend sends { code } → backend exchanges for tokens → gets user info
     * - id-token flow: frontend sends { idToken } → backend verifies directly
     */
    async googleLogin(codeOrToken: string, isCode = true): Promise<AuthResult> {
        if (!googleClient) {
            throw new BadRequestError('Google OAuth is not configured. Set GOOGLE_CLIENT_ID in your .env');
        }

        let email: string;
        let name: string;

        if (isCode) {
            // Auth-code flow: exchange code for tokens
            try {
                const { tokens } = await googleClient.getToken(codeOrToken);
                const idToken = tokens.id_token;

                if (!idToken) {
                    throw new Error('No id_token in response');
                }

                const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();

                if (!payload?.email) {
                    throw new Error('No email in token payload');
                }

                email = payload.email;
                name = payload.name || email.split('@')[0];
            } catch (err: any) {
                throw new UnauthorizedError(`Google authentication failed: ${err.message || 'Invalid code'}`);
            }
        } else {
            // ID token flow: verify directly
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: codeOrToken,
                    audience: env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();

                if (!payload?.email) {
                    throw new Error('No email in token payload');
                }

                email = payload.email;
                name = payload.name || email.split('@')[0];
            } catch {
                throw new UnauthorizedError('Invalid Google token');
            }
        }

        const { user, isNewUser } = await findOrCreateGoogleUser(email, name);
        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            isNewUser,
        };
    },
};
