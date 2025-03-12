'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
                <p className="mb-6">An error occurred. Please try again later.</p>
                <div className="space-x-4">
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try again
                    </button>
                    <Link href="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
} 