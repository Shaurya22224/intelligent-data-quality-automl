import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2, X } from 'lucide-react';

interface ErrorAlertProps {
  error?: string | null;
  notification?: string | null;
  onClearError?: () => void;
  onClearNotification?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  notification,
  onClearError,
  onClearNotification,
}) => {
  if (!error && !notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {error && (
        <div className="flex items-start justify-between p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 shadow-2xl backdrop-blur-md text-rose-200 text-sm">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Error Encountered</p>
              <p className="mt-1 text-xs text-rose-300/90 leading-relaxed">{error}</p>
            </div>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-rose-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {notification && (
        <div className="flex items-start justify-between p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 shadow-2xl backdrop-blur-md text-emerald-200 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Success</p>
              <p className="mt-1 text-xs text-emerald-300/90 leading-relaxed">
                {notification}
              </p>
            </div>
          </div>
          {onClearNotification && (
            <button
              onClick={onClearNotification}
              className="text-emerald-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
