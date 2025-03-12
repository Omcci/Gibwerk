import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Commit } from '../types/commit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useGitHubRepositories() {
    const { data: session } = useSession();
    const accessToken = session?.token?.accessToken;

    return useQuery({
        queryKey: ['github-repos'],
        queryFn: async () => {
            if (!accessToken) return [];

            const response = await fetch(`${API_URL}/git/user-repos`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch repositories');
            return response.json() as Promise<string[]>;
        },
        enabled: !!accessToken,
    });
}

export function useGitHubCommits(repoName: string | null) {
    const { data: session } = useSession();
    const accessToken = session?.token?.accessToken;

    return useQuery({
        queryKey: ['github-commits', repoName],
        queryFn: async () => {
            if (!accessToken || !repoName) {
                return [];
            }

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            };

            const commitsResponse = await fetch(
                `${API_URL}/git/github-commits?repo=${repoName}`,
                { method: 'GET', headers }
            );

            if (!commitsResponse.ok) {
                const errorText = await commitsResponse.text();
                throw new Error(`Failed to fetch commits: ${errorText}`);
            }

            return commitsResponse.json() as Promise<Commit[]>;
        },
        enabled: !!accessToken && !!repoName,
    });
} 