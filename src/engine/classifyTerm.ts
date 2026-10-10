import { CalculatedFeatures, HumanReviewStatus, IntentAnalysis, RawSearchTermRow, TriageAction, TriageResult } from '../types/searchTerm';
import { calculateConfidence } from './calculateConfidence';
import { calculateFeatures } from './calculateFeatures';
import { analyzeIntent } from './classifyIntent';
import { explainDecision } from './explainDecision';

export function classifyTerm(row: RawSearchTermRow): TriageResult {
  const features = calculateFeatures(row);
  const intent = analyzeIntent(row.search_term);

  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  const cost = Number(row.cost) || 0;
  const conversions = Number(row.conversions) || 0;
  const roas = features.roas;

  const rulesTriggered: string[] = [];
  let action: TriageAction = 'IGNORE';
  const humanReview: HumanReviewStatus = {
    needs_review: false,
    reason: null,
    priority: 'NONE',
  };

  // -------------------------------------------------------------
  // RULE SET 1: EXCLUDED PRODUCT & NEGATIVE INTENT CHECKS
  // -------------------------------------------------------------
  if (intent.has_excluded_context) {
    action = 'BLOCK';
    rulesTriggered.push(`EXCLUDED_INTENT_DETECTED: Matched ${intent.matched_excluded_intents.join(', ')}`);

    // SAFEGUARD: If someone registered conversions on an excluded query, this is anomalous/conflicting
    if (conversions > 0) {
      humanReview.needs_review = true;
      humanReview.reason = `Conflicting signals: ${conversions} conversion(s) registered on excluded category (${intent.matched_excluded_intents.join(', ')}). Possible conversion tracking glitch or hybrid search intent.`;
      humanReview.priority = 'HIGH';
      rulesTriggered.push('CONFLICT_EXCLUDED_WITH_CONVERSIONS');
    }
  }

  // -------------------------------------------------------------
  // RULE SET 2: POSITIVE PERFORMANCE & PROMOTION CRITERIA
  // -------------------------------------------------------------
  else if (conversions >= 2 && intent.has_commercial_context) {
    // Verified repeatable conversion performance matching offered products
    action = 'PROMOTE';
    rulesTriggered.push(`REPEATABLE_CONVERSIONS: ${conversions} conversions with commercial product match`);

    if (roas !== null && roas >= 1.0) {
      rulesTriggered.push(`PROFITABLE_ROAS: ROAS is ${roas.toFixed(2)}x (>= 1.0x)`);
    }
  }

  // SAFEGUARD: One conversion from minimal clicks (<= 2 clicks) MUST NOT trigger PROMOTE
  else if (conversions === 1 && clicks <= 2) {
    action = 'IGNORE';
    humanReview.needs_review = true;
    humanReview.reason = 'Immature sample safeguard: single conversion from <= 2 clicks lacks statistical repeatability. Held in IGNORE pending volume.';
    humanReview.priority = 'MEDIUM';
    rulesTriggered.push('SAFEGUARD_SINGLE_CONVERSION_MINIMAL_CLICKS');
  }

  // Moderate conversion proof: 1 conversion with 3-9 clicks and commercial intent
  else if (conversions === 1 && clicks >= 3 && intent.has_commercial_context && cost < 150) {
    action = 'IGNORE'; // conservative: hold until second conversion
    humanReview.needs_review = true;
    humanReview.reason = 'Emerging conversion signal (1 conversion across moderate clicks). Monitor for repeat conversion before promoting.';
    humanReview.priority = 'LOW';
    rulesTriggered.push('SINGLE_CONVERSION_OBSERVATION');
  }

  // Strong engagement test candidate: high clicks and high CTR with core commercial intent, but 0 conv yet low spend
  else if (clicks >= 15 && (features.ctr ?? 0) >= 0.08 && intent.has_commercial_context && cost < 100 && conversions === 0) {
    action = 'IGNORE'; // not enough conversion evidence yet
    rulesTriggered.push('HIGH_ENGAGEMENT_MONITORING');
  }

  // -------------------------------------------------------------
  // RULE SET 3: HIGH SPEND & PERFORMANCE UNDERPERFORMANCE
  // -------------------------------------------------------------
  // SAFEGUARD: High spend without conversions is NOT sufficient by itself to prove irrelevance
  // If commercial intent exists with high spend (>= $200) and 0 conv: flag for human review
  else if (cost >= 200 && conversions === 0 && intent.has_commercial_context) {
    action = 'IGNORE'; // Do not blindly block relevant commercial keyword; escalate!
    humanReview.needs_review = true;
    humanReview.reason = `High ad spend ($${cost.toFixed(2)}) with zero conversions on commercial query. Audit landing page, ad copy, and bidding strategy before blocking.`;
    humanReview.priority = 'HIGH';
    rulesTriggered.push('HIGH_SPEND_COMMERCIAL_ZERO_CONVERSIONS_REVIEW');
  }

  // Ambiguous or generic intent with substantial spend (>= $150) and zero conversions: BLOCK
  else if (cost >= 150 && conversions === 0 && (intent.primary_intent === 'ambiguous' || intent.primary_intent === 'generic')) {
    action = 'BLOCK';
    rulesTriggered.push(`EXCESSIVE_SPEND_OFF_TARGET: Spent $${cost.toFixed(2)} with 0 conversions on non-commercial query`);

    if (intent.primary_intent === 'ambiguous') {
      humanReview.needs_review = true;
      humanReview.reason = `Ambiguous query with substantial spend ($${cost.toFixed(2)}) and zero conversions. Block recommended, review ad group negative match.`;
      humanReview.priority = 'MEDIUM';
    }
  }

  // Moderate spend (>= $75) on ambiguous queries with 0 conversions
  else if (cost >= 75 && conversions === 0 && intent.primary_intent === 'ambiguous' && clicks >= 10) {
    action = 'BLOCK';
    rulesTriggered.push('PERSISTENT_AMBIGUOUS_CLICK_DRAIN');
  }

  // -------------------------------------------------------------
  // RULE SET 4: SAFEGUARDS FOR LOW VOLUME / ZERO CLICKS
  // -------------------------------------------------------------
  // SAFEGUARD: Zero conversions from a few clicks must NOT trigger BLOCK
  else if (conversions === 0 && clicks < 5) {
    action = 'IGNORE';
    rulesTriggered.push('IMMATURE_SAMPLE_LOW_CLICKS_IGNORE');
  }

  // Zero impressions / zero clicks
  else if (impressions === 0 || clicks === 0) {
    action = 'IGNORE';
    rulesTriggered.push('ZERO_CLICK_INSUFFICIENT_DATA');
  }

  // Catch-all
  else {
    action = 'IGNORE';
    rulesTriggered.push('DEFAULT_INSUFFICIENT_JUSTIFICATION');
  }

  // Additional check: Ambiguous intent queries with some spend
  if (intent.primary_intent === 'ambiguous' && cost > 50 && !humanReview.needs_review) {
    humanReview.needs_review = true;
    humanReview.reason = 'Ambiguous commercial eligibility intent with active budget consumption.';
    humanReview.priority = 'LOW';
  }

  // Calculate confidence
  const confBreakdown = calculateConfidence(
    action,
    intent,
    features,
    clicks,
    conversions,
    cost,
    humanReview
  );

  // Generate explainability
  const explanationResult = explainDecision(
    action,
    intent,
    features,
    {
      search_term: row.search_term,
      campaign: row.campaign,
      ad_group: row.ad_group,
      impressions,
      clicks,
      cost,
      conversions,
      conversion_value: Number(row.conversion_value) || 0,
    },
    humanReview
  );

  return {
    row_id: row.row_id,
    search_term: row.search_term,
    match_type: row.match_type,
    campaign: row.campaign,
    ad_group: row.ad_group,
    impressions,
    clicks,
    cost,
    conversions,
    conversion_value: Number(row.conversion_value) || 0,
    features,
    intent,
    recommended_action: action,
    confidence: confBreakdown.score,
    human_review: humanReview,
    explanation: explanationResult.summary,
    rules_triggered: rulesTriggered,
    recommended_next_step: explanationResult.recommended_next_step,
  };
}
