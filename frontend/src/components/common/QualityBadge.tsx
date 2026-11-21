import React from 'react';

interface QualityBadgeProps {
  score?: number;
  grade?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  score,
  grade,
  size = 'md',
}) => {
  let evaluatedGrade = grade;
  if (!evaluatedGrade && score !== undefined) {
    if (score >= 90) evaluatedGrade = 'Excellent';
    else if (score >= 75) evaluatedGrade = 'Good';
    else if (score >= 60) evaluatedGrade = 'Fair';
    else evaluatedGrade = 'Poor';
  }

  const getStyle = (g?: string) => {
    switch (g?.toLowerCase()) {
      case 'excellent':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-emerald-500/20';
      case 'good':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30 ring-blue-500/20';
      case 'fair':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30 ring-amber-500/20';
      case 'poor':
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30 ring-rose-500/20';
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold tracking-wide ring-1 ${getStyle(
        evaluatedGrade
      )} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{evaluatedGrade}</span>
      {score !== undefined && (
        <span className="opacity-80">({score.toFixed(1)}/100)</span>
      )}
    </span>
  );
};
