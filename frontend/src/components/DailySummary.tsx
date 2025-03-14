import { useEffect, useState } from 'react';
import { useGenerateDailySummary, useGetDailySummary } from '../hooks/useGitHubData';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from './ui/scroll-area';

interface DailySummaryProps {
    date: Date;
    repoFullName: string | null;
}

export function DailySummary({ date, repoFullName }: DailySummaryProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const formattedDate = format(date, 'yyyy-MM-dd');

    // Query to get existing summary
    const {
        data: existingSummary,
        isLoading: isLoadingSummary,
        isError: isErrorFetching,
        error: fetchError
    } = useGetDailySummary(
        formattedDate,
        repoFullName || undefined
    );

    // Mutation to generate a new summary
    const {
        mutate: generateDailySummary,
        isPending: isGenerating,
        isError: isErrorGenerating,
        error: generateError
    } = useGenerateDailySummary();

    // Reset summary when date or repo changes
    useEffect(() => {
        // If we have data, use it
        if (existingSummary) {
            setSummary(existingSummary);
        } else if (!isLoadingSummary) {
            // If we don't have data and we're not loading, reset the summary
            setSummary(null);
        }
    }, [existingSummary, isLoadingSummary, date, repoFullName]);

    const handleGenerateSummary = () => {
        if (!repoFullName) return;

        generateDailySummary(
            { date: formattedDate, repoFullName },
            {
                onSuccess: (data) => {
                    setSummary(data);
                }
            }
        );
    };

    const isLoading = isLoadingSummary || isGenerating;
    const isError = isErrorFetching || isErrorGenerating;
    const error = fetchError || generateError;

    if (!repoFullName) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Daily Summary</CardTitle>
                    <CardDescription>Select a repository to generate a daily summary</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-3">
                <CardTitle>Daily Summary</CardTitle>
                <CardDescription>
                    {format(date, 'MMMM d, yyyy')} - {repoFullName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-[350px] w-full">
                    <div className="p-4 w-full max-w-full">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : summary ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden">
                                <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                        ) : isError ? (
                            <div className="text-destructive">
                                <p>Error: {error?.message}</p>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p className="mb-4">No summary available for this date</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-2">
                <Button
                    onClick={handleGenerateSummary}
                    disabled={isLoading || !repoFullName}
                    className="w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isGenerating ? "Generating..." : "Loading..."}
                        </>
                    ) : summary ? (
                        "Regenerate Summary"
                    ) : (
                        "Generate Daily Summary"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
} 