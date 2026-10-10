import React, { useState, useMemo, useCallback } from 'react';
import { useTriage } from '../context/TriageContext';
import { TriageAction, TriageResult } from '../types/searchTerm';
import { ActionBadge, HumanReviewBadge } from './ActionBadge';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  ShieldAlert,
  MinusCircle,
  Eye,
} from 'lucide-react';
import { getExactGroupKey } from '../engine/normalizeQuery';

type SortField =
  | 'row_id'
  | 'search_term'
  | 'impressions'
  | 'clicks'
  | 'cost'
  | 'conversions'
  | 'conversion_value'
  | 'confidence'
  | 'cpa'
  | 'roas';

type SortDirection = 'asc' | 'desc';

interface SearchTermExplorerProps {
  initialFilter?: {
    action?: string;
    review?: boolean;
    campaign?: string;
  };
}

export const SearchTermExplorer: React.FC<SearchTermExplorerProps> = ({ initialFilter }) => {
  const { classifiedResults, reviewerDecisions, allCampaigns, allAdGroups, setSelectedResult } = useTriage();

  // Filters state
  const [searchTermQuery, setSearchTermQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>(initialFilter?.action || 'ALL');
  const [reviewFilter, setReviewFilter] = useState<string>(initialFilter?.review ? 'NEEDS_REVIEW' : 'ALL');
  const [campaignFilter, setCampaignFilter] = useState<string>(initialFilter?.campaign || 'ALL');
  const [adGroupFilter, setAdGroupFilter] = useState<string>('ALL');
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>('ALL');
  const [confidenceTier, setConfidenceTier] = useState<string>('ALL');
  const [groupDuplicates, setGroupDuplicates] = useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Filter available ad groups based on chosen campaign
  const availableAdGroups = useMemo(() => {
    if (campaignFilter === 'ALL') return allAdGroups;
    const set = new Set<string>();
    classifiedResults
      .filter((r) => r.campaign === campaignFilter)
      .forEach((r) => set.add(r.ad_group));
    return Array.from(set).sort();
  }, [classifiedResults, campaignFilter, allAdGroups]);

  // Main Filtering
  const filteredData = useMemo(() => {
    const queryLower = searchTermQuery.trim().toLowerCase();

    return classifiedResults.filter((item) => {
      // Text search
      if (
        queryLower &&
        !item.search_term.toLowerCase().includes(queryLower) &&
        !item.campaign.toLowerCase().includes(queryLower) &&
        !item.ad_group.toLowerCase().includes(queryLower)
      ) {
        return false;
      }

      // Action Filter (accounting for reviewer overrides)
      const decision = reviewerDecisions[item.row_id];
      const effectiveAction = decision ? decision.decision_action : item.recommended_action;

      if (actionFilter !== 'ALL' && effectiveAction !== actionFilter) {
        return false;
      }

      // Review Status Filter
      if (reviewFilter === 'NEEDS_REVIEW' && !item.human_review.needs_review) {
        return false;
      }
      if (reviewFilter === 'REVIEWED' && !decision) {
        return false;
      }
      if (reviewFilter === 'OVERRIDDEN' && (!decision || decision.status !== 'overridden')) {
        return false;
      }
      if (reviewFilter === 'CLEAN' && item.human_review.needs_review) {
        return false;
      }

      // Campaign Filter
      if (campaignFilter !== 'ALL' && item.campaign !== campaignFilter) {
        return false;
      }

      // Ad Group Filter
      if (adGroupFilter !== 'ALL' && item.ad_group !== adGroupFilter) {
        return false;
      }

      // Match Type Filter
      if (matchTypeFilter !== 'ALL' && item.match_type.toLowerCase() !== matchTypeFilter.toLowerCase()) {
        return false;
      }

      // Confidence Tier
      if (confidenceTier === 'HIGH' && item.confidence < 80) return false;
      if (confidenceTier === 'MEDIUM' && (item.confidence < 50 || item.confidence >= 80)) return false;
      if (confidenceTier === 'LOW' && item.confidence >= 50) return false;

      return true;
    });
  }, [
    classifiedResults,
    reviewerDecisions,
    searchTermQuery,
    actionFilter,
    reviewFilter,
    campaignFilter,
    adGroupFilter,
    matchTypeFilter,
    confidenceTier,
  ]);

  // Grouping duplicate queries if enabled
  const processedData = useMemo(() => {
    if (!groupDuplicates) return filteredData;

    // Group items by normalized query
    const groups = new Map<string, TriageResult[]>();
    filteredData.forEach((item) => {
      const key = getExactGroupKey(item.search_term);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    // Return representative row with occurrences metadata
    const result: TriageResult[] = [];
    groups.forEach((items) => {
      // Pick the row with highest cost or first
      const sorted = [...items].sort((a, b) => b.cost - a.cost);
      result.push(sorted[0]);
    });
    return result;
  }, [filteredData, groupDuplicates]);

  // Sorting
  const sortedData = useMemo(() => {
    const list = [...processedData];

    list.sort((a, b) => {
      let valA: any = a[sortField as keyof TriageResult];
      let valB: any = b[sortField as keyof TriageResult];

      // Handle custom metric fields
      if (sortField === 'cpa') {
        valA = a.features.cpa ?? -1;
        valB = b.features.cpa ?? -1;
      } else if (sortField === 'roas') {
        valA = a.features.roas ?? -1;
        valB = b.features.roas ?? -1;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [processedData, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown size={12} className="text-indigo-600 dark:text-indigo-400" />
    );
  };

  const resetAllFilters = () => {
    setSearchTermQuery('');
    setActionFilter('ALL');
    setReviewFilter('ALL');
    setCampaignFilter('ALL');
    setAdGroupFilter('ALL');
    setMatchTypeFilter('ALL');
    setConfidenceTier('ALL');
    setGroupDuplicates(false);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Control / Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        {/* Row 1: Search and Primary Action Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTermQuery}
              onChange={(e) => {
                setSearchTermQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search query text, campaign, or ad group..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 mr-1">Action:</span>
            {['ALL', 'PROMOTE', 'BLOCK', 'IGNORE'].map((act) => (
              <button
                key={act}
                onClick={() => {
                  setActionFilter(act);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  actionFilter === act
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Campaign */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Campaign:</span>
            <select
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value);
                setAdGroupFilter('ALL');
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[160px] truncate"
            >
              <option value="ALL">All ({allCampaigns.length})</option>
              {allCampaigns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Ad Group */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Ad Group:</span>
            <select
              value={adGroupFilter}
              onChange={(e) => {
                setAdGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[160px] truncate"
            >
              <option value="ALL">All ({availableAdGroups.length})</option>
              {availableAdGroups.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {/* Match Type */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Match:</span>
            <select
              value={matchTypeFilter}
              onChange={(e) => {
                setMatchTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Types</option>
              <option value="broad">Broad</option>
              <option value="phrase">Phrase</option>
              <option value="exact">Exact</option>
            </select>
          </div>

          {/* Review Status */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Review Status:</span>
            <select
              value={reviewFilter}
              onChange={(e) => {
                setReviewFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Rows</option>
              <option value="NEEDS_REVIEW">Needs Human Review</option>
              <option value="REVIEWED">Reviewed by Analyst</option>
              <option value="OVERRIDDEN">Override Applied</option>
              <option value="CLEAN">Clean Automated Only</option>
            </select>
          </div>

          {/* Confidence Tier */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Confidence:</span>
            <select
              value={confidenceTier}
              onChange={(e) => {
                setConfidenceTier(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All (0-100)</option>
              <option value="HIGH">High (80-99)</option>
              <option value="MEDIUM">Moderate (50-79)</option>
              <option value="LOW">Low (&lt;50)</option>
            </select>
          </div>

          {/* Duplicate Grouping Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer ml-auto text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={groupDuplicates}
              onChange={(e) => {
                setGroupDuplicates(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium">Group Normalized Duplicates</span>
          </label>

          <button
            onClick={resetAllFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Header & Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {sortedData.length.toLocaleString()}
          </span>{' '}
          queries
          {groupDuplicates && ' (deduplicated by exact query key)'}
        </div>

        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th
                  onClick={() => handleSort('row_id')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60 w-16"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    {renderSortIcon('row_id')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('search_term')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 min-w-[220px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Search Term</span>
                    {renderSortIcon('search_term')}
                  </div>
                </th>
                <th className="py-3 px-3">Context</th>
                <th
                  onClick={() => handleSort('clicks')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Clicks (CTR)</span>
                    {renderSortIcon('clicks')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cost')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Spend</span>
                    {renderSortIcon('cost')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('conversions')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Conv (CVR)</span>
                    {renderSortIcon('conversions')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('roas')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ROAS</span>
                    {renderSortIcon('roas')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Action</th>
                <th
                  onClick={() => handleSort('confidence')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Conf.</span>
                    {renderSortIcon('confidence')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Review</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-medium">No search terms matched your filter criteria.</p>
                    <button
                      onClick={resetAllFilters}
                      className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const decision = reviewerDecisions[row.row_id];
                  const effectiveAction = decision ? decision.decision_action : row.recommended_action;
                  const isOverridden = decision && decision.status === 'overridden';

                  return (
                    <tr
                      key={row.row_id}
                      onClick={() => setSelectedResult(row)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        #{row.row_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white break-words">
                          {row.search_term}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {row.explanation}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                          {row.campaign.replace('Search_', '')}
                        </div>
                        <div className="text-[10px] text-slate-500 max-w-[140px] truncate">
                          {row.ad_group} • <span className="uppercase">{row.match_type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {row.clicks.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.features.ctr !== null ? `${(row.features.ctr * 100).toFixed(1)}%` : '0%'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          ${row.cost.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.features.cpc !== null ? `$${row.features.cpc.toFixed(2)} cpc` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.conversions}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.features.cvr !== null ? `${(row.features.cvr * 100).toFixed(1)}%` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {row.features.roas !== null ? `${row.features.roas.toFixed(2)}x` : '-'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.conversion_value > 0 ? `$${row.conversion_value.toFixed(0)}` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <ActionBadge action={effectiveAction} size="sm" isOverridden={isOverridden} />
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span
                          className={`text-xs ${
                            row.confidence >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : row.confidence >= 50
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {row.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.human_review.needs_review ? (
                          <HumanReviewBadge
                            needsReview={true}
                            priority={row.human_review.priority}
                            isResolved={Boolean(decision)}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResult(row);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                          title="View Evidence & Decision Drawer"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono px-2 font-bold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
