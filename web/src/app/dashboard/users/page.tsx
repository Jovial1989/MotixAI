import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>

      <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-brand-50 p-4 dark:bg-brand-900/20">
            <Users size={32} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            View and manage all registered users. Assign roles and monitor activity across the platform.
          </p>
        </div>

        {/* Placeholder table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {['Name', 'Email', 'Role', 'Joined'].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No users found. Connect the backend API to load user data.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
