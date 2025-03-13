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
    DrawerTitle
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
import { CommitDetails } from './CommitDetails';
import { useMediaQuery } from '../hooks/use-media-query';

interface CommitDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    commit: Commit | null;
}

export function CommitDetailsDrawer({ isOpen, onClose, commit }: CommitDetailsDrawerProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto dialog-content">
                    <DialogHeader>
                        <DialogTitle>Commit Details</DialogTitle>
                        <DialogDescription>
                            {commit?.summary || 'Commit information'}
                        </DialogDescription>
                    </DialogHeader>
                    {commit && <CommitDetails commit={commit} />}
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer
            open={isOpen}
            onClose={onClose}
            size="lg"
            className="bg-white dark:bg-gray-900"
        >
            <DrawerHeader>
                <DrawerTitle>Commit Details</DrawerTitle>
                <DrawerDescription>
                    {commit?.summary || 'Commit information'}
                </DrawerDescription>
                <DrawerClose onClick={onClose} />
            </DrawerHeader>
            <DrawerContent>
                {commit && <CommitDetails commit={commit} />}
            </DrawerContent>
            <DrawerFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </DrawerFooter>
        </Drawer>
    );
}

