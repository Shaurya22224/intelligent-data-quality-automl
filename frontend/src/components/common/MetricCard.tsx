import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    type?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  className = '',
}) => {
  const badgeStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    neutral: 'bg-slate-700/50 text-slate-300 border-slate-600',
  };

  const currentBadgeStyle = badge ? badgeStyles[badge.type || 'neutral'] : '';

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border border-slate-800 card-hover relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {value}
            </span>
            {badge && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${currentBadgeStyle}`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-indigo-400 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
