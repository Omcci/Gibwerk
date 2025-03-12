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

    useEffect(() => {
        if (session) {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                    };

                    // Fetch commits
                    const commitsResponse = await fetch(
                        `${API_URL}/git/sync?repoPath=/Users/omci/Documents/Perso/Gibwerk`,
                        { method: 'GET', headers }
                    );
                    if (!commitsResponse.ok) {
                        const errorText = await commitsResponse.text();
                        throw new Error(`Failed to fetch commits: ${errorText}`);
                    }
                    const commitsData = await commitsResponse.json();
                    setCommits(commitsData);

                    // Fetch repo status
                    const statusResponse = await fetch(
                        `${API_URL}/git/status?repoPath=/Users/omci/Documents/Perso/Gibwerk`,
                        { method: 'GET', headers }
                    );
                    if (!statusResponse.ok) {
                        const errorText = await statusResponse.text();
                        throw new Error(`Failed to fetch status: ${errorText}`);
                    }
                    const statusData = await statusResponse.text();
                    setStatus(statusData);
                } catch (error) {
                    console.error('Error:', error);
                    setError(error instanceof Error ? error.message : 'An error occurred');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [session, setCommits]);

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