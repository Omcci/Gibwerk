'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface StatusPanelProps {
    status: string | null;
}

export function StatusPanel({ status }: StatusPanelProps) {
    if (!status) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Repository Status</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">{status}</pre>
            </CardContent>
        </Card>
    );
}
