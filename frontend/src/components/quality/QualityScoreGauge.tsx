import React from 'react';
import { ShieldCheck, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { QualityBadge } from '../common/QualityBadge';

interface QualityScoreGaugeProps {
  score: number;
  grade: string;
  explanation: string;
  totalDeductions: number;
}

export const QualityScoreGauge: React.FC<QualityScoreGaugeProps> = ({
  score,
  grade,
  explanation,
  totalDeductions,
}) => {
  // SVG circular gauge calculations
  const radius = 64;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return '#10b981'; // Emerald
    if (s >= 75) return '#3b82f6'; // Blue
    if (s >= 60) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  return (
    <div className="glass-panel-glow p-6 rounded-3xl border border-slate-700/80 flex flex-col md:flex-row items-center gap-8">
      {/* Radial Gauge */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getColor(score)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-white tracking-tight">
            {score.toFixed(0)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">
            / 100
          </span>
        </div>
      </div>

      {/* Score Description & Breakdown */}
      <div className="flex-1 space-y-3 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <h2 className="text-xl font-bold text-white">Data Quality Score</h2>
          <QualityBadge score={score} grade={grade} size="lg" />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          {explanation}
        </p>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Base Benchmark: <strong className="text-white">100.0 pts</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Quality Deductions: <strong className="text-rose-300">-{totalDeductions.toFixed(1)} pts</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
