import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, isToday, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../../lib/utils';
import { Badge } from './badge';

export interface MobileCalendarEvent {
    date: Date | string;
    count: number;
}

interface MobileCalendarProps {
    events: MobileCalendarEvent[];
    onDateClick: (date: Date) => void;
}

export function MobileCalendar({ events, onDateClick }: MobileCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [ripple, setRipple] = useState<{ x: number, y: number, show: boolean }>({ x: 0, y: 0, show: false });

    // Get days in month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    // Calculate the starting day of the week (0 = Sunday, 1 = Monday, etc.)
    const startDay = getDay(monthStart);

    // Navigate to previous/next month
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Get commit count for a specific date
    const getCommitCount = (date: Date): number => {
        return events.filter(event => {
            const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;
            return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }).length;
    };

    // Get commit count color class
    const getCommitCountClass = (count: number): string => {
        if (count > 5) return "bg-primary text-primary-foreground";
        if (count > 2) return "bg-secondary text-secondary-foreground";
        return "bg-accent text-accent-foreground";
    };

    // Handle day click with ripple effect
    const handleDayClick = (date: Date, e: React.MouseEvent) => {
        // Get click position relative to target
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Show ripple
        setRipple({ x, y, show: true });

        // Hide ripple after animation
        setTimeout(() => {
            setRipple({ x: 0, y: 0, show: false });
        }, 500);

        // Call click handler
        onDateClick(date);
    };

    return (
        <div className="p-2 bg-background rounded-md border">
            {/* Calendar header with month navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMonth}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Day names (Su, Mo, Tu, etc.) */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-medium text-muted-foreground">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                    <div key={index} className="p-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before the first day of the month */}
                {Array.from({ length: startDay }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square p-1"></div>
                ))}

                {/* Days of the month */}
                {daysInMonth.map((day) => {
                    const commitCount = getCommitCount(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const dayIsCurrent = isToday(day);
                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "relative aspect-square p-1 text-center overflow-hidden transition-colors duration-200",
                                isCurrentMonth ? "" : "text-muted-foreground opacity-50",
                                dayIsCurrent && "font-bold bg-muted rounded-md",
                                "hover:bg-accent/20 active:bg-accent/30",
                                commitCount > 0 && "cursor-pointer",
                                commitCount === 0 && "cursor-default"
                            )}
                            onClick={(e) => commitCount > 0 && handleDayClick(day, e)}
                        >
                            {ripple.show && (
                                <span
                                    className="absolute bg-primary/10 rounded-full pointer-events-none animate-ripple"
                                    style={{
                                        left: `${ripple.x}px`,
                                        top: `${ripple.y}px`,
                                        transformOrigin: 'center',
                                    }}
                                />
                            )}
                            <div className="flex flex-col h-full justify-between items-center">
                                <span className={cn(
                                    "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                                    dayIsCurrent && "bg-primary text-primary-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {commitCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "px-1 py-0 text-[10px] min-w-5 min-h-5 flex items-center justify-center",
                                            getCommitCountClass(commitCount)
                                        )}
                                    >
                                        {commitCount > 99 ? '99+' : commitCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 