import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatsCard } from '@/components/dashboard/StatsCard';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Total Requests" value="1,234" change="+12%" />
        <StatsCard title="Active Users" value="89" change="+5%" />
        <StatsCard title="AI Sessions" value="456" change="+24%" />
      </div>
    </DashboardShell>
  );
}
