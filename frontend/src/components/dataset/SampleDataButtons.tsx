import React from 'react';
import { GraduationCap, Home, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SampleDataButtons: React.FC = () => {
  const { loadSample, isLoading } = useApp();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Classification Sample */}
      <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 card-hover flex flex-col justify-between group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Classification Sample
            </span>
          </div>

          <h3 className="mt-4 text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            Student Exam Performance
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            500 records predicting exam pass/fail based on study hours, attendance, parental education, and previous grades.
          </p>
        </div>

        <button
          onClick={() => loadSample('classification')}
          disabled={isLoading}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Load Classification Demo</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Regression Sample */}
      <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 card-hover flex flex-col justify-between group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Regression Sample
            </span>
          </div>

          <h3 className="mt-4 text-base font-bold text-white group-hover:text-purple-300 transition-colors">
            Housing Price Estimation
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            500 real estate properties estimating continuous selling prices ($150k - $950k) across square footage, location, and year built.
          </p>
        </div>

        <button
          onClick={() => loadSample('regression')}
          disabled={isLoading}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Load Regression Demo</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
