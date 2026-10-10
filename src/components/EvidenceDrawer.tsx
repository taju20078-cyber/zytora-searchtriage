import React, { useState, useEffect } from 'react';
import { ReviewerDecision, TriageAction, TriageResult } from '../types/searchTerm';
import { useTriage } from '../context/TriageContext';
import { ActionBadge, HumanReviewBadge } from './ActionBadge';
import { X, CheckCircle, ShieldAlert, MinusCircle, AlertTriangle, Lightbulb, ArrowRight, Save, RotateCcw } from 'lucide-react';

interface EvidenceDrawerProps {
  result: TriageResult | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ result, onClose }) => {
  const { reviewerDecisions, saveDecision } = useTriage();
  const [selectedAction, setSelectedAction] = useState<TriageAction>('IGNORE');
  const [notes, setNotes] = useState<string>('');
  const [isSavedMessage, setIsSavedMessage] = useState<boolean>(false);

  useEffect(() => {
    if (result) {
      const existing = reviewerDecisions[result.row_id];
      if (existing) {
        setSelectedAction(existing.decision_action);
        setNotes(existing.notes || '');
      } else {
        setSelectedAction(result.recommended_action);
        setNotes('');
      }
      setIsSavedMessage(false);
    }
  }, [result, reviewerDecisions]);

  if (!result) return null;

  const existingDecision = reviewerDecisions[result.row_id];
  const isOverridden = existingDecision && existingDecision.decision_action !== result.recommended_action;

  const handleSave = (actionToSave: TriageAction) => {
    const isOverride = actionToSave !== result.recommended_action;
    const decision: ReviewerDecision = {
      row_id: result.row_id,
      original_action: result.recommended_action,
      decision_action: actionToSave,
      status: isOverride ? 'overridden' : 'accepted',
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };
    saveDecision(decision);
    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Row #{result.row_id}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {result.match_type} match
              </span>
              <ActionBadge action={result.recommended_action} />
              {result.human_review.needs_review && (
                <HumanReviewBadge
                  needsReview={true}
                  priority={result.human_review.priority}
                  isResolved={Boolean(existingDecision)}
                />
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight break-all">
              &ldquo;{result.search_term}&rdquo;
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Campaign: <span className="font-semibold text-slate-700 dark:text-slate-200">{result.campaign}</span> • Ad Group:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{result.ad_group}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/50">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                  Engine Explanation
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  {result.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Next Step */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-1">
                  Recommended Action Next Step
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {result.recommended_next_step}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Evidence Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Supporting Performance Evidence
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Impressions</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {result.impressions.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Clicks</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {result.clicks.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  CTR: {result.features.ctr !== null ? `${(result.features.ctr * 100).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Cost</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  ${result.cost.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  CPC: {result.features.cpc !== null ? `$${result.features.cpc.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Conversions</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {result.conversions}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  CVR: {result.features.cvr !== null ? `${(result.features.cvr * 100).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Conversion Value</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  ${result.conversion_value.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Cost / Conv (CPA)</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {result.features.cpa !== null ? `$${result.features.cpa.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">ROAS</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {result.features.roas !== null ? `${result.features.roas.toFixed(2)}x` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Confidence Score</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {result.confidence}/100
                </span>
              </div>
            </div>
          </div>

          {/* Intent Analysis Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Intent Classification & Context
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Primary Intent Category:</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">
                  {result.intent.primary_intent.replace('_', ' ')}
                </span>
              </div>

              {result.intent.matched_offered_products.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block mb-1">
                    Matched Offered Commercial Products:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.intent.matched_offered_products.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono"
                      >
                        {p.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.intent.matched_excluded_intents.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-400 block mb-1">
                    Matched Excluded Categories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.intent.matched_excluded_intents.map((e) => (
                      <span
                        key={e}
                        className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono"
                      >
                        {e.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.intent.notes.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                  {result.intent.notes.map((note, idx) => (
                    <p key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <span className="text-slate-400">•</span> {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Triggered Rules Trace */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Decision Rules Triggered
            </h3>
            <div className="space-y-1.5">
              {result.rules_triggered.map((rule, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Human Reviewer Override / Acceptance Section */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Analyst Decision Override & Review
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accept the engine recommendation or explicitly override with documented reason.
                </p>
              </div>
              {existingDecision && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Status: {existingDecision.status.toUpperCase()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction('PROMOTE')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  selectedAction === 'PROMOTE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle size={14} />
                PROMOTE
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('BLOCK')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  selectedAction === 'BLOCK'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert size={14} />
                BLOCK
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('IGNORE')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  selectedAction === 'IGNORE'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <MinusCircle size={14} />
                IGNORE
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Analyst Justification / Notes:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Approved after checking landing page match, or blocked due to brand mismatch..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleSave(selectedAction)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Save size={14} />
                {selectedAction === result.recommended_action ? 'Confirm & Accept Recommendation' : 'Save Analyst Override'}
              </button>

              {isSavedMessage && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                  ✓ Saved to localStorage
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
