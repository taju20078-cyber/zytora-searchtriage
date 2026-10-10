import React, { useState, useMemo } from 'react';
import { useTriage } from '../context/TriageContext';
import {
  TrendingUp,
  DollarSign,
  MousePointer,
  Eye,
  CheckCircle2,
  ShieldAlert,
  MinusCircle,
  AlertTriangle,
  Filter,
  BarChart2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { TriageResult } from '../types/searchTerm';

interface OverviewDashboardProps {
  onNavigateToExplorer: (filter?: { action?: string; review?: boolean; campaign?: string }) => void;
  onNavigateToReview: () => void;
}

const ACTION_COLORS = {
  PROMOTE: '#10b981', // Emerald
  BLOCK: '#f43f5e', // Rose
  IGNORE: '#64748b', // Slate
  REVIEW: '#f59e0b', // Amber
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateToExplorer,
  onNavigateToReview,
}) => {
  const { classifiedResults, reviewerDecisions, allCampaigns, allAdGroups, activeFileMeta } = useTriage();

  const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');
  const [selectedAdGroup, setSelectedAdGroup] = useState<string>('ALL');

  // Filtered dataset according to campaign / ad group filters
  const filteredResults = useMemo(() => {
    return classifiedResults.filter((r) => {
      if (selectedCampaign !== 'ALL' && r.campaign !== selectedCampaign) return false;
      if (selectedAdGroup !== 'ALL' && r.ad_group !== selectedAdGroup) return false;
      return true;
    });
  }, [classifiedResults, selectedCampaign, selectedAdGroup]);

  // Dependent ad groups for the selected campaign
  const availableAdGroups = useMemo(() => {
    if (selectedCampaign === 'ALL') return allAdGroups;
    const set = new Set<string>();
    classifiedResults
      .filter((r) => r.campaign === selectedCampaign)
      .forEach((r) => set.add(r.ad_group));
    return Array.from(set).sort();
  }, [classifiedResults, selectedCampaign, allAdGroups]);

  // Dynamic calculations from active dataset
  const stats = useMemo(() => {
    let promoteCount = 0;
    let blockCount = 0;
    let ignoreCount = 0;
    let reviewCount = 0;

    let promoteSpend = 0;
    let blockSpend = 0;
    let ignoreSpend = 0;

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCost = 0;
    let totalConversions = 0;
    let totalConversionValue = 0;

    filteredResults.forEach((r) => {
      const decision = reviewerDecisions[r.row_id];
      const effectiveAction = decision ? decision.decision_action : r.recommended_action;

      if (effectiveAction === 'PROMOTE') {
        promoteCount++;
        promoteSpend += r.cost;
      } else if (effectiveAction === 'BLOCK') {
        blockCount++;
        blockSpend += r.cost;
      } else {
        ignoreCount++;
        ignoreSpend += r.cost;
      }

      if (r.human_review.needs_review) {
        reviewCount++;
      }

      totalImpressions += r.impressions;
      totalClicks += r.clicks;
      totalCost += r.cost;
      totalConversions += r.conversions;
      totalConversionValue += r.conversion_value;
    });

    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : null;
    const cvr = totalClicks > 0 ? totalConversions / totalClicks : null;
    const cpa = totalConversions > 0 ? totalCost / totalConversions : null;
    const cpc = totalClicks > 0 ? totalCost / totalClicks : null;
    const roas = totalCost > 0 ? totalConversionValue / totalCost : null;

    return {
      total: filteredResults.length,
      promoteCount,
      blockCount,
      ignoreCount,
      reviewCount,
      promoteSpend,
      blockSpend,
      ignoreSpend,
      totalImpressions,
      totalClicks,
      totalCost,
      totalConversions,
      totalConversionValue,
      ctr,
      cvr,
      cpa,
      cpc,
      roas,
    };
  }, [filteredResults, reviewerDecisions]);

  // Chart 1: Decision Distribution Data
  const decisionChartData = useMemo(() => {
    return [
      { name: 'PROMOTE', value: stats.promoteCount, color: ACTION_COLORS.PROMOTE },
      { name: 'BLOCK', value: stats.blockCount, color: ACTION_COLORS.BLOCK },
      { name: 'IGNORE', value: stats.ignoreCount, color: ACTION_COLORS.IGNORE },
    ];
  }, [stats]);

  // Chart 2: Spend by Action Data
  const spendChartData = useMemo(() => {
    return [
      { name: 'PROMOTE', spend: Math.round(stats.promoteSpend), fill: ACTION_COLORS.PROMOTE },
      { name: 'BLOCK', spend: Math.round(stats.blockSpend), fill: ACTION_COLORS.BLOCK },
      { name: 'IGNORE', spend: Math.round(stats.ignoreSpend), fill: ACTION_COLORS.IGNORE },
    ];
  }, [stats]);

  // Chart 3: Campaign breakdown
  const campaignChartData = useMemo(() => {
    const map = new Map<string, { campaign: string; PROMOTE: number; BLOCK: number; IGNORE: number }>();

    filteredResults.forEach((r) => {
      const campName = r.campaign.replace('Search_', '');
      if (!map.has(campName)) {
        map.set(campName, { campaign: campName, PROMOTE: 0, BLOCK: 0, IGNORE: 0 });
      }
      const item = map.get(campName)!;
      const decision = reviewerDecisions[r.row_id];
      const action = decision ? decision.decision_action : r.recommended_action;
      item[action]++;
    });

    return Array.from(map.values()).slice(0, 6);
  }, [filteredResults, reviewerDecisions]);

  return (
    <div className="p-6 space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Scope Filters
          </span>
          <span className="text-xs text-slate-500">
            ({stats.total.toLocaleString()} terms active)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Campaign Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Campaign:</span>
            <select
              value={selectedCampaign}
              onChange={(e) => {
                setSelectedCampaign(e.target.value);
                setSelectedAdGroup('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Campaigns ({allCampaigns.length})</option>
              {allCampaigns.map((camp) => (
                <option key={camp} value={camp}>
                  {camp}
                </option>
              ))}
            </select>
          </div>

          {/* Ad Group Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Ad Group:</span>
            <select
              value={selectedAdGroup}
              onChange={(e) => setSelectedAdGroup(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Ad Groups ({availableAdGroups.length})</option>
              {availableAdGroups.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>

          {(selectedCampaign !== 'ALL' || selectedAdGroup !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedCampaign('ALL');
                setSelectedAdGroup('ALL');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Primary Triage Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Terms */}
        <div
          onClick={() => onNavigateToExplorer()}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Processed Terms</span>
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Spend: ${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              View all →
            </span>
          </div>
        </div>

        {/* PROMOTE Candidates */}
        <div
          onClick={() => onNavigateToExplorer({ action: 'PROMOTE' })}
          className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">PROMOTE Candidates</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {stats.promoteCount.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 flex items-center justify-between">
            <span>
              {stats.total > 0 ? `${((stats.promoteCount / stats.total) * 100).toFixed(1)}% of queries` : '0%'}
            </span>
            <span>${stats.promoteSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent</span>
          </div>
        </div>

        {/* BLOCK Candidates */}
        <div
          onClick={() => onNavigateToExplorer({ action: 'BLOCK' })}
          className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">BLOCK Candidates</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-800 dark:text-rose-300">
            {stats.blockCount.toLocaleString()}
          </div>
          <div className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 flex items-center justify-between">
            <span>Waste Stop: ${stats.blockSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">Add to negatives →</span>
          </div>
        </div>

        {/* HUMAN REVIEW Queue */}
        <div
          onClick={onNavigateToReview}
          className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">HUMAN REVIEW Queue</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-300">
            {stats.reviewCount.toLocaleString()}
          </div>
          <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 flex items-center justify-between">
            <span>Ambiguous / Low-Sample</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Open Queue →</span>
          </div>
        </div>
      </div>

      {/* Aggregate Advertising Performance Bar */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-indigo-600" />
          Calculated Portfolio Performance Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Impressions</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {stats.totalImpressions.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Clicks</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {stats.totalClicks.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">
              CTR: {stats.ctr !== null ? `${(stats.ctr * 100).toFixed(2)}%` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Ad Spend</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              ${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Avg CPC: {stats.cpc !== null ? `$${stats.cpc.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Conversions</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {stats.totalConversions.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">
              CVR: {stats.cvr !== null ? `${(stats.cvr * 100).toFixed(2)}%` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Cost / Conv (CPA)</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {stats.cpa !== null ? `$${stats.cpa.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Portfolio ROAS</span>
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              {stats.roas !== null ? `${stats.roas.toFixed(2)}x` : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Rev: ${stats.totalConversionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Decision Distribution */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Triage Decision Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Count of queries assigned to each action category
          </p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={decisionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {decisionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString()} queries`,
                    'Count',
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Spend by Recommended Action */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Total Spend by Recommended Action ($)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Identifying budget allocation and potential negative keyword cost savings
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendChartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Ad Spend']}
                />
                <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                  {spendChartData.map((entry, index) => (
                    <Cell key={`spend-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Review Queue Summary Banner */}
      {stats.reviewCount > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                {stats.reviewCount.toLocaleString()} Queries Requiring Human Oversight
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/80">
                Safeguards triggered for low-sample conversions, ambiguous intents, or high spending underperformers.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToReview}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            Open Review Center <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
