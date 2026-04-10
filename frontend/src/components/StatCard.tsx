import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number; // positive = up, negative = down, undefined = no trend
  trendLabel?: string;
  bgColor?: string; // CSS variable like '--stat-bg-vpaa'
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  trend,
  trendLabel,
  bgColor = 'var(--card-bg)',
}) => {
  const trendIsPositive = trend !== undefined && trend > 0;
  const trendIsNegative = trend !== undefined && trend < 0;

  return (
    <div
      className="rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 border border-text-tertiary/10"
      style={{ backgroundColor: bgColor }}
    >
      {/* Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-text-tertiary/10 text-primary-vpaa">
          {icon}
        </div>
        {trendIsPositive && (
          <div className="flex items-center gap-1 text-sage-500">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
        {trendIsNegative && (
          <div className="flex items-center gap-1 text-primary-maroon">
            <TrendingDown size={16} />
            <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm text-text-secondary mb-2">{label}</p>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-text-primary">{value}</h3>
        {trendLabel && (
          <span
            className={`text-xs font-medium ${
              trendIsPositive ? 'text-sage-600' : trendIsNegative ? 'text-primary-maroon' : 'text-text-secondary'
            }`}
          >
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
