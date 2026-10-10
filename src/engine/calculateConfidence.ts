import { CalculatedFeatures, HumanReviewStatus, IntentAnalysis, TriageAction } from '../types/searchTerm';

export interface ConfidenceBreakdown {
  score: number;
  intentFactor: number;
  sampleFactor: number;
  consistencyFactor: number;
  penalties: number;
  notes: string[];
}

/**
 * Deterministically computes a confidence score (0 to 100) reflecting
 * the strength of evidence supporting the rule-based recommendation.
 *
 * Factors:
 * 1. Intent Evidence Strength (0-40 points)
 * 2. Sample Size Adequacy (0-35 points)
 * 3. Signal Consistency & Financial Alignment (0-25 points)
 * 4. Deductions for anomalies, tiny samples, or conflicting evidence (-5 to -30 points)
 */
export function calculateConfidence(
  action: TriageAction,
  intent: IntentAnalysis,
  features: CalculatedFeatures,
  clicks: number,
  conversions: number,
  cost: number,
  humanReview: HumanReviewStatus
): ConfidenceBreakdown {
  const notes: string[] = [];
  let intentFactor = 0;
  let sampleFactor = 0;
  let consistencyFactor = 0;
  let penalties = 0;

  // 1. Intent factor (up to 40)
  if (intent.has_excluded_context) {
    if (intent.matched_excluded_intents.includes('job_seeking') || intent.matched_excluded_intents.includes('grants')) {
      intentFactor = 40;
      notes.push('Max intent weight: definitive negative keyword pattern (career/grant).');
    } else if (intent.matched_excluded_intents.includes('personal_loans') || intent.matched_excluded_intents.includes('mortgage') || intent.matched_excluded_intents.includes('car_loan')) {
      intentFactor = 38;
      notes.push('High intent weight: clear excluded consumer debt product.');
    } else {
      intentFactor = 32;
    }
  } else if (intent.has_commercial_context) {
    if (intent.matched_offered_products.some((p) => p !== 'general_business_finance')) {
      intentFactor = 36;
      notes.push('High intent weight: matches exact Kestrel commercial lending product line.');
    } else {
      intentFactor = 28;
      notes.push('Moderate intent weight: matches general commercial finance terminology.');
    }
  } else if (intent.primary_intent === 'ambiguous') {
    intentFactor = 12;
    notes.push('Low intent weight: ambiguous finance search term.');
  } else {
    intentFactor = 10;
  }

  // 2. Sample size adequacy (up to 35)
  if (clicks >= 40) {
    sampleFactor = 35;
    notes.push('Extensive statistical sample (>= 40 clicks).');
  } else if (clicks >= 20) {
    sampleFactor = 28;
    notes.push('Adequate statistical sample (20-39 clicks).');
  } else if (clicks >= 10) {
    sampleFactor = 20;
    notes.push('Moderate statistical sample (10-19 clicks).');
  } else if (clicks >= 5) {
    sampleFactor = 12;
    notes.push('Emerging sample (5-9 clicks).');
  } else if (clicks >= 1) {
    sampleFactor = 5;
    notes.push('Immature sample (1-4 clicks). Statistical variance is elevated.');
  } else {
    // 0 clicks
    sampleFactor = 2;
    notes.push('Zero-click impression data only.');
  }

  // 3. Signal consistency (up to 25)
  if (action === 'BLOCK' && intent.has_excluded_context) {
    // Blocking an excluded intent has high logical consistency regardless of conversions
    consistencyFactor = 25;
    notes.push('Strong policy alignment: query violates core product scope.');
  } else if (action === 'PROMOTE' && conversions >= 2 && features.roas !== null && features.roas >= 1.0) {
    consistencyFactor = 24;
    notes.push('Consistent financial returns: repeated conversions with viable ROAS.');
  } else if (action === 'PROMOTE' && conversions >= 2) {
    consistencyFactor = 20;
    notes.push('Consistent conversion signal (conversions >= 2).');
  } else if (action === 'IGNORE' && clicks < 5 && conversions === 0) {
    consistencyFactor = 22;
    notes.push('Conservative posture: waiting for statistical maturity before budget allocation.');
  } else if (action === 'BLOCK' && conversions === 0 && cost > 150) {
    consistencyFactor = 18;
    notes.push('Financial drain pattern: significant ad spend with zero returns.');
  } else {
    consistencyFactor = 12;
  }

  // 4. Penalties
  // Tiny sample conversion anomaly: 1 conversion with <= 2 clicks
  if (conversions === 1 && clicks <= 2 && action === 'PROMOTE') {
    penalties += 25;
    notes.push('High penalty (-25): Single conversion from minimal clicks lacks repeatability.');
  } else if (conversions === 1 && clicks <= 3) {
    penalties += 15;
    notes.push('Penalty (-15): Immature conversion signal (<= 3 clicks).');
  }

  // Conflicting signals: conversions on an excluded query
  if (intent.has_excluded_context && conversions > 0) {
    penalties += 20;
    notes.push('Contradiction penalty (-20): Conversion registered on an excluded intent query.');
  }

  // High spend with zero conversions but commercial intent
  if (conversions === 0 && cost > 200 && intent.has_commercial_context) {
    penalties += 15;
    notes.push('Uncertainty penalty (-15): High spend with commercial intent may indicate landing page/bidding issue rather than keyword defect.');
  }

  // Human review flag reduces automated confidence
  if (humanReview.needs_review) {
    penalties += 10;
    notes.push('Review escalation deduction (-10): flagged for human verification.');
  }

  let total = intentFactor + sampleFactor + consistencyFactor - penalties;
  total = Math.max(5, Math.min(99, Math.round(total)));

  return {
    score: total,
    intentFactor,
    sampleFactor,
    consistencyFactor,
    penalties,
    notes,
  };
}
