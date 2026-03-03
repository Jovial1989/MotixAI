'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/store/authStore';
import { Moon, Sun, Bell, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="mt-6 space-y-6">
        {/* Profile */}
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={18} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Account</h2>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 capitalize">
                  {user?.role ?? '—'}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Appearance */}
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <Sun size={18} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dark mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              style={{ backgroundColor: theme === 'dark' ? '#6366f1' : '#d1d5db' }}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={18} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates about your AI sessions</p>
            </div>
            <button
              onClick={() => setNotifications((n) => !n)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              style={{ backgroundColor: notifications ? '#6366f1' : '#d1d5db' }}
              aria-label="Toggle email notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
