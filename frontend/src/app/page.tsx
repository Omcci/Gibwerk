// frontend/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import CalendarClient from './CalendarClient';
import SignInButton from './SignInButton';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <SignInButton />;
  }

  return <CalendarClient />;
}