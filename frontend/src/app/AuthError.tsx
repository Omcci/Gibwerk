'use client';

interface AuthErrorProps {
    error: string;
}

export default function AuthError({ error }: AuthErrorProps) {
    const errorMessage = error === 'github'
        ? 'GitHub authentication failed. Please make sure you have granted the required permissions.'
        : 'An error occurred during authentication.';

    return (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-md">
            {errorMessage}
        </div>
    );
} 