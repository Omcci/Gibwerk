'use client';

import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { cn } from '../../lib/utils';
import { Commit } from '../types/commit';
import { MobileCalendar, MobileCalendarEvent } from './ui/mobile-calendar';
import { isEqual, parseISO, format } from 'date-fns';
import { useMediaQuery } from '../hooks/use-media-query';

interface CommitCalendarProps {
    selectedRepo: string | null;
    events: any[];
    isLoading: boolean;
    calendarView: 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay';
    setCalendarView: (view: 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay') => void;
    onCommitClick: (info: any) => void;
    onDateClick?: (info: any) => void;
}

export function CommitCalendar({
    selectedRepo,
    events,
    isLoading,
    calendarView,
    setCalendarView,
    onCommitClick,
    onDateClick
}: CommitCalendarProps) {
    const isMobile = !useMediaQuery("(min-width: 768px)");

    // Process events for mobile calendar - properly count events per day
    const mobileEvents = useMemo(() => {

        // Create a map to count commits per day
        const dateCountMap = new Map<string, number>();

        // Count commits for each date
        events.forEach(event => {
            const eventDate = event.date || (event.start ? new Date(event.start) : null);
            if (!eventDate) return;

            const dateKey = format(
                typeof eventDate === 'string' ? new Date(eventDate) : eventDate,
                'yyyy-MM-dd'
            );

            dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
        });

        // Convert map to array of MobileCalendarEvent objects
        const mobileEvents: MobileCalendarEvent[] = Array.from(dateCountMap.entries()).map(
            ([dateStr, count]) => ({
                date: new Date(dateStr),
                count
            })
        );

        return mobileEvents;
    }, [events]);

    // Handle mobile date click
    const handleMobileDateClick = (date: Date) => {
        if (onDateClick) {
            onDateClick({ date });
        }
    };

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
                    {!isMobile && (
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
                    )}
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
                ) : isMobile ? (
                    // Mobile view with our custom calendar that shows commit counts
                    <MobileCalendar
                        events={mobileEvents}
                        onDateClick={handleMobileDateClick}
                    />
                ) : (
                    // Desktop view with FullCalendar
                    <div className={cn(
                        "rounded-md border overflow-hidden",
                        "fc-theme-standard", // Add FullCalendar theme class
                        "custom-calendar" // Custom class for additional styling
                    )}>
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
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
                            dateClick={onDateClick}
                            dayMaxEvents={3}
                            moreLinkClick="popover"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
