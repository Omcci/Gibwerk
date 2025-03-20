// frontend/app/page.tsx
'use client';

import SignInButton from './SignInButton';
import { useSession } from 'next-auth/react';
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the CalendarClient to avoid SSR issues
const CalendarClient = dynamic(() => import('./CalendarClient'), {
  ssr: false
});

export default function Home() {
  const { data: session, status } = useSession();
  const [schemaData, setSchemaData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAuth = async () => {
    if (!session?.token?.accessToken) {
      alert('Please sign in first');
      return;
    }

    try {
      // First, check the schema to get property names
      let dateProperty = 'Date of Commit';
      let repoProperty = 'Repository';
      let titleProperty = 'Name';

      try {
        const schemaResponse = await fetch('/api/notion/database-schema');
        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json();
          console.log('Notion Database Schema:', schemaData);
        }
      } catch (error) {
        console.error('Error fetching schema:', error);
      }

      console.log(`Using Notion properties: Date=${dateProperty}, Repository=${repoProperty}, Title=${titleProperty}`);

      // Now proceed with the sync request
      const response = await fetch('/api/notion/sync-daily-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          repoFullName: 'test/repo',
          summary: 'Test summary for auth flow'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Authentication successful! Response: ' + JSON.stringify(data));
      } else {
        alert('Authentication failed: ' + data.message);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const checkNotionSchema = async () => {
    if (!session?.token?.accessToken) {
      alert('Please sign in first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/notion/database-schema');
      const data = await response.json();

      if (response.ok) {
        setSchemaData(data);
      } else {
        alert('Failed to fetch schema: ' + data.message);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen p-8">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">GibWerk</h1>

      {session ? (
        <div className="space-y-4">
          <p>Signed in as {session.user?.name}</p>
          <div className="flex space-x-4">
            <button
              onClick={testAuth}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Test Authentication
            </button>
            <button
              onClick={checkNotionSchema}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Check Notion Schema'}
            </button>
          </div>

          {schemaData && (
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <h2 className="text-xl font-semibold mb-4">Notion Database Schema</h2>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(schemaData, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Commit Calendar</h2>
            <Suspense fallback={<div>Loading calendar...</div>}>
              <CalendarClient />
            </Suspense>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4">Please sign in to continue</p>
          <SignInButton />
        </div>
      )}
    </main>
  );
}