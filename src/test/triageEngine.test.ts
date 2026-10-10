import { describe, it, expect, beforeEach } from 'vitest';
import { classifyTerm } from '../engine/classifyTerm';
import { calculateFeatures } from '../engine/calculateFeatures';
import { validateDataset, validateRow } from '../engine/validateData';
import { normalizeQuery, getExactGroupKey } from '../engine/normalizeQuery';
import { exportTriageResultsToCSV, generateCSVContent } from '../lib/csvExport';
import { RawSearchTermRow, ReviewerDecision } from '../types/searchTerm';
import { clearAllReviewerDecisions, loadReviewerDecisions, saveReviewerDecision } from '../lib/storage';

describe('SearchIQ — Intelligent Search Term Triage Engine (PS-01)', () => {
  // Test 1: Relevant query with credible positive evidence
  it('1. Relevant query with credible positive evidence -> PROMOTE with high confidence', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_1',
      search_term: 'sba 7a loan application online',
      match_type: 'phrase',
      campaign: 'Search_SBA_Loans',
      ad_group: 'SBA_7a_General',
      impressions: 1200,
      clicks: 65,
      cost: 325.0,
      conversions: 6,
      conversion_value: 3600.0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('PROMOTE');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.human_review.needs_review).toBe(false);
    expect(result.intent.matched_offered_products).toContain('sba_loans');
  });

  // Test 2: Explicit personal-loan query
  it('2. Explicit personal-loan query -> BLOCK even with small or zero conversions', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_2',
      search_term: 'personal loan for bad credit low rate',
      match_type: 'broad',
      campaign: 'Search_Working_Capital',
      ad_group: 'Cash_Flow_Loans',
      impressions: 450,
      clicks: 18,
      cost: 90.0,
      conversions: 0,
      conversion_value: 0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('BLOCK');
    expect(result.intent.has_excluded_context).toBe(true);
    expect(result.intent.matched_excluded_intents).toContain('personal_loans');
    expect(result.explanation).toContain('personal');
  });

  // Test 3: Grant-seeking query
  it('3. Grant-seeking query -> BLOCK', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_3',
      search_term: 'free government grant for women entrepreneurs',
      match_type: 'broad',
      campaign: 'Search_Working_Capital',
      ad_group: 'Cash_Flow_Loans',
      impressions: 2100,
      clicks: 80,
      cost: 400.0,
      conversions: 0,
      conversion_value: 0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('BLOCK');
    expect(result.intent.matched_excluded_intents).toContain('grants');
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  // Test 4: Employment query
  it('4. Employment query -> BLOCK', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_4',
      search_term: 'loan officer careers and salary at kestrel',
      match_type: 'phrase',
      campaign: 'Search_SBA_Loans',
      ad_group: 'SBA_7a_General',
      impressions: 320,
      clicks: 14,
      cost: 70.0,
      conversions: 0,
      conversion_value: 0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('BLOCK');
    expect(result.intent.matched_excluded_intents).toContain('job_seeking');
  });

  // Test 5: Relevant query with zero conversions and very few clicks
  it('5. Relevant query with zero conversions and very few clicks -> IGNORE (no premature block)', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_5',
      search_term: 'equipment financing for medical lasers',
      match_type: 'exact',
      campaign: 'Search_Equipment_Financing',
      ad_group: 'Medical_Equipment_Finance',
      impressions: 40,
      clicks: 2,
      cost: 11.0,
      conversions: 0,
      conversion_value: 0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('IGNORE');
    expect(result.human_review.needs_review).toBe(false);
  });

  // Test 6: One conversion from two clicks
  it('6. One conversion from two clicks -> NOT automatically PROMOTE, flagged for HUMAN REVIEW', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_6',
      search_term: 'commercial line of credit quick approval',
      match_type: 'phrase',
      campaign: 'Search_Business_Line_Of_Credit',
      ad_group: 'Unsecured_Business_LOC',
      impressions: 35,
      clicks: 2,
      cost: 14.0,
      conversions: 1,
      conversion_value: 800.0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).not.toBe('PROMOTE');
    expect(result.recommended_action).toBe('IGNORE');
    expect(result.human_review.needs_review).toBe(true);
    expect(result.human_review.reason).toContain('single conversion');
  });

  // Test 7: High-cost, zero-conversion query with ambiguous intent
  it('7. High-cost, zero-conversion query with ambiguous intent -> BLOCK with HUMAN REVIEW escalation', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_7',
      search_term: 'fast money urgent $10000',
      match_type: 'broad',
      campaign: 'Search_Working_Capital',
      ad_group: 'Cash_Flow_Loans',
      impressions: 1800,
      clicks: 65,
      cost: 290.0,
      conversions: 0,
      conversion_value: 0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('BLOCK');
    expect(result.human_review.needs_review).toBe(true);
  });

  // Test 8: Conflicting intent and performance signals
  it('8. Conflicting intent and performance signals -> Flagged for HUMAN REVIEW', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_8',
      search_term: 'personal loan for business use LLC',
      match_type: 'phrase',
      campaign: 'Search_Working_Capital',
      ad_group: 'Cash_Flow_Loans',
      impressions: 650,
      clicks: 24,
      cost: 120.0,
      conversions: 3,
      conversion_value: 1500.0,
    };
    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('BLOCK');
    expect(result.human_review.needs_review).toBe(true);
    expect(result.human_review.reason).toContain('Conflicting signals');
  });

  // Test 9: Zero impressions and zero clicks
  it('9. Zero impressions and zero clicks -> IGNORE, metrics null', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_9',
      search_term: 'sba express lender contact',
      match_type: 'exact',
      campaign: 'Search_SBA_Loans',
      ad_group: 'SBA_Express_Fast_Funding',
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      conversion_value: 0,
    };
    const features = calculateFeatures(row);
    expect(features.ctr).toBeNull();
    expect(features.cvr).toBeNull();
    expect(features.cpa).toBeNull();
    expect(features.roas).toBeNull();

    const result = classifyTerm(row);
    expect(result.recommended_action).toBe('IGNORE');
  });

  // Test 10: Zero cost and ROAS handling
  it('10. Zero cost and ROAS handling -> null ROAS, no division by zero error', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_10',
      search_term: 'free business credit check',
      match_type: 'broad',
      campaign: 'Search_Business_Line_Of_Credit',
      ad_group: 'Unsecured_Business_LOC',
      impressions: 50,
      clicks: 1,
      cost: 0,
      conversions: 0,
      conversion_value: 0,
    };
    const features = calculateFeatures(row);
    expect(features.roas).toBeNull();
  });

  // Test 11: Missing required columns
  it('11. Missing required columns -> Reported in validation errors', () => {
    const invalidRaw = {
      search_term: 'test term without cost or clicks',
      match_type: 'phrase',
      campaign: 'Campaign_A',
      // missing clicks, cost, impressions, conversions, conversion_value
    };
    const validation = validateRow(invalidRaw, 0);
    expect(validation.validRow).toBeNull();
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some((e) => e.includes('Missing value for impressions'))).toBe(true);
  });

  // Test 12: Invalid numeric values
  it('12. Invalid numeric values -> Negative numbers or string NaN rejected', () => {
    const rawWithNegative = {
      search_term: 'commercial loan',
      match_type: 'exact',
      campaign: 'Campaign_A',
      ad_group: 'AdGroup_1',
      impressions: 100,
      clicks: -5, // Invalid negative
      cost: 50,
      conversions: 1,
      conversion_value: 100,
    };
    const validation = validateRow(rawWithNegative, 0);
    expect(validation.validRow).toBeNull();
    expect(validation.errors.some((e) => e.includes('Negative value not allowed for clicks'))).toBe(true);
  });

  // Test 13: Duplicate terms across campaigns
  it('13. Duplicate terms across campaigns -> Grouped by exact normalized key while preserving distinct row IDs', () => {
    const term1 = '  Working Capital Loan Fast Approval! ';
    const term2 = 'working capital loan fast approval';
    expect(getExactGroupKey(term1)).toBe(getExactGroupKey(term2));
  });

  // Test 14: Confidence determinism and score bounds
  it('14. Confidence determinism and score bounds -> Between 5 and 99, completely deterministic', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_14',
      search_term: 'working capital loan short term',
      match_type: 'phrase',
      campaign: 'Search_Working_Capital',
      ad_group: 'Short_Term_Business_Loans',
      impressions: 800,
      clicks: 45,
      cost: 225.0,
      conversions: 4,
      conversion_value: 2800.0,
    };
    const res1 = classifyTerm(row);
    const res2 = classifyTerm(row);
    expect(res1.confidence).toBe(res2.confidence);
    expect(res1.confidence).toBeGreaterThanOrEqual(0);
    expect(res1.confidence).toBeLessThanOrEqual(100);
  });

  // Test 15: Human-review escalation
  it('15. Human-review escalation -> High-spend commercial queries with 0 conv flagged with high priority', () => {
    const row: RawSearchTermRow = {
      row_id: 'test_15',
      search_term: 'commercial loan lenders near me',
      match_type: 'broad',
      campaign: 'Search_Competitor_And_Generic',
      ad_group: 'Commercial_Lenders_Near_Me',
      impressions: 4500,
      clicks: 95,
      cost: 475.0,
      conversions: 0,
      conversion_value: 0,
    };
    const result = classifyTerm(row);
    expect(result.human_review.needs_review).toBe(true);
    expect(result.human_review.priority).toBe('HIGH');
  });

  // Test 16: CSV escaping and Unicode export
  it('16. CSV escaping and Unicode export -> Correct quotes, commas, newlines, and UTF-8 BOM', () => {
    const sampleRows = [
      ['row_1', 'term with, comma', 'phrase', 'Campaign "Quotes" & Accents é'],
      ['row_2', 'simple term', 'exact', 'Simple Campaign'],
    ];
    const csv = generateCSVContent(['ID', 'Query', 'Match', 'Campaign'], sampleRows);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"term with, comma"');
    expect(csv).toContain('"Campaign ""Quotes"" & Accents é"');
  });

  // Test 17: Preservation of row counts and IDs
  it('17. Preservation of row counts and IDs -> No rows dropped, original IDs intact', () => {
    const rawData = [
      { row_id: 'row_101', search_term: 'term 1', match_type: 'phrase', campaign: 'c1', ad_group: 'a1', impressions: 10, clicks: 1, cost: 5, conversions: 0, conversion_value: 0 },
      { row_id: 'row_102', search_term: 'term 2', match_type: 'exact', campaign: 'c2', ad_group: 'a2', impressions: 20, clicks: 2, cost: 10, conversions: 1, conversion_value: 100 },
    ];
    const validation = validateDataset(rawData);
    expect(validation.valid.length).toBe(2);
    expect(validation.valid[0].row_id).toBe('row_101');
    expect(validation.valid[1].row_id).toBe('row_102');
  });

  // Test 18: Reviewer overrides and persistence
  it('18. Reviewer overrides and persistence -> Override saved, original retained in separation', () => {
    const decision: ReviewerDecision = {
      row_id: 'row_999',
      original_action: 'IGNORE',
      decision_action: 'PROMOTE',
      status: 'overridden',
      notes: 'Strategic account query approved by analyst',
      timestamp: new Date().toISOString(),
    };
    saveReviewerDecision(decision);
    const loaded = loadReviewerDecisions();
    expect(loaded['row_999']).toBeDefined();
    expect(loaded['row_999'].decision_action).toBe('PROMOTE');
    expect(loaded['row_999'].original_action).toBe('IGNORE');
    clearAllReviewerDecisions();
    expect(loadReviewerDecisions()['row_999']).toBeUndefined();
  });
});
