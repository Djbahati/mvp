import React from 'react';
import { Layers, RefreshCw, ArrowRight, FolderOpen, Wallet, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Active Contents Found',
  description = 'There are currently no active records or tab contents available for this section. Select an active tab or perform a new action to generate data.',
  icon,
  actionLabel = 'Return to Overview',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) => {
  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 mb-5 shadow-inner group hover:scale-105 transition-transform duration-300">
          {icon || <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400/90" />}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-400 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Empty Display Buffer</span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {onAction && (
            <button
              onClick={onAction}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/10 transition-all cursor-pointer active:scale-95"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
