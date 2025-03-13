'use client';

import { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSession } from 'next-auth/react';
import { useGitStore } from '../../lib/store';
import { useGitHubRepositories, useGitHubCommits } from '../hooks/useGitHubData';
import { Commit } from '../types/commit';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { cn } from '../../lib/utils';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle
} from '../components/ui/drawer';
import { CommitDetails } from '../components/CommitDetails';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalendarClient() {
    const { data: session } = useSession();
    const { commits, setCommits, clearCommits } = useGitStore();
    const [status, setStatus] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'dayGridWeek' | 'dayGridDay'>('dayGridMonth');

    // State for drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

    // Fetch user's GitHub repositories
    const {
        data: userRepos = [],
        error: repoError,
        refetch: refetchRepos,
        isLoading: isLoadingRepos
    } = useGitHubRepositories();

    // Auto-select first repo if available
    useEffect(() => {
        if (userRepos.length > 0 && !selectedRepo) {
            setSelectedRepo(userRepos[0]);
        }
    }, [userRepos, selectedRepo]);

    // Fetch commits for selected repository
    const {
        data: commitsData,
        error: commitsError,
        isLoading: isLoadingCommits
    } = useGitHubCommits(selectedRepo);

    // Update commits in store when data changes
    useEffect(() => {
        if (commitsData) {
            setCommits(commitsData);
        }
    }, [commitsData, setCommits]);

    // Memoize error and events to prevent unnecessary re-renders
    const error = useMemo(() => repoError || commitsError, [repoError, commitsError]);

    const events = useMemo(() => commits.map((commit: Commit) => ({
        title: commit.summary || commit.message,
        date: commit.date,
        extendedProps: {
            commit // Store the entire commit object
        }
    })), [commits]);

    // Clean up function to prevent memory leaks
    useEffect(() => {
        return () => {
            clearCommits();
        };
    }, [clearCommits]);

    const isLoading = isLoadingRepos || isLoadingCommits;
    const commitCount = commits.length;

    // Handle commit click
    const handleCommitClick = (info: any) => {
        const commit = info.event.extendedProps.commit;
        setSelectedCommit(commit);
        setIsDrawerOpen(true);
    };

    // Close drawer
    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedCommit(null);
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Repository Selection Panel */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Repository</CardTitle>
                        <CardDescription>Select a GitHub repository to view commits</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>
                                    {error instanceof Error ? error.message : 'An error occurred'}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            {isLoadingRepos ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-3/4" />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label htmlFor="repo-select" className="text-sm font-medium">
                                            Repository
                                        </label>
                                        <Select
                                            id="repo-select"
                                            label="Select Repository"
                                            value={selectedRepo || ''}
                                            onChange={(e) => setSelectedRepo(e.target.value)}
                                            className="w-full"
                                            disabled={isLoading}
                                        >
                                            <option value="">Select a repository</option>
                                            {userRepos.map((repo: string) => (
                                                <option key={repo} value={repo}>
                                                    {repo}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            onClick={() => refetchRepos()}
                                            variant="outline"
                                            size="sm"
                                            disabled={isLoading}
                                            className="w-full"
                                        >
                                            Refresh Repositories
                                        </Button>
                                    </div>
                                </>
                            )}

                            {selectedRepo && !isLoading && (
                                <div className="mt-4 p-3 bg-muted rounded-md">
                                    <h3 className="text-sm font-medium mb-1">Stats</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {commitCount} commit{commitCount !== 1 ? 's' : ''} found
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Calendar Panel */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-semibold">Commit Calendar</CardTitle>
                                <CardDescription>
                                    {selectedRepo
                                        ? `Viewing commits for ${selectedRepo}`
                                        : 'Select a repository to view commits'}
                                </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                                    onClick={() => setCalendarView('dayGridMonth')}
                                >
                                    Month
                                </Button>
                                <Button
                                    size="sm"
                                    variant={calendarView === 'dayGridWeek' ? 'default' : 'outline'}
                                    onClick={() => setCalendarView('dayGridWeek')}
                                >
                                    Week
                                </Button>
                                <Button
                                    size="sm"
                                    variant={calendarView === 'dayGridDay' ? 'default' : 'outline'}
                                    onClick={() => setCalendarView('dayGridDay')}
                                >
                                    Day
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingCommits ? (
                            <div className="space-y-3">
                                <Skeleton className="h-[400px] w-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                "rounded-md border overflow-hidden",
                                "fc-theme-standard", // Add FullCalendar theme class
                                "custom-calendar" // Custom class for additional styling
                            )}>
                                <FullCalendar
                                    plugins={[dayGridPlugin]}
                                    initialView={calendarView}
                                    events={events}
                                    height="auto"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: ''
                                    }}
                                    eventTimeFormat={{
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        meridiem: 'short'
                                    }}
                                    eventDisplay="block"
                                    eventColor="#3b82f6" // Blue color for events
                                    eventTextColor="#ffffff"
                                    eventClick={handleCommitClick}
                                    dayMaxEvents={3}
                                    moreLinkClick="popover"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status Panel (if needed) */}
            {status && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Repository Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">{status}</pre>
                    </CardContent>
                </Card>
            )}

            {/* Commit Details Drawer */}
            <Drawer
                open={isDrawerOpen}
                onClose={handleCloseDrawer}
                size="lg"
                className="bg-white dark:bg-gray-900"
            >
                <DrawerHeader>
                    <DrawerTitle>Commit Details</DrawerTitle>
                    <DrawerDescription>
                        {selectedCommit?.summary || 'Commit information'}
                    </DrawerDescription>
                    <DrawerClose onClick={handleCloseDrawer} />
                </DrawerHeader>
                <DrawerContent>
                    {selectedCommit && <CommitDetails commit={selectedCommit} />}
                </DrawerContent>
                <DrawerFooter>
                    <Button variant="outline" onClick={handleCloseDrawer}>Close</Button>
                </DrawerFooter>
            </Drawer>

            {/* Add custom styles for the calendar */}
            <style jsx global>{`
                /* Custom calendar styling */
                .custom-calendar .fc-daygrid-day.fc-day-today {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                
                .custom-calendar .fc-daygrid-day-number {
                    font-size: 0.875rem;
                    padding: 0.5rem;
                }
                
                .custom-calendar .fc-col-header-cell {
                    padding: 0.5rem 0;
                    background-color: rgba(241, 245, 249, 0.8);
                }
                
                .custom-calendar .fc-event {
                    border-radius: 4px;
                    border: none;
                    padding: 2px 4px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: transform 0.1s ease-in-out;
                }
                
                .custom-calendar .fc-event:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .custom-calendar .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                
                .custom-calendar .fc-button {
                    background-color: #f1f5f9;
                    border-color: #e2e8f0;
                    color: #475569;
                }
                
                .custom-calendar .fc-button:hover {
                    background-color: #e2e8f0;
                }
                
                .custom-calendar .fc-button-active {
                    background-color: #3b82f6 !important;
                    border-color: #3b82f6 !important;
                    color: white !important;
                }
                
                /* Drawer styling */
                [data-radix-popper-content-wrapper] {
                    background-color: white !important;
                }
                
                /* Responsive adjustments */
                @media (max-width: 640px) {
                    .custom-calendar .fc-toolbar {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .custom-calendar .fc-toolbar-title {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}