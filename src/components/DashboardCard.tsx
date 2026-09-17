import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl border border-stone-100 p-6 shadow-sm flex items-start justify-between ${className}`} id={`db-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-stone-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-stone-500 font-medium">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {trend.value}
            </span>
            <span className="text-xs text-stone-400 font-medium">from last week</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
        {icon}
      </div>
    </div>
  );
};
