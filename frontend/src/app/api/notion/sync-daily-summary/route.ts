import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth';

export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const githubToken = session.token?.accessToken;

        if (!githubToken) {
            return NextResponse.json(
                { message: 'No access token available' },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();
        const { date, repoFullName, summary } = body;

        if (!date || !repoFullName || !summary) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Exchange GitHub token for JWT token
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        const tokenResponse = await fetch(`${backendUrl}/auth/exchange-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: githubToken }),
        });

        if (!tokenResponse.ok) {
            return NextResponse.json(
                { message: 'Failed to authenticate with backend' },
                { status: 401 }
            );
        }

        const { accessToken } = await tokenResponse.json();

        // Call backend API with the JWT token
        const response = await fetch(`${backendUrl}/notion/sync-daily-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ date, repoFullName, summary }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { message: errorData.message || 'Failed to sync with Notion' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Error syncing with Notion:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
} 