import { CalculatedFeatures, RawSearchTermRow } from '../types/searchTerm';
import { normalizeQuery, tokenizeQuery } from './normalizeQuery';

/**
 * Calculates deterministic performance features for a search term row.
 * Denominators of zero return null rather than infinity or fabricated values.
 */
export function calculateFeatures(row: RawSearchTermRow): CalculatedFeatures {
  const norm = normalizeQuery(row.search_term);
  const tokens = tokenizeQuery(norm);

  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  const cost = Number(row.cost) || 0;
  const conversions = Number(row.conversions) || 0;
  const conversion_value = Number(row.conversion_value) || 0;

  const ctr = impressions > 0 ? clicks / impressions : null;
  const cvr = clicks > 0 ? conversions / clicks : null;
  const cpa = conversions > 0 ? cost / conversions : null;
  const cpc = clicks > 0 ? cost / clicks : null;
  const roas = cost > 0 ? conversion_value / cost : null;
  const value_per_click = clicks > 0 ? conversion_value / clicks : null;

  return {
    ctr: ctr !== null ? Math.round(ctr * 10000) / 10000 : null,
    cvr: cvr !== null ? Math.round(cvr * 10000) / 10000 : null,
    cpa: cpa !== null ? Math.round(cpa * 100) / 100 : null,
    cpc: cpc !== null ? Math.round(cpc * 100) / 100 : null,
    roas: roas !== null ? Math.round(roas * 100) / 100 : null,
    value_per_click: value_per_click !== null ? Math.round(value_per_click * 100) / 100 : null,
    normalized_query: norm,
    word_count: tokens.length,
  };
}
