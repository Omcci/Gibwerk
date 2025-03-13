'use client';

import { Commit } from '../types/commit';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';

interface CommitDetailsProps {
    commit: Commit;
}

export function CommitDetails({ commit }: CommitDetailsProps) {
    // Format the date to show how long ago the commit was made
    const formattedDate = formatDistanceToNow(new Date(commit.date), { addSuffix: true });

    // Extract the first 7 characters of the hash for display
    const shortHash = commit.hash.substring(0, 7);

    return (
        <div className="space-y-6">
            {/* Commit Message */}
            <div>
                <h3 className="text-lg font-medium mb-2">Message</h3>
                <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {commit.message}
                </div>
            </div>

            {/* Commit Details */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Author</h3>
                    <p>{commit.author}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
                    <p>{formattedDate}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Hash</h3>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{shortHash}</Badge>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(commit.hash);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* Additional metadata could be added here */}
        </div>
    );
} 