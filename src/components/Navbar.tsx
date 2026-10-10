import React from 'react';
import { useTriage } from '../context/TriageContext';
import { Sparkles, Database, FileText, UploadCloud, RefreshCw } from 'lucide-react';
import { getSampleCSVString } from '../data/sampleCsvDownload';
import { triggerDownload } from '../lib/csvExport';

interface NavbarProps {
  onNavigateToImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToImport }) => {
  const { activeFileMeta, loadDemoData } = useTriage();

  const handleDownloadSample = () => {
    const csv = getSampleCSVString();
    triggerDownload(csv, 'kestrel_sample_search_terms.csv');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              SearchIQ
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hidden sm:inline-block">
              PS-01 Triage Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
            Advertiser: <span className="font-semibold text-slate-700 dark:text-slate-300">Kestrel Business Funding</span> (US Commercial Lender)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Active Dataset Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs">
          <Database size={13} className="text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400">Dataset:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
            {activeFileMeta.name}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">
            {activeFileMeta.rowCount.toLocaleString()} rows
          </span>
          {activeFileMeta.source === 'demo' && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              [DEMO]
            </span>
          )}
        </div>

        {/* Sample CSV Download */}
        <button
          onClick={handleDownloadSample}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Download Sample CSV Template"
        >
          <FileText size={14} className="text-slate-500" />
          Sample CSV
        </button>

        {/* Reload Demo Data */}
        {activeFileMeta.source === 'uploaded' && (
          <button
            onClick={loadDemoData}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title="Reset to Demo Data"
          >
            <RefreshCw size={13} />
            Reset Demo
          </button>
        )}

        {/* Upload Button */}
        <button
          onClick={onNavigateToImport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <UploadCloud size={14} />
          <span>Upload CSV</span>
        </button>
      </div>
    </header>
  );
};
