import React from 'react';
import { BarChart3, Search, AlertCircle, UploadCloud, Download, BookOpen, Layers } from 'lucide-react';
import { useTriage } from '../context/TriageContext';

export type NavTab = 'overview' | 'explorer' | 'review' | 'import' | 'export' | 'methodology';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { classifiedResults, reviewerDecisions } = useTriage();

  // Count unreviewed items needing review
  const pendingReviewCount = classifiedResults.filter(
    (r) => r.human_review.needs_review && !reviewerDecisions[r.row_id]
  ).length;

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview Dashboard',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'explorer' as NavTab,
      label: 'Search Term Explorer',
      icon: Search,
      badge: classifiedResults.length ? `${classifiedResults.length}` : null,
    },
    {
      id: 'review' as NavTab,
      label: 'Human Review Center',
      icon: AlertCircle,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount}` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'import' as NavTab,
      label: 'CSV Import & Validation',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'export' as NavTab,
      label: 'Export Center',
      icon: Download,
      badge: null,
    },
    {
      id: 'methodology' as NavTab,
      label: 'Engine Methodology',
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Product Scope Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 m-3 rounded-xl bg-white dark:bg-slate-800/40 border text-xs">
        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold mb-1.5 text-[11px] uppercase tracking-wider">
          <Layers size={13} />
          <span>Kestrel Products</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
          SBA Loans, Equipment Financing, Working Capital, LOC, Merchant Cash Advance.
        </p>
        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
          ⛔ Excluded: Personal, Mortgages, Auto, Student, Grants, Careers.
        </div>
      </div>
    </aside>
  );
};
