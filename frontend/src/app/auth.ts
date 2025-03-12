import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
    throw new Error('Please define GITHUB_ID and GITHUB_SECRET environment variables');
}

console.log('Auth Configuration:', {
    GITHUB_ID: process.env.GITHUB_ID,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    // Don't log the secret!
});

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: {
                params: {
                    scope: 'read:user user:email repo',
                }
            }
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,
    logger: {
        error(code, ...message) {
            console.error('NextAuth Error:', { code, message, stack: new Error().stack });
        },
        warn(code, ...message) {
            console.warn('NextAuth Warning:', { code, message });
        },
        debug(code, ...message) {
            console.log('NextAuth Debug:', { code, message });
        },
    },
    pages: {
        signIn: '/',
        error: '/',
    },
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            console.log('SignIn Callback:', {
                user,
                account,
                profile,
                email,
                credentials,
                timestamp: new Date().toISOString()
            });
            return true;
        },
        async redirect({ url, baseUrl }) {
            console.log('Redirect Callback:', {
                url,
                baseUrl,
                currentUrl: typeof window !== 'undefined' ? window.location.href : null,
                timestamp: new Date().toISOString()
            });
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
        async jwt({ token, user, account, profile }) {
            console.log('JWT Callback:', {
                token,
                user,
                account,
                profile,
                timestamp: new Date().toISOString()
            });
            if (account) {
                token.accessToken = account.access_token;
            }
            return { ...token, ...user };
        },
        async session({ session, token, user }) {
            console.log('Session Callback:', {
                session,
                token,
                user,
                timestamp: new Date().toISOString()
            });
            session.user = token as any;
            return session;
        },
    },
}; 