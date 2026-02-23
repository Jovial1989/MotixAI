interface StatsCardProps {
  title: string;
  value: string;
  change: string;
}

export function StatsCard({ title, value, change }: StatsCardProps) {
  const isPositive = change.startsWith('+');
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p
        className={`mt-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-500'
        }`}
      >
        {change} from last month
      </p>
    </div>
  );
}
