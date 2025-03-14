'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useGitStore } from '../../lib/store';
import { useGitHubRepositories, useGitHubCommits, useGenerateCommitSummary } from '../hooks/useGitHubData';
import { Commit } from '../types/commit';
import { RepositorySelector } from '../components/RepositorySelector';
import { CommitCalendar } from '../components/CommitCalendar';
import { CommitDetailsDrawer } from '../components/CommitDetailsDrawer';
import { StatusPanel } from '../components/StatusPanel';
import { DailyCommitsDialog } from '../components/DailyCommitsDialog';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';

import '../styles/calendar.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalendarClient() {
    const { data: session } = useSession();
    const { commits, setCommits, clearCommits } = useGitStore();
    const [status, setStatus] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'dayGridWeek' | 'dayGridDay'>('dayGridMonth');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // State for drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

    // State for daily commits dialog
    const [isDailyDialogOpen, setIsDailyDialogOpen] = useState(false);

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

    // Generate summary mutation
    const {
        mutate: generateSummary,
        isPending: isGeneratingSummary
    } = useGenerateCommitSummary();

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

    // Get commits for the selected date
    const commitsForSelectedDate = useMemo(() => {
        return commits.filter((commit: Commit) => {
            const commitDate = new Date(commit.date);
            return isSameDay(commitDate, selectedDate);
        });
    }, [commits, selectedDate]);

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

        // Update selected date based on the commit date
        if (commit.date) {
            setSelectedDate(new Date(commit.date));
        }
    };

    // Handle date click in calendar
    const handleDateClick = (info: any) => {
        const clickedDate = new Date(info.date);
        setSelectedDate(clickedDate);
        setIsDailyDialogOpen(true);
    };

    // Close drawer
    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedCommit(null);
    };

    // Close daily dialog
    const handleCloseDailyDialog = () => {
        setIsDailyDialogOpen(false);
    };

    // Handle commit click from daily dialog
    const handleDailyCommitClick = (commit: Commit) => {
        setSelectedCommit(commit);
        setIsDailyDialogOpen(false);
        setIsDrawerOpen(true);
    };

    // Generate summary for a commit
    const handleGenerateSummary = async (commitId: number) => {
        if (!commitId) return;

        // Get the repository name from the selected repository
        const repoContext = selectedRepo || 'Gibwerk';

        try {
            generateSummary({
                commitId,
                repoContext
            }, {
                onSuccess: (updatedCommit) => {
                    // Update the selected commit if it's the one we just updated
                    if (selectedCommit && selectedCommit.id === commitId) {
                        setSelectedCommit(updatedCommit);
                    }
                    setStatus('Summary generated successfully');
                },
                onError: (error) => {
                    console.error('Error generating summary:', error);
                    setStatus(`Failed to generate summary: ${error.message}`);
                }
            });
        } catch (error: any) {
            console.error('Error generating summary:', error);
            setStatus(`Failed to generate summary: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RepositorySelector
                    selectedRepo={selectedRepo}
                    setSelectedRepo={setSelectedRepo}
                    userRepos={userRepos}
                    isLoading={isLoading}
                    error={error}
                    refetchRepos={refetchRepos}
                    commitCount={commitCount}
                />
                <CommitCalendar
                    selectedRepo={selectedRepo}
                    events={events}
                    isLoading={isLoadingCommits}
                    calendarView={calendarView}
                    setCalendarView={setCalendarView}
                    onCommitClick={handleCommitClick}
                    onDateClick={handleDateClick}
                />
            </div>

            <StatusPanel status={status} />

            {/* Commit Details Drawer */}
            <CommitDetailsDrawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                commit={selectedCommit}
                onGenerateSummary={handleGenerateSummary}
                isGeneratingSummary={isGeneratingSummary}
            />

            {/* Daily Commits Dialog */}
            <DailyCommitsDialog
                isOpen={isDailyDialogOpen}
                onClose={handleCloseDailyDialog}
                date={selectedDate}
                repoFullName={selectedRepo}
                commits={commitsForSelectedDate}
                onCommitClick={handleDailyCommitClick}
            />
        </div>
    );
}