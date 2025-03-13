'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="container mx-auto p-4 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Loading your profile information...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="container mx-auto p-4 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Not Signed In</CardTitle>
                        <CardDescription>You need to sign in to view your profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/api/auth/signin">Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl">
                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">{session.user?.name || 'User'}</h3>
                            <p className="text-gray-500">{session.user?.email || 'No email provided'}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-md font-medium mb-2">Account Information</h4>
                        <p className="text-sm text-gray-500">
                            You are signed in using GitHub authentication.
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-md font-medium mb-2">GitHub Integration</h4>
                        <p className="text-sm text-gray-500">
                            Your GitHub account is connected, allowing you to view your repositories and commits in the Git Calendar.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button asChild variant="outline">
                            <Link href="/">Back to Calendar</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 