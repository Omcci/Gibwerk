import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        token?: JWT & {
            accessToken?: string;
        };
        user?: {
            name: string;
            email: string;
            image?: string;
        } & DefaultSession['user'];
    }
} 