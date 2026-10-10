export type MatchType = 'broad' | 'phrase' | 'exact';

export interface RawSearchTermRow {
  row_id: string | number;
  search_term: string;
  match_type: string;
  campaign: string;
  ad_group: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversion_value: number;
}

export interface CalculatedFeatures {
  ctr: number | null;
  cvr: number | null;
  cpa: number | null;
  cpc: number | null;
  roas: number | null;
  value_per_click: number | null;
  normalized_query: string;
  word_count: number;
}

export type ProductIntentType =
  | 'working_capital'
  | 'equipment_financing'
  | 'line_of_credit'
  | 'merchant_cash_advance'
  | 'sba_loans'
  | 'general_business_finance';

export type ExcludedIntentType =
  | 'personal_loans'
  | 'mortgage'
  | 'car_loan'
  | 'student_loan'
  | 'grants'
  | 'job_seeking'
  | 'templates_and_info'
  | 'consumer_credit';

export interface IntentAnalysis {
  primary_intent: 'offered_product' | 'excluded_product' | 'informational' | 'job_seeking' | 'grant_seeking' | 'personal_loan' | 'ambiguous' | 'generic';
  has_commercial_context: boolean;
  has_excluded_context: boolean;
  matched_offered_products: ProductIntentType[];
  matched_excluded_intents: ExcludedIntentType[];
  intent_confidence: number;
  notes: string[];
}

export type TriageAction = 'PROMOTE' | 'BLOCK' | 'IGNORE';

export type ReviewPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface HumanReviewStatus {
  needs_review: boolean;
  reason: string | null;
  priority: ReviewPriority;
}

export interface TriageResult {
  row_id: string | number;
  search_term: string;
  match_type: string;
  campaign: string;
  ad_group: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversion_value: number;
  features: CalculatedFeatures;
  intent: IntentAnalysis;
  recommended_action: TriageAction;
  confidence: number;
  human_review: HumanReviewStatus;
  explanation: string;
  rules_triggered: string[];
  recommended_next_step: string;
}

export interface ReviewerDecision {
  row_id: string | number;
  original_action: TriageAction;
  decision_action: TriageAction;
  status: 'accepted' | 'overridden';
  notes: string;
  timestamp: string;
}

export interface ValidationIssue {
  row_index: number;
  row_id?: string | number;
  field: string;
  issue: string;
  raw_value?: unknown;
}

export interface ParseValidationResult {
  valid_rows: RawSearchTermRow[];
  invalid_rows: {
    row_index: number;
    raw_data: Record<string, unknown>;
    errors: string[];
  }[];
  total_read: number;
  filename: string;
  column_mapping: Record<string, string>;
}
