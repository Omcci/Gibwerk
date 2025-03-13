import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

// Use placeholder values for build time, real values will be used at runtime
const GITHUB_ID = process.env.GITHUB_ID || 'placeholder-client-id';
const GITHUB_SECRET = process.env.GITHUB_SECRET || 'placeholder-client-secret';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'placeholder-nextauth-secret';

export const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: GITHUB_ID,
            clientSecret: GITHUB_SECRET,
            authorization: {
                params: {
                    scope: 'read:user user:email repo',
                }
            }
        }),
    ],
    secret: NEXTAUTH_SECRET,
    pages: {
        signIn: '/',
        error: '/',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            return true;
        },
        async redirect({ url, baseUrl }) {
            // Ensure baseUrl is valid for build time
            const safeBaseUrl = baseUrl || 'http://localhost:3000';
            return url.startsWith(safeBaseUrl) ? url : safeBaseUrl;
        },
        async jwt({ token, account }) {
            if (account?.access_token) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            return {
                ...session,
                token: token
            };
        },
    },
}; 