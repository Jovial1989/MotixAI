'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import apiClient from '@/lib/apiClient';
import { BookOpen, Clock, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Favorite {
  id: string;
  guide: {
    id: string;
    title: string;
    difficulty?: string;
    estimatedTime?: string;
    vehicle: { make: string; model: string; year?: number };
    part: { name: string };
  };
  createdAt: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'badge-green',
  medium: 'badge-yellow',
  hard: 'badge-red',
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/favorites').then((res) => {
      setFavorites(res.data.data);
      setLoading(false);
    });
  }, []);

  const remove = async (guideId: string) => {
    await apiClient.delete(`/favorites/${guideId}`);
    setFavorites((prev) => prev.filter((f) => f.guide.id !== guideId));
  };

  return (
    <DashboardShell>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Saved guides</h1>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-motix-500" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="mb-4 h-12 w-12 text-neutral-200" />
          <h3 className="mb-1 font-semibold text-neutral-700">No saved guides yet</h3>
          <p className="mb-6 text-sm text-neutral-400">Save a guide from the repair guide page to see it here</p>
          <Link href="/dashboard/search" className="btn-primary">Search repair guide</Link>
        </div>
      ) : (
        <div className="card divide-y divide-neutral-100">
          {favorites.map(({ id, guide }) => (
            <div key={id} className="flex items-center justify-between px-5 py-4">
              <Link href={`/dashboard/guide/${guide.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-motix-50">
                  <BookOpen className="h-5 w-5 text-motix-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">{guide.title}</p>
                  <p className="text-xs text-neutral-500">
                    {guide.vehicle.make} {guide.vehicle.model} {guide.vehicle.year ?? ''} · {guide.part.name}
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    {guide.difficulty && <span className={DIFFICULTY_COLOR[guide.difficulty]}>{guide.difficulty}</span>}
                    {guide.estimatedTime && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" /> {guide.estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => remove(guide.id)}
                className="ml-4 flex-shrink-0 rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Remove from favorites"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
