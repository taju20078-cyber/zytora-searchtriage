import React from 'react';
import { TriageAction } from '../types/searchTerm';
import { CheckCircle2, ShieldAlert, MinusCircle, AlertCircle } from 'lucide-react';

interface ActionBadgeProps {
  action: TriageAction;
  size?: 'sm' | 'md' | 'lg';
  isOverridden?: boolean;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({
  action,
  size = 'md',
  isOverridden = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  switch (action) {
    case 'PROMOTE':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-md border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/40 ${sizeClasses[size]}`}
        >
          <CheckCircle2 size={iconSizes[size]} className="text-emerald-600 dark:text-emerald-400" />
          <span>PROMOTE</span>
          {isOverridden && (
            <span className="text-[10px] ml-0.5 uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
              (Override)
            </span>
          )}
        </span>
      );

    case 'BLOCK':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-md border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/40 ${sizeClasses[size]}`}
        >
          <ShieldAlert size={iconSizes[size]} className="text-rose-600 dark:text-rose-400" />
          <span>BLOCK</span>
          {isOverridden && (
            <span className="text-[10px] ml-0.5 uppercase tracking-wider text-rose-800 dark:text-rose-200">
              (Override)
            </span>
          )}
        </span>
      );

    case 'IGNORE':
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${sizeClasses[size]}`}
        >
          <MinusCircle size={iconSizes[size]} className="text-slate-500 dark:text-slate-400" />
          <span>IGNORE</span>
          {isOverridden && (
            <span className="text-[10px] ml-0.5 uppercase tracking-wider text-slate-500 dark:text-slate-400">
              (Override)
            </span>
          )}
        </span>
      );
  }
};

export const HumanReviewBadge: React.FC<{
  needsReview: boolean;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  isResolved?: boolean;
}> = ({ needsReview, priority = 'NONE', isResolved = false }) => {
  if (isResolved) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
        <CheckCircle2 size={12} className="text-slate-500" />
        Reviewed
      </span>
    );
  }

  if (!needsReview) {
    return null;
  }

  const priorityColors = {
    HIGH: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-600',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
    LOW: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-700',
    NONE: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityColors[priority]}`}
    >
      <AlertCircle size={12} className="text-amber-600 dark:text-amber-400" />
      <span>REVIEW {priority !== 'NONE' && `(${priority})`}</span>
    </span>
  );
};
