'use client';

import { useAuthStore } from '@/store/authStore';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      {title ? (
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/search"
          className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 transition-colors"
        >
          <Search size={14} />
          <span>New guide search…</span>
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-motix-100 text-sm font-semibold text-motix-600">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
