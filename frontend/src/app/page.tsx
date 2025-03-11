// frontend/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import CalendarClient from './CalendarClient';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="p-4">
      {session ? (
        <CalendarClient />
      ) : (
        <div>
          <p>Please sign in with GitHub</p>
          <a href="/api/auth/signin" className="text-blue-500 underline">
            Sign In
          </a>
        </div>
      )}
    </main>
  );
}