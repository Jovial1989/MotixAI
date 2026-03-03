import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Search, BookOpen, Heart, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard — MotixAI' };

const QUICK_ACTIONS = [
  { href: '/dashboard/search', icon: Search, label: 'New repair guide', desc: 'Enter VIN or model + part', primary: true },
  { href: '/dashboard/favorites', icon: Heart, label: 'Saved guides', desc: 'Your bookmarked repairs' },
  { href: '/dashboard/history', icon: Clock, label: 'Recent searches', desc: 'Your last 50 queries' },
];

const RECENT_MOCK = [
  { title: 'Front Brake Pad Replacement', vehicle: 'Toyota Camry 2020', status: 'ready', difficulty: 'medium', time: '1–2 hours' },
  { title: 'Oil Filter & Drain Plug', vehicle: 'BMW 5 Series 2019', status: 'ready', difficulty: 'easy', time: '30 min' },
  { title: 'Alternator Belt Replacement', vehicle: 'Ford Transit 2021', status: 'generating', difficulty: null, time: null },
];

const difficultyColor: Record<string, string> = {
  easy: 'badge-green',
  medium: 'badge-yellow',
  hard: 'badge-red',
};

const statusColor: Record<string, string> = {
  ready: 'badge-green',
  generating: 'badge-orange',
  pending: 'badge-orange',
  failed: 'badge-red',
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      {/* Hero search prompt */}
      <div className="rounded-xl border border-motix-100 bg-gradient-to-br from-motix-50 to-white p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900">What do you need to repair?</h2>
        <p className="mb-6 text-neutral-500">Enter a VIN or vehicle + part to generate your repair guide</p>
        <Link href="/dashboard/search" className="btn-primary px-8 py-3 text-base">
          <Search className="h-4 w-4" /> Search repair guide
        </Link>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, primary }) => (
          <Link
            key={href}
            href={href}
            className={`card flex items-center justify-between p-5 transition-shadow hover:shadow-md ${primary ? 'ring-2 ring-motix-500' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${primary ? 'bg-motix-500' : 'bg-neutral-100'}`}>
                <Icon className={`h-5 w-5 ${primary ? 'text-white' : 'text-neutral-600'}`} />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-sm">{label}</p>
                <p className="text-xs text-neutral-500">{desc}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </Link>
        ))}
      </div>

      {/* Recent guides */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">Recent guides</h3>
          <Link href="/dashboard/history" className="text-sm text-motix-500 hover:underline">View all</Link>
        </div>
        <div className="card divide-y divide-neutral-100">
          {RECENT_MOCK.map((guide) => (
            <div key={guide.title} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-50">
                  <BookOpen className="h-4 w-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{guide.title}</p>
                  <p className="text-xs text-neutral-500">{guide.vehicle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {guide.difficulty && (
                  <span className={difficultyColor[guide.difficulty]}>{guide.difficulty}</span>
                )}
                <span className={statusColor[guide.status]}>{guide.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
