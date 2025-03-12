'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSession } from 'next-auth/react';
import { useGitStore } from '../../lib/store';
import { useGitHubRepositories, useGitHubCommits } from '../hooks/useGitHubData';
import { Commit } from '../types/commit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalendarClient() {
    const { data: session } = useSession();
    const { commits, setCommits } = useGitStore();
    const [status, setStatus] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    // Fetch user's GitHub repositories
    const {
        data: userRepos = [],
        error: repoError,
        refetch: refetchRepos
    } = useGitHubRepositories();

    // Auto-select first repo if available
    if (userRepos.length > 0 && !selectedRepo) {
        setSelectedRepo(userRepos[0]);
    }

    // Fetch commits for selected repository
    const {
        data: commitsData,
        error: commitsError,
        isLoading
    } = useGitHubCommits(selectedRepo);

    // Update commits in store when data changes
    if (commitsData) {
        setCommits(commitsData);
    }

    const error = repoError || commitsError;

    const events = commits.map((commit: Commit) => ({
        title: commit.summary || commit.message,
        date: commit.date,
    }));

    return (
        <div className="p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <p>{error instanceof Error ? error.message : 'An error occurred'}</p>
                </div>
            )}

            {userRepos.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="repo-select" className="block text-sm font-medium text-gray-700">
                            Select Repository
                        </label>
                        <button
                            onClick={() => refetchRepos()}
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
                        {userRepos.map((repo: string) => (
                            <option key={repo} value={repo}>
                                {repo}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {isLoading ? (
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