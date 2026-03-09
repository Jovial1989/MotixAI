/**
 * Centralised environment config for the web app.
 *
 * Required Vercel env vars (set in Vercel → Project → Settings → Environment Variables):
 *   NEXT_PUBLIC_API_URL   — e.g. https://your-project.supabase.co/functions/v1/api
 *
 * Without NEXT_PUBLIC_API_URL the app will log a warning and fall back to the
 * local NestJS server (http://localhost:4000). This fallback works in dev but
 * will silently fail in production.
 */

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[env] NEXT_PUBLIC_API_URL is not set. ' +
        'All API calls will fail in production. ' +
        'Add it in Vercel → Project → Settings → Environment Variables.',
      );
    }
    return 'http://localhost:4000';
  }
  return url;
}

export const env = {
  /** Base URL for the backend REST API (no trailing slash). */
  apiUrl: getApiUrl(),
} as const;
