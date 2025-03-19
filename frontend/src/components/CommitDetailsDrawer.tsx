'use client';

import { Commit } from '../types/commit';
import { Button } from './ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerOverlay
} from './ui/drawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { CommitDetails } from './CommitDetails';
import { Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './ui/markdown-renderer';
import { useMediaQuery } from '@/hooks/use-media-query';

interface CommitDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    commit: Commit | null;
    onGenerateSummary?: (commitId: number) => Promise<void>;
    isGeneratingSummary?: boolean;
}

export function CommitDetailsDrawer({
    isOpen,
    onClose,
    commit,
    onGenerateSummary,
    isGeneratingSummary = false,
}: CommitDetailsDrawerProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!commit) return null;

    const formattedDate = new Date(commit.date).toLocaleString();

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Commit Details</DialogTitle>
                        <DialogDescription>
                            View details for commit <code>{commit.hash.substring(0, 7)}</code>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium">Message</h3>
                            <p className="text-sm">{commit.message}</p>
                        </div>
                        <div>
                            <h3 className="font-medium">Author</h3>
                            <p className="text-sm">{commit.author}</p>
                        </div>
                        <div>
                            <h3 className="font-medium">Date</h3>
                            <p className="text-sm">{formattedDate}</p>
                        </div>
                        {commit.summary && (
                            <div>
                                <h3 className="font-medium">Description</h3>
                                <p className="text-sm whitespace-pre-wrap">{commit.summary}</p>
                            </div>
                        )}
                        {commit.generatedSummary && (
                            <div>
                                <h3 className="font-medium">AI Summary</h3>
                                <div className="bg-muted p-3 rounded-md">
                                    <MarkdownRenderer content={commit.generatedSummary} />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex justify-between">
                        {onGenerateSummary && commit.id && !commit.generatedSummary && (
                            <Button
                                variant="outline"
                                onClick={() => onGenerateSummary(commit.id!)}
                                disabled={isGeneratingSummary}
                            >
                                {isGeneratingSummary ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate AI Summary"
                                )}
                            </Button>
                        )}
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Commit Details</DrawerTitle>
                    <DrawerDescription>
                        View details for commit <code>{commit.hash.substring(0, 7)}</code>
                    </DrawerDescription>
                </DrawerHeader>
                <ScrollArea className="flex-1 px-4 overflow-y-auto max-h-[50vh]">
                    <div className="space-y-4 pb-4">
                        <div>
                            <h3 className="font-medium">Message</h3>
                            <p className="text-sm">{commit.message}</p>
                        </div>
                        <div>
                            <h3 className="font-medium">Author</h3>
                            <p className="text-sm">{commit.author}</p>
                        </div>
                        <div>
                            <h3 className="font-medium">Date</h3>
                            <p className="text-sm">{formattedDate}</p>
                        </div>
                        {commit.summary && (
                            <div>
                                <h3 className="font-medium">Description</h3>
                                <p className="text-sm whitespace-pre-wrap">{commit.summary}</p>
                            </div>
                        )}
                        {commit.generatedSummary && (
                            <div>
                                <h3 className="font-medium">AI Summary</h3>
                                <div className="bg-muted p-3 rounded-md">
                                    <MarkdownRenderer content={commit.generatedSummary} />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DrawerFooter className="flex flex-col sm:flex-row justify-between gap-2 mt-2 border-t pt-4">
                    {onGenerateSummary && commit.id && !commit.generatedSummary && (
                        <Button
                            variant="outline"
                            onClick={() => onGenerateSummary(commit.id!)}
                            disabled={isGeneratingSummary}
                            className="w-full sm:w-auto"
                        >
                            {isGeneratingSummary ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Generate AI Summary"
                            )}
                        </Button>
                    )}
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

