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
import { CommitDetails } from './CommitDetails';

interface CommitDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    commit: Commit | null;
}

export function CommitDetailsDrawer({ isOpen, onClose, commit }: CommitDetailsDrawerProps) {
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

