'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { cn } from '../../lib/utils';
import { Commit } from '../types/commit';

interface CommitCalendarProps {
    selectedRepo: string | null;
    events: any[];
    isLoading: boolean;
    calendarView: 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay';
    setCalendarView: (view: 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay') => void;
    onCommitClick: (info: any) => void;
}

export function CommitCalendar({
    selectedRepo,
    events,
    isLoading,
    calendarView,
    setCalendarView,
    onCommitClick
}: CommitCalendarProps) {
    return (
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
                {isLoading ? (
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
                            eventClick={onCommitClick}
                            dayMaxEvents={3}
                            moreLinkClick="popover"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
