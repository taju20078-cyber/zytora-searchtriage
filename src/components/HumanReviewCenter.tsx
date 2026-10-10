import React, { useState, useMemo } from 'react';
import { useTriage } from '../context/TriageContext';
import { ReviewPriority, ReviewerDecision, TriageAction, TriageResult } from '../types/searchTerm';
import { ActionBadge, HumanReviewBadge } from './ActionBadge';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  MinusCircle,
  RotateCcw,
  Save,
  Layers,
  Filter,
  Eye,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

type ReviewTab = 'ALL_PENDING' | 'LOW_SAMPLE' | 'HIGH_SPEND' | 'CONFLICT' | 'AMBIGUOUS' | 'RESOLVED';

export const HumanReviewCenter: React.FC = () => {
  const { classifiedResults, reviewerDecisions, saveDecision, resetAllDecisions, setSelectedResult } = useTriage();

  const [activeTab, setActiveTab] = useState<ReviewTab>('ALL_PENDING');
  const [analystNotes, setAnalystNotes] = useState<Record<string | number, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Categorize items
  const categorized = useMemo(() => {
    const allNeedingReview = classifiedResults.filter((r) => r.human_review.needs_review);

    const pending = allNeedingReview.filter((r) => !reviewerDecisions[r.row_id]);
    const resolved = allNeedingReview.filter((r) => Boolean(reviewerDecisions[r.row_id]));

    const lowSample = pending.filter(
      (r) => r.rules_triggered.some((rule) => rule.includes('SAFEGUARD') || rule.includes('SINGLE_CONVERSION'))
    );

    const highSpend = pending.filter(
      (r) => r.rules_triggered.some((rule) => rule.includes('HIGH_SPEND')) || (r.cost >= 200 && r.conversions === 0)
    );

    const conflicting = pending.filter(
      (r) => r.rules_triggered.some((rule) => rule.includes('CONFLICT')) || (r.intent.has_excluded_context && r.conversions > 0)
    );

    const ambiguous = pending.filter(
      (r) => r.intent.primary_intent === 'ambiguous'
    );

    return {
      allNeedingReview,
      pending,
      resolved,
      lowSample,
      highSpend,
      conflicting,
      ambiguous,
    };
  }, [classifiedResults, reviewerDecisions]);

  // Tab items to render
  const currentList = useMemo(() => {
    let list: TriageResult[] = [];
    switch (activeTab) {
      case 'ALL_PENDING':
        list = categorized.pending;
        break;
      case 'LOW_SAMPLE':
        list = categorized.lowSample;
        break;
      case 'HIGH_SPEND':
        list = categorized.highSpend;
        break;
      case 'CONFLICT':
        list = categorized.conflicting;
        break;
      case 'AMBIGUOUS':
        list = categorized.ambiguous;
        break;
      case 'RESOLVED':
        list = categorized.resolved;
        break;
    }

    if (filterPriority !== 'ALL') {
      list = list.filter((r) => r.human_review.priority === filterPriority);
    }

    return list;
  }, [activeTab, categorized, filterPriority]);

  const handleApplyDecision = (item: TriageResult, chosenAction: TriageAction) => {
    const isOverride = chosenAction !== item.recommended_action;
    const note = analystNotes[item.row_id] || '';

    const decision: ReviewerDecision = {
      row_id: item.row_id,
      original_action: item.recommended_action,
      decision_action: chosenAction,
      status: isOverride ? 'overridden' : 'accepted',
      notes: note.trim() || (isOverride ? 'Manual override by analyst' : 'Accepted engine recommendation'),
      timestamp: new Date().toISOString(),
    };

    saveDecision(decision);
  };

  const handleAcceptAllPending = () => {
    categorized.pending.forEach((item) => {
      const decision: ReviewerDecision = {
        row_id: item.row_id,
        original_action: item.recommended_action,
        decision_action: item.recommended_action,
        status: 'accepted',
        notes: 'Batch confirmed by analyst',
        timestamp: new Date().toISOString(),
      };
      saveDecision(decision);
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header and Reset Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Human Review & Oversight Center
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {categorized.pending.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Uncertain, conflicting, or low-sample cases escalated for human verification. Decisions are recorded in local audit storage without altering underlying rule models.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {categorized.pending.length > 0 && (
            <button
              onClick={handleAcceptAllPending}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check size={14} />
              Accept All Pending
            </button>
          )}

          {Object.keys(reviewerDecisions).length > 0 && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              Reset Overrides ({Object.keys(reviewerDecisions).length})
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Reset All Reviewer Overrides?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              This will remove all {Object.keys(reviewerDecisions).length} analyst decisions saved in localStorage, returning all queries to the original engine state.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllDecisions();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                Reset All Overrides
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL_PENDING' as ReviewTab, label: 'All Pending', count: categorized.pending.length },
            { id: 'LOW_SAMPLE' as ReviewTab, label: 'Low Sample / Immature', count: categorized.lowSample.length },
            { id: 'HIGH_SPEND' as ReviewTab, label: 'High Spend Zero Conv', count: categorized.highSpend.length },
            { id: 'CONFLICT' as ReviewTab, label: 'Conflicting Signals', count: categorized.conflicting.length },
            { id: 'AMBIGUOUS' as ReviewTab, label: 'Ambiguous Intent', count: categorized.ambiguous.length },
            { id: 'RESOLVED' as ReviewTab, label: 'Resolved History', count: categorized.resolved.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs self-end sm:self-auto">
          <span className="text-slate-500">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Review Queue Items */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No items in this queue!
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              All search terms in this category have been verified or do not require review.
            </p>
          </div>
        ) : (
          currentList.map((item) => {
            const decision = reviewerDecisions[item.row_id];
            const isResolved = Boolean(decision);

            return (
              <div
                key={item.row_id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Row #{item.row_id}
                    </span>
                    <span className="text-xs uppercase px-2 py-0.5 rounded font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {item.match_type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.campaign} &gt; {item.ad_group}
                    </span>
                    <HumanReviewBadge
                      needsReview={true}
                      priority={item.human_review.priority}
                      isResolved={isResolved}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Default:</span>
                    <ActionBadge action={item.recommended_action} size="sm" />
                    {decision && decision.status === 'overridden' && (
                      <>
                        <span className="text-xs text-slate-400">&rarr; Override:</span>
                        <ActionBadge action={decision.decision_action} size="sm" isOverridden={true} />
                      </>
                    )}
                    <button
                      onClick={() => setSelectedResult(item)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Inspect Full Evidence Drawer"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                {/* Search Term & Escalation Reason */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    &ldquo;{item.search_term}&rdquo;
                  </h3>
                  <div className="mt-1.5 p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold uppercase tracking-wider text-[10px] block text-amber-700 dark:text-amber-400">
                        Human Review Trigger:
                      </span>
                      {item.human_review.reason}
                    </div>
                  </div>
                </div>

                {/* Evidence Metrics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Impressions / Clicks</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.impressions} imp / {item.clicks} clk
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spend</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${item.cost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Conversions</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.conversions} conv
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ROAS / Value</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.features.roas !== null ? `${item.features.roas.toFixed(2)}x` : '-'} (${item.conversion_value.toFixed(0)})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Engine Confidence</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {item.confidence}/100
                    </span>
                  </div>
                </div>

                {/* Decision Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Optional analyst rationale / notes..."
                      value={analystNotes[item.row_id] || decision?.notes || ''}
                      onChange={(e) =>
                        setAnalystNotes((prev) => ({
                          ...prev,
                          [item.row_id]: e.target.value,
                        }))
                      }
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleApplyDecision(item, item.recommended_action)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                        decision && decision.decision_action === item.recommended_action
                          ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                          : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Check size={13} />
                      Accept ({item.recommended_action})
                    </button>

                    <button
                      onClick={() => handleApplyDecision(item, 'PROMOTE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                        decision && decision.decision_action === 'PROMOTE'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      PROMOTE
                    </button>

                    <button
                      onClick={() => handleApplyDecision(item, 'BLOCK')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                        decision && decision.decision_action === 'BLOCK'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-50'
                      }`}
                    >
                      <ShieldAlert size={13} />
                      BLOCK
                    </button>

                    <button
                      onClick={() => handleApplyDecision(item, 'IGNORE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                        decision && decision.decision_action === 'IGNORE'
                          ? 'bg-slate-600 text-white border-slate-600'
                          : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <MinusCircle size={13} />
                      IGNORE
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
