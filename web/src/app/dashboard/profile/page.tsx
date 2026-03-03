'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Shield } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <DashboardShell>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Profile</h1>

      <div className="max-w-lg">
        <div className="card p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-motix-100 text-2xl font-bold text-motix-600">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">{user?.name}</p>
              <p className="text-sm text-neutral-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <dl className="space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-neutral-50 px-4 py-3">
              <User className="h-4 w-4 text-neutral-400" />
              <div>
                <dt className="text-xs text-neutral-400">Full name</dt>
                <dd className="text-sm font-medium text-neutral-900">{user?.name}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-neutral-50 px-4 py-3">
              <Mail className="h-4 w-4 text-neutral-400" />
              <div>
                <dt className="text-xs text-neutral-400">Email</dt>
                <dd className="text-sm font-medium text-neutral-900">{user?.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-neutral-50 px-4 py-3">
              <Shield className="h-4 w-4 text-neutral-400" />
              <div>
                <dt className="text-xs text-neutral-400">Account type</dt>
                <dd className="text-sm font-medium text-neutral-900 capitalize">
                  {user?.role === 'user' ? 'Free plan' : user?.role?.replace('_', ' ')}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </DashboardShell>
  );
}
