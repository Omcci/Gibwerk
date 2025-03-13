import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time, formerly cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
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
                `${API_URL}/git/github-commits`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ repo: repoName })
                }
            );

            if (!commitsResponse.ok) {
                const errorText = await commitsResponse.text();
                throw new Error(`Failed to fetch commits: ${errorText}`);
            }

            return commitsResponse.json() as Promise<Commit[]>;
        },
        enabled: !!accessToken && !!repoName,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time, formerly cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
    });
}

export function useGenerateCommitSummary() {
    const { data: session } = useSession();
    const accessToken = session?.token?.accessToken;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (commitId: number) => {
            if (!accessToken) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${API_URL}/git/generate-commit-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ commitId })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to generate summary');
            }

            return response.json() as Promise<Commit>;
        },
        onSuccess: (updatedCommit) => {
            // Invalidate and refetch the commits query to update the UI
            queryClient.setQueryData(
                ['github-commits'],
                (oldData: Commit[] | undefined) => {
                    if (!oldData) return [updatedCommit];
                    return oldData.map(commit =>
                        commit.id === updatedCommit.id ? updatedCommit : commit
                    );
                }
            );
        }
    });
}

export function useGenerateDailySummary() {
    const { data: session } = useSession();
    const accessToken = session?.token?.accessToken;

    return useMutation({
        mutationFn: async ({ date, repoFullName }: { date: string, repoFullName: string }) => {
            if (!accessToken) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${API_URL}/git/generate-daily-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ date, repoFullName })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to generate daily summary');
            }

            return response.json() as Promise<string>;
        }
    });
} 