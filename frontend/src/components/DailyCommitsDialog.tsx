import { useState } from 'react';
import { format } from 'date-fns';
import { Commit } from '../types/commit';
import { DailySummary } from './DailySummary';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

interface DailyCommitsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    repoFullName: string | null;
    commits: Commit[];
    onCommitClick: (commit: Commit) => void;
}

export function DailyCommitsDialog({
    isOpen,
    onClose,
    date,
    repoFullName,
    commits,
    onCommitClick
}: DailyCommitsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] md:max-w-[900px] max-h-[90vh] flex flex-col p-4 gap-4">
                <DialogHeader className="px-2">
                    <DialogTitle>
                        {format(date, 'MMMM d, yyyy')}
                        {repoFullName && ` - ${repoFullName}`}
                    </DialogTitle>
                    <DialogDescription>
                        {commits.length} commit{commits.length !== 1 ? 's' : ''} on this day
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
                    {/* Daily Summary Section */}
                    <div className="md:w-1/2 flex flex-col">
                        <DailySummary
                            date={date}
                            repoFullName={repoFullName}
                        />
                    </div>

                    {/* Commits List Section */}
                    <div className="md:w-1/2 flex flex-col">
                        <Card className="flex flex-col flex-1">
                            <CardHeader className="py-3">
                                <CardTitle>Commits</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <ScrollArea className="h-[350px] w-full">
                                    <div className="space-y-2 p-4 w-full max-w-full">
                                        {commits.length > 0 ? (
                                            commits.map((commit) => (
                                                <div
                                                    key={commit.hash}
                                                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer w-full max-w-full overflow-hidden"
                                                    onClick={() => onCommitClick(commit)}
                                                >
                                                    <div className="font-medium truncate w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                                        {commit.message}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex justify-between mt-1 w-full">
                                                        <span className="truncate max-w-[40%] overflow-hidden text-ellipsis">{commit.author}</span>
                                                        <span className="ml-2 text-right whitespace-nowrap shrink-0">{commit.date instanceof Date
                                                            ? formatDistanceToNow(commit.date, { addSuffix: true })
                                                            : formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No commits found for this day
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter className="px-2">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 