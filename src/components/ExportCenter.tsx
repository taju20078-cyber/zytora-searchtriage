import React, { useState } from 'react';
import { useTriage } from '../context/TriageContext';
import {
  exportReviewAuditLogToCSV,
  exportTriageResultsToCSV,
  triggerDownload,
} from '../lib/csvExport';
import {
  Download,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  History,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ExportCenter: React.FC = () => {
  const { classifiedResults, reviewerDecisions } = useTriage();

  const [excludeUnresolvedReviews, setExcludeUnresolvedReviews] = useState<boolean>(true);
  const [applyOverrides, setApplyOverrides] = useState<boolean>(true);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const showDownloadNotice = (message: string) => {
    setDownloadNotice(message);
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const handleExportAll = () => {
    const { content, rowCount } = exportTriageResultsToCSV(
      classifiedResults,
      reviewerDecisions,
      undefined,
      {
        excludeUnresolvedHumanReview: excludeUnresolvedReviews,
        applyReviewerOverrides: applyOverrides,
      }
    );
    triggerDownload(content, `searchiq_all_classified_${new Date().toISOString().slice(0, 10)}.csv`);
    showDownloadNotice(`Exported ${rowCount.toLocaleString()} total classified rows to CSV.`);
  };

  const handleExportPromote = () => {
    const { content, rowCount } = exportTriageResultsToCSV(
      classifiedResults,
      reviewerDecisions,
      'PROMOTE',
      {
        excludeUnresolvedHumanReview: excludeUnresolvedReviews,
        applyReviewerOverrides: applyOverrides,
      }
    );
    triggerDownload(content, `searchiq_promote_keywords_${new Date().toISOString().slice(0, 10)}.csv`);
    showDownloadNotice(`Exported ${rowCount.toLocaleString()} PROMOTE keyword candidates.`);
  };

  const handleExportBlock = () => {
    const { content, rowCount } = exportTriageResultsToCSV(
      classifiedResults,
      reviewerDecisions,
      'BLOCK',
      {
        excludeUnresolvedHumanReview: excludeUnresolvedReviews,
        applyReviewerOverrides: applyOverrides,
      }
    );
    triggerDownload(content, `searchiq_block_negatives_${new Date().toISOString().slice(0, 10)}.csv`);
    showDownloadNotice(`Exported ${rowCount.toLocaleString()} BLOCK negative keyword candidates.`);
  };

  const handleExportReviewQueue = () => {
    const { content, rowCount } = exportTriageResultsToCSV(
      classifiedResults,
      reviewerDecisions,
      'HUMAN_REVIEW',
      {
        excludeUnresolvedHumanReview: false,
        applyReviewerOverrides: applyOverrides,
      }
    );
    triggerDownload(content, `searchiq_human_review_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    showDownloadNotice(`Exported ${rowCount.toLocaleString()} HUMAN REVIEW queue items.`);
  };

  const handleExportAuditLog = () => {
    const decisionsList = Object.values(reviewerDecisions);
    const map = new Map(classifiedResults.map((r) => [r.row_id, r]));
    const { content, rowCount } = exportReviewAuditLogToCSV(decisionsList, map);
    triggerDownload(content, `searchiq_analyst_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    showDownloadNotice(`Exported ${rowCount.toLocaleString()} analyst review decisions log.`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Data Export & Campaign Sync Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Generate production-ready CSV exports encoded in UTF-8 with RFC-4180 quotation compliance. Easily ingestable into Google Ads Editor, spreadsheets, and reporting BI tools.
        </p>

        {/* Global Configuration Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeUnresolvedReviews}
              onChange={(e) => setExcludeUnresolvedReviews(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Exclude unresolved Human-Review cases from actionable exports (Recommended)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyOverrides}
              onChange={(e) => setApplyOverrides(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Incorporate analyst overrides & decisions from local storage
            </span>
          </label>
        </div>
      </div>

      {/* Download Alert Notice */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{downloadNotice}</span>
        </div>
      )}

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export All */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
              <FileSpreadsheet size={18} />
              <span>Full Classified Dataset</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complete archive containing every query, metrics, calculated CTR/CVR/CPA/ROAS, engine action, confidence score, and explanation.
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download size={15} />
            <span>Export Full Classified CSV</span>
          </button>
        </div>

        {/* Export PROMOTE Candidates */}
        <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">
              <CheckCircle2 size={18} />
              <span>PROMOTE Candidate List</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Queries with verified commercial intent, repeat conversions, and healthy ROAS. Ready for Exact/Phrase match keyword targeting.
            </p>
          </div>
          <button
            onClick={handleExportPromote}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download size={15} />
            <span>Export PROMOTE Candidates</span>
          </button>
        </div>

        {/* Export BLOCK Candidates */}
        <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-sm mb-1">
              <ShieldAlert size={18} />
              <span>BLOCK Negative Keywords</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Excluded product queries (personal loans, auto, student, grants, jobs) and heavy spenders with 0 conversions. Ready for campaign negative lists.
            </p>
          </div>
          <button
            onClick={handleExportBlock}
            className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download size={15} />
            <span>Export BLOCK Negative Keywords</span>
          </button>
        </div>

        {/* Export HUMAN REVIEW Queue */}
        <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm mb-1">
              <AlertTriangle size={18} />
              <span>HUMAN REVIEW Audit Queue</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export all uncertain queries, single-conversion anomalies, and conflicting signals for offline senior team review or stakeholder signs-off.
            </p>
          </div>
          <button
            onClick={handleExportReviewQueue}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download size={15} />
            <span>Export Human Review Queue</span>
          </button>
        </div>
      </div>

      {/* Reviewer Decisions Audit Log Export */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <History size={16} />
            <span>Analyst Decisions & Override History</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {Object.keys(reviewerDecisions).length} manual decisions currently stored in local browser memory.
          </p>
        </div>
        <button
          onClick={handleExportAuditLog}
          disabled={Object.keys(reviewerDecisions).length === 0}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download size={14} />
          <span>Export Audit History</span>
        </button>
      </div>

      {/* Compliance & Operational Disclaimer */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Deployment Notice & Google Ads Integration:</span>
          Exported recommendations are formatted for direct copy-paste or CSV import into Google Ads Campaign Manager or Google Ads Editor. These actions have NOT been automatically executed on your live Google Ads account. Always conduct a final campaign budget sanity check before bulk uploading negative keyword lists.
        </div>
      </div>
    </div>
  );
};
