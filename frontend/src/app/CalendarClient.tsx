'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSession } from 'next-auth/react';
import { useGitStore } from '../../lib/store';

export default function CalendarClient() {
    const { data: session } = useSession();
    const { commits, setCommits } = useGitStore();
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Fetch commits
                    const commitsResponse = await fetch(
                        'http://localhost:3001/git/sync?repoPath=/path/to/repo',
                        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
                    );
                    if (!commitsResponse.ok) throw new Error('Failed to fetch commits');
                    const commitsData = await commitsResponse.json();
                    setCommits(commitsData);

                    // Fetch repo status
                    const statusResponse = await fetch(
                        'http://localhost:3001/git/status?repoPath=/path/to/repo',
                        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
                    );
                    if (!statusResponse.ok) throw new Error('Failed to fetch status');
                    const statusData = await statusResponse.text();
                    setStatus(statusData);
                } catch (error) {
                    console.error('Error:', error);
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
        <div>
            {loading ? (
                <p>Loading...</p>
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