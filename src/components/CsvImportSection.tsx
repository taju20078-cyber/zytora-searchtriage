import React, { useState, useRef } from 'react';
import { useTriage } from '../context/TriageContext';
import { parseCSVFile, parseCSVString, ParseResult } from '../lib/csvParser';
import { getSampleCSVString } from '../data/sampleCsvDownload';
import { triggerDownload } from '../lib/csvExport';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Database,
  ArrowRight,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const CsvImportSection: React.FC = () => {
  const { loadDataset, loadDemoData, activeFileMeta } = useTriage();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setParseResult(null);

    try {
      const result = await parseCSVFile(file);
      setParseResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to parse CSV file. Please verify file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setErrorMessage('Please upload a valid .csv file.');
        return;
      }
      handleFileProcess(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleApplyDataset = () => {
    if (parseResult && parseResult.validRows.length > 0) {
      loadDataset(parseResult.validRows, parseResult.filename, true);
    }
  };

  const handleDownloadSample = () => {
    const csv = getSampleCSVString();
    triggerDownload(csv, 'kestrel_sample_template.csv');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Current Active Dataset Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Database size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Currently Active Dataset:</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{activeFileMeta.name}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {activeFileMeta.rowCount.toLocaleString()} valid rows
              </span>
              {activeFileMeta.source === 'demo' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Synthetic Demo
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSample}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Download size={13} />
            Download Sample CSV
          </button>
          <button
            onClick={loadDemoData}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            Load Synthetic Demo
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Upload Google Ads Search Terms Report
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop your <code className="font-mono text-indigo-600 dark:text-indigo-400">search_terms_report.csv</code> (up to 25,000+ rows) or click to browse
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
          <span>• Automatic header normalization</span>
          <span>• Missing column detection</span>
          <span>• Local client-side processing</span>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="p-6 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
            Validating & Parsing Search Terms Dataset...
          </h4>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-400">
            Executing RFC-4180 parsing, numeric range validation, and schema checks.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">CSV Import Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Validation Result Box */}
      {parseResult && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Validation Report: {parseResult.filename}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Processed {parseResult.totalRows.toLocaleString()} rows from uploaded file.
              </p>
            </div>

            <button
              onClick={handleApplyDataset}
              disabled={parseResult.validRows.length === 0}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Apply Dataset to Analysis</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Validation Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">
                Valid Rows Accepted
              </span>
              <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                {parseResult.validRows.length.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-500 font-medium block">Total Rows Read</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200">
                {parseResult.totalRows.toLocaleString()}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                parseResult.invalidRows.length > 0
                  ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <span className="text-[11px] text-slate-500 font-medium block">Rejected Invalid Rows</span>
              <span
                className={`text-xl font-black ${
                  parseResult.invalidRows.length > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {parseResult.invalidRows.length.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Headers Normalization Status */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Normalized Column Mapping:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parseResult.detectedHeaders.map((h) => (
                <span
                  key={h}
                  className="font-mono text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                >
                  {h}
                </span>
              ))}
            </div>
            {parseResult.missingHeaders.length > 0 && (
              <div className="p-2.5 rounded bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  Missing required columns:{' '}
                  <span className="font-mono font-bold">
                    {parseResult.missingHeaders.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Invalid Rows Table if any */}
          {parseResult.invalidRows.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Invalid Rows Report ({parseResult.invalidRows.length})
              </h4>
              <div className="max-h-48 overflow-y-auto border border-rose-200 dark:border-rose-900 rounded-lg text-xs divide-y divide-rose-100 dark:divide-rose-900/60 bg-rose-50/20">
                {parseResult.invalidRows.slice(0, 10).map((inv, idx) => (
                  <div key={idx} className="p-2.5 flex items-start justify-between gap-4">
                    <span className="font-mono text-slate-500">Row #{inv.row_index + 1}</span>
                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                      {inv.errors.join('; ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table of First 5 Accepted Rows */}
          {parseResult.validRows.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Preview of Valid Rows (First 5)
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Row ID</th>
                      <th className="p-2">Search Term</th>
                      <th className="p-2">Match</th>
                      <th className="p-2">Campaign</th>
                      <th className="p-2 text-right">Clicks</th>
                      <th className="p-2 text-right">Cost</th>
                      <th className="p-2 text-right">Conv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parseResult.validRows.slice(0, 5).map((r) => (
                      <tr key={r.row_id}>
                        <td className="p-2 font-mono text-[11px]">{r.row_id}</td>
                        <td className="p-2 font-semibold">{r.search_term}</td>
                        <td className="p-2 uppercase text-[10px]">{r.match_type}</td>
                        <td className="p-2">{r.campaign}</td>
                        <td className="p-2 text-right">{r.clicks}</td>
                        <td className="p-2 text-right">${r.cost.toFixed(2)}</td>
                        <td className="p-2 text-right">{r.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
