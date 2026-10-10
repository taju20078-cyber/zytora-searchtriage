import { ReviewerDecision, TriageResult } from '../types/searchTerm';

/**
 * Escapes field according to RFC 4180 rules.
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSVContent(headers: string[], rows: (string | number | null | undefined)[][]): string {
  // Add UTF-8 BOM (\uFEFF) for optimal Microsoft Excel and Google Sheets Unicode compatibility
  const headerLine = headers.map(escapeCSVField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSVField).join(','));
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

export function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ExportOptions {
  excludeUnresolvedHumanReview?: boolean;
  applyReviewerOverrides?: boolean;
}

export function exportTriageResultsToCSV(
  results: TriageResult[],
  reviewerDecisions: Record<string | number, ReviewerDecision>,
  filterAction?: 'PROMOTE' | 'BLOCK' | 'IGNORE' | 'HUMAN_REVIEW',
  options: ExportOptions = { excludeUnresolvedHumanReview: true, applyReviewerOverrides: true }
): { content: string; rowCount: number } {
  const headers = [
    'Row ID',
    'Search Term',
    'Match Type',
    'Campaign',
    'Ad Group',
    'Impressions',
    'Clicks',
    'Cost ($)',
    'Conversions',
    'Conversion Value ($)',
    'CTR',
    'CVR',
    'CPA ($)',
    'ROAS',
    'Original Recommendation',
    'Final Action',
    'Confidence Score',
    'Primary Intent',
    'Needs Human Review',
    'Review Reason',
    'Reviewer Status',
    'Reviewer Notes',
    'Explanation',
    'Recommended Next Step',
  ];

  let filtered = results;

  // Filter by human review queue if specifically requested
  if (filterAction === 'HUMAN_REVIEW') {
    filtered = filtered.filter((r) => r.human_review.needs_review);
  } else if (filterAction) {
    filtered = filtered.filter((r) => {
      const decision = reviewerDecisions[r.row_id];
      const effectiveAction =
        options.applyReviewerOverrides && decision
          ? decision.decision_action
          : r.recommended_action;

      if (options.excludeUnresolvedHumanReview && r.human_review.needs_review && !decision) {
        return false;
      }
      return effectiveAction === filterAction;
    });
  } else if (options.excludeUnresolvedHumanReview) {
    // If exporting all, exclude unresolved human reviews if option checked
    filtered = filtered.filter((r) => {
      const decision = reviewerDecisions[r.row_id];
      return !r.human_review.needs_review || Boolean(decision);
    });
  }

  const rows: (string | number | null | undefined)[][] = filtered.map((item) => {
    const decision = reviewerDecisions[item.row_id];
    const finalAction =
      options.applyReviewerOverrides && decision
        ? decision.decision_action
        : item.recommended_action;

    return [
      item.row_id,
      item.search_term,
      item.match_type,
      item.campaign,
      item.ad_group,
      item.impressions,
      item.clicks,
      item.cost.toFixed(2),
      item.conversions,
      item.conversion_value.toFixed(2),
      item.features.ctr !== null ? `${(item.features.ctr * 100).toFixed(2)}%` : 'N/A',
      item.features.cvr !== null ? `${(item.features.cvr * 100).toFixed(2)}%` : 'N/A',
      item.features.cpa !== null ? `$${item.features.cpa.toFixed(2)}` : 'N/A',
      item.features.roas !== null ? `${item.features.roas.toFixed(2)}x` : 'N/A',
      item.recommended_action,
      finalAction,
      item.confidence,
      item.intent.primary_intent,
      item.human_review.needs_review ? 'YES' : 'NO',
      item.human_review.reason || '',
      decision ? (decision.status === 'overridden' ? 'OVERRIDDEN' : 'ACCEPTED') : 'PENDING_REVIEW',
      decision?.notes || '',
      item.explanation,
      item.recommended_next_step,
    ];
  });

  const content = generateCSVContent(headers, rows);
  return { content, rowCount: rows.length };
}

export function exportReviewAuditLogToCSV(
  decisions: ReviewerDecision[],
  allResultsMap: Map<string | number, TriageResult>
): { content: string; rowCount: number } {
  const headers = [
    'Row ID',
    'Search Term',
    'Campaign',
    'Ad Group',
    'Original Action',
    'Reviewer Action',
    'Status',
    'Reviewer Notes',
    'Timestamp',
  ];

  const rows = decisions.map((d) => {
    const result = allResultsMap.get(d.row_id);
    return [
      d.row_id,
      result?.search_term || '',
      result?.campaign || '',
      result?.ad_group || '',
      d.original_action,
      d.decision_action,
      d.status,
      d.notes,
      d.timestamp,
    ];
  });

  const content = generateCSVContent(headers, rows);
  return { content, rowCount: rows.length };
}
