'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import apiClient from '@/lib/apiClient';
import { BookOpen, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Guide {
  id: string;
  title: string;
  status: string;
  difficulty?: string;
  estimatedTime?: string;
  vehicle: { make: string; model: string; year?: number };
  part: { name: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ready: 'badge-green',
  generating: 'badge-orange',
  pending: 'badge-orange',
  failed: 'badge-red',
};

export default function HistoryPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/guides').then((res) => {
      setGuides(res.data.guides ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Search history</h1>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-motix-500" />
        </div>
      ) : guides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="mb-4 h-12 w-12 text-neutral-200" />
          <h3 className="mb-1 font-semibold text-neutral-700">No history yet</h3>
          <p className="mb-6 text-sm text-neutral-400">Your searched guides will appear here</p>
          <Link href="/dashboard/search" className="btn-primary">Search repair guide</Link>
        </div>
      ) : (
        <div className="card divide-y divide-neutral-100">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/dashboard/guide/${guide.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-neutral-50">
                  <BookOpen className="h-5 w-5 text-neutral-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{guide.title}</p>
                  <p className="text-xs text-neutral-500">
                    {guide.vehicle.make} {guide.vehicle.model} {guide.vehicle.year ?? ''} · {guide.part.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {guide.estimatedTime && (
                  <span className="hidden items-center gap-1 text-xs text-neutral-400 sm:flex">
                    <Clock className="h-3 w-3" /> {guide.estimatedTime}
                  </span>
                )}
                <span className={STATUS_COLOR[guide.status]}>{guide.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
