// Server component wrapper — required for `output: 'export'` with dynamic routes.
// The actual UI is in _guide-detail.tsx (client component).
import GuideDetailPage from './_guide-detail';

// Return empty array: no pages are pre-rendered at build time.
// The web Edge Function serves index.html for all unknown paths so
// client-side routing handles the actual guide IDs at runtime.
export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <GuideDetailPage />;
}
