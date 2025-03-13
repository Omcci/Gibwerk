import { useState } from 'react';
import { useGenerateDailySummary } from '../hooks/useGitHubData';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface DailySummaryProps {
    date: Date;
    repoFullName: string | null;
}

export function DailySummary({ date, repoFullName }: DailySummaryProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const {
        mutate: generateDailySummary,
        isPending: isGenerating,
        isError,
        error
    } = useGenerateDailySummary();

    const handleGenerateSummary = () => {
        if (!repoFullName) return;

        const formattedDate = format(date, 'yyyy-MM-dd');

        generateDailySummary(
            { date: formattedDate, repoFullName },
            {
                onSuccess: (data) => {
                    setSummary(data);
                }
            }
        );
    };

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
            <CardHeader>
                <CardTitle>Daily Summary</CardTitle>
                <CardDescription>
                    {format(date, 'MMMM d, yyyy')} - {repoFullName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : summary ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                ) : isError ? (
                    <div className="text-destructive">
                        <p>Error generating summary: {error?.message}</p>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                        <p className="mb-4">No summary generated yet</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || !repoFullName}
                    className="w-full"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
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