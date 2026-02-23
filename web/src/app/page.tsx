import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-brand-700 dark:text-brand-300">HammerAI</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          AI-powered platform – fast, reliable, and intelligent.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/auth/login"
          className="rounded-lg border border-brand-600 px-6 py-3 font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
