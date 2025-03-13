'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';

interface RepositorySelectorProps {
    selectedRepo: string | null;
    setSelectedRepo: (repo: string) => void;
    userRepos: string[];
    isLoading: boolean;
    error: Error | null;
    refetchRepos: () => void;
    commitCount: number;
}

export function RepositorySelector({
    selectedRepo,
    setSelectedRepo,
    userRepos,
    isLoading,
    error,
    refetchRepos,
    commitCount
}: RepositorySelectorProps) {
    return (
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
                    {isLoading ? (
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
                                    onClick={refetchRepos}
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
    );
}

