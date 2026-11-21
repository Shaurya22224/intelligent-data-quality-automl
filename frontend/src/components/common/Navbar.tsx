import React from 'react';
import { 
  Sparkles, 
  BarChart3, 
  Sliders, 
  Cpu, 
  History, 
  UploadCloud, 
  Database,
  ChevronDown
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    datasets, 
    activeDataset, 
    selectDataset 
  } = useApp();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload & Preview', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'quality', label: 'Quality Report', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'preprocessing', label: 'Preprocessing', icon: <Sliders className="w-4 h-4" /> },
    { id: 'automl', label: 'AutoML Hub', icon: <Cpu className="w-4 h-4" /> },
    { id: 'history', label: 'History & Logs', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                AutoML Assistant
              </span>
              <span className="block text-[10px] text-indigo-400 font-medium tracking-wider uppercase">
                Data Quality & ML Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Active Dataset Selector Dropdown */}
          <div className="flex items-center gap-3">
            {datasets.length > 0 ? (
              <div className="relative group">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="max-w-[130px] truncate font-medium">
                    {activeDataset ? activeDataset.original_name : 'Select Dataset'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-1 w-64 glass-panel rounded-xl shadow-2xl p-1.5 hidden group-hover:block border border-slate-700 z-50">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Dataset ({datasets.length})
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {datasets.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => selectDataset(d.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          activeDataset?.id === d.id
                            ? 'bg-indigo-600/30 text-indigo-200 font-semibold border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate pr-2">{d.original_name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {d.row_count} rows
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/30 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
