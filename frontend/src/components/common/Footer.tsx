import React from 'react';
import { Cpu, ShieldCheck, FileSpreadsheet, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/70 py-6 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-300">
            Intelligent Data Quality Assessment & AutoML Assistant
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Academic Minor Project</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            FastAPI + Pandas
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Scikit-Learn AutoML
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Full Leakage-Free Pipeline
          </span>
        </div>
      </div>
    </footer>
  );
};
