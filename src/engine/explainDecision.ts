import { CalculatedFeatures, HumanReviewStatus, IntentAnalysis, TriageAction } from '../types/searchTerm';

export interface DecisionExplanation {
  summary: string;
  evidence: string[];
  recommended_next_step: string;
}

export function explainDecision(
  action: TriageAction,
  intent: IntentAnalysis,
  features: CalculatedFeatures,
  row: {
    search_term: string;
    campaign: string;
    ad_group: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversion_value: number;
  },
  humanReview: HumanReviewStatus
): DecisionExplanation {
  const evidence: string[] = [];
  let summary = '';
  let nextStep = '';

  const { impressions, clicks, cost, conversions } = row;
  const ctrPct = features.ctr !== null ? `${(features.ctr * 100).toFixed(1)}%` : 'N/A';
  const cvrPct = features.cvr !== null ? `${(features.cvr * 100).toFixed(1)}%` : 'N/A';
  const cpaFmt = features.cpa !== null ? `$${features.cpa.toFixed(2)}` : 'N/A';
  const roasFmt = features.roas !== null ? `${features.roas.toFixed(2)}x` : 'N/A';

  evidence.push(`Volume: ${impressions.toLocaleString()} imp, ${clicks} clicks (${ctrPct} CTR)`);
  evidence.push(`Financials: $${cost.toFixed(2)} spent, ${conversions} conversions (${cvrPct} CVR, CPA: ${cpaFmt}, ROAS: ${roasFmt})`);

  if (intent.has_excluded_context) {
    const excludedTypes = intent.matched_excluded_intents.join(', ');
    evidence.push(`Intent Match: Excluded category detected [${excludedTypes}]`);
  } else if (intent.has_commercial_context) {
    const products = intent.matched_offered_products.join(', ');
    evidence.push(`Intent Match: Offered commercial product [${products}]`);
  } else {
    evidence.push(`Intent Match: ${intent.primary_intent}`);
  }

  // Generate actionable summary based on recommendation & context
  switch (action) {
    case 'PROMOTE':
      if (conversions >= 2 && features.roas !== null && features.roas >= 1.0) {
        summary = `High-performing commercial search query with ${conversions} verified conversions and profitable ${roasFmt} ROAS. Strongly aligns with Kestrel core lending products.`;
        nextStep = `Add "${row.search_term}" as an Exact Match keyword in Campaign "${row.campaign}", Ad Group "${row.ad_group}". Consider dedicated ad copy focusing on fast approvals.`;
      } else if (conversions >= 2) {
        summary = `Proven conversion generator (${conversions} conversions, ${cpaFmt} CPA). Consistent demand matching commercial finance offerings.`;
        nextStep = `Harvest "${row.search_term}" into an exact match keyword with bid cap tied to target CPA ($${cpaFmt}).`;
      } else if (clicks >= 10 && (features.ctr ?? 0) > 0.05 && intent.has_commercial_context) {
        summary = `High click-through engagement (${ctrPct} CTR on ${clicks} clicks) for core product line. Qualifies as a controlled test candidate.`;
        nextStep = `Add as Phrase Match keyword with conservative test bid to observe conversion repeatability.`;
      } else {
        summary = `Positive commercial indicators observed. Candidate for targeted keyword expansion.`;
        nextStep = `Add as Phrase match keyword with standard ad group bid.`;
      }
      break;

    case 'BLOCK':
      if (intent.has_excluded_context) {
        const cat = intent.matched_excluded_intents[0] || 'excluded';
        summary = `Search intent explicitly targets non-offered category (${cat.replace('_', ' ')}). Kestrel does not service this loan type; ad spend is wasted.`;
        nextStep = `Add negative keyword [${row.search_term.toLowerCase()}] or root negative across campaign "${row.campaign}" to protect budget.`;
      } else if (cost > 150 && conversions === 0) {
        summary = `Substantial advertising drain: $${cost.toFixed(2)} spent across ${clicks} clicks without generating any conversions.`;
        nextStep = `Add [${row.search_term.toLowerCase()}] as negative exact keyword in ad group "${row.ad_group}" to eliminate further budget leakage.`;
      } else {
        summary = `Poor performance profile and off-target search intent. Negative keyword block recommended.`;
        nextStep = `Add as negative exact match keyword.`;
      }
      break;

    case 'IGNORE':
      if (clicks === 0) {
        summary = `Query triggered ${impressions} impressions with zero clicks. No budget consumed; statistically insufficient for keyword action.`;
        nextStep = `Take no action. Monitor if impression volume rises and triggers unintentional clicks.`;
      } else if (clicks < 5 && conversions === 0) {
        summary = `Low volume (${clicks} clicks, $${cost.toFixed(2)} spent). Insufficient statistical sample to justify either promotion or blocking.`;
        nextStep = `Keep under passive observation. Do not block prematurely before accumulating at least 10-15 clicks.`;
      } else {
        summary = `Neutral performance with neither strong conversion upside nor decisive negative drain.`;
        nextStep = `Maintain current ad group targeting without changes.`;
      }
      break;
  }

  // Handle human review overlay
  if (humanReview.needs_review) {
    summary += ` [HUMAN REVIEW REQUIRED: ${humanReview.reason}]`;
    nextStep = `Senior Analyst action required: ${humanReview.reason}. Review landing page and loan application funnel before finalizing status.`;
  }

  return {
    summary,
    evidence,
    recommended_next_step: nextStep,
  };
}
