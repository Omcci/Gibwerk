'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSession } from 'next-auth/react';
import { useGitStore } from '../../lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalendarClient() {
    const { data: session } = useSession();
    const { commits, setCommits } = useGitStore();
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRepos, setUserRepos] = useState<string[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    // Fetch user's GitHub repositories
    useEffect(() => {
        if (session?.token?.accessToken) {
            const fetchUserRepos = async () => {
                try {
                    const accessToken = session?.token?.accessToken;
                    if (!accessToken) return;

                    const response = await fetch(`${API_URL}/git/user-repos`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });

                    if (!response.ok) throw new Error('Failed to fetch repositories');

                    const repos = await response.json();
                    setUserRepos(repos);

                    // Auto-select first repo if available
                    if (repos.length > 0 && !selectedRepo) {
                        setSelectedRepo(repos[0]);
                    }
                } catch (err) {
                    console.error('Error fetching repos:', err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
                }
            };

            fetchUserRepos();
        }
    }, [session, selectedRepo]);

    // Fetch commits for selected repository
    useEffect(() => {
        if (session && selectedRepo) {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Get the token from the session
                    const token = session.token?.accessToken;

                    const headers: HeadersInit = {
                        'Content-Type': 'application/json',
                    };

                    // Add authorization header if token exists
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    // Fetch commits for the selected GitHub repository
                    const commitsResponse = await fetch(
                        `${API_URL}/git/github-commits?repo=${selectedRepo}`,
                        { method: 'GET', headers }
                    );

                    if (!commitsResponse.ok) {
                        const errorText = await commitsResponse.text();
                        throw new Error(`Failed to fetch commits: ${errorText}`);
                    }

                    const commitsData = await commitsResponse.json();
                    setCommits(commitsData);

                } catch (error) {
                    console.error('Error:', error);
                    setError(error instanceof Error ? error.message : 'An error occurred');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [session, selectedRepo, setCommits]);

    const events = commits.map((commit) => ({
        title: commit.summary || commit.message,
        date: commit.date,
    }));

    return (
        <div className="p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {userRepos.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="repo-select" className="block text-sm font-medium text-gray-700">
                            Select Repository
                        </label>
                        <button
                            onClick={() => {
                                if (session?.token?.accessToken) {
                                    const fetchUserRepos = async () => {
                                        try {
                                            const accessToken = session?.token?.accessToken;
                                            if (!accessToken) return;

                                            const response = await fetch(`${API_URL}/git/user-repos`, {
                                                method: 'GET',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${accessToken}`
                                                }
                                            });

                                            if (!response.ok) throw new Error('Failed to fetch repositories');

                                            const repos = await response.json();
                                            setUserRepos(repos);
                                        } catch (err) {
                                            console.error('Error refreshing repos:', err);
                                            setError(err instanceof Error ? err.message : 'Failed to refresh repositories');
                                        }
                                    };

                                    fetchUserRepos();
                                }
                            }}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Refresh
                        </button>
                    </div>
                    <select
                        id="repo-select"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={selectedRepo || ''}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                    >
                        <option value="">Select a repository</option>
                        {userRepos.map((repo) => (
                            <option key={repo} value={repo}>
                                {repo}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-600">Loading...</p>
                </div>
            ) : (
                <>
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        height="auto"
                    />
                    {status && (
                        <div className="mt-4">
                            <h2 className="text-lg font-bold">Repository Status</h2>
                            <pre className="bg-gray-100 p-2 rounded">{status}</pre>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}