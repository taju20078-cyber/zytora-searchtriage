import { RawSearchTermRow } from '../types/searchTerm';

export interface RowValidationError {
  row_index: number;
  row_id?: string | number;
  field: string;
  message: string;
  value: unknown;
}

export interface ValidationSummary {
  valid: RawSearchTermRow[];
  invalid: {
    row_index: number;
    raw: Record<string, unknown>;
    errors: string[];
  }[];
  total_processed: number;
}

export const REQUIRED_COLUMNS = [
  'search_term',
  'match_type',
  'campaign',
  'ad_group',
  'impressions',
  'clicks',
  'cost',
  'conversions',
  'conversion_value',
] as const;

export function validateRow(
  raw: Record<string, unknown>,
  rowIndex: number
): { validRow: RawSearchTermRow | null; errors: string[] } {
  const errors: string[] = [];

  // Check search_term
  const searchTermRaw = raw['search_term'] ?? raw['searchTerm'] ?? raw['Search Term'];
  if (searchTermRaw === undefined || searchTermRaw === null || String(searchTermRaw).trim() === '') {
    errors.push('Missing or empty search_term');
  }

  // Check match_type
  const matchTypeRaw = String(raw['match_type'] ?? raw['matchType'] ?? raw['Match Type'] ?? 'broad').toLowerCase().trim();
  const validMatchTypes = ['broad', 'phrase', 'exact'];
  const matchType = validMatchTypes.includes(matchTypeRaw) ? matchTypeRaw : 'broad';

  // Check campaign & ad_group
  const campaign = String(raw['campaign'] ?? raw['Campaign'] ?? 'Unknown Campaign').trim();
  const adGroup = String(raw['ad_group'] ?? raw['adGroup'] ?? raw['Ad Group'] ?? 'Unknown Ad Group').trim();

  // Validate numbers
  const parseNum = (fieldName: string, rawVal: unknown): number => {
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      errors.push(`Missing value for ${fieldName}`);
      return NaN;
    }
    const cleanStr = String(rawVal).replace(/[$,]/g, '').trim();
    const num = Number(cleanStr);
    if (isNaN(num)) {
      errors.push(`Invalid numeric format for ${fieldName}: "${rawVal}"`);
      return NaN;
    }
    if (num < 0) {
      errors.push(`Negative value not allowed for ${fieldName}: ${num}`);
      return NaN;
    }
    return num;
  };

  const impressions = parseNum('impressions', raw['impressions'] ?? raw['Impressions']);
  const clicks = parseNum('clicks', raw['clicks'] ?? raw['Clicks']);
  const cost = parseNum('cost', raw['cost'] ?? raw['Cost']);
  const conversions = parseNum('conversions', raw['conversions'] ?? raw['Conversions']);
  const conversionValue = parseNum(
    'conversion_value',
    raw['conversion_value'] ?? raw['conversionValue'] ?? raw['Conversion Value'] ?? raw['conv_value']
  );

  // Logical check: clicks cannot exceed impressions if impressions > 0
  if (!isNaN(clicks) && !isNaN(impressions) && impressions > 0 && clicks > impressions) {
    errors.push(`Clicks (${clicks}) cannot exceed impressions (${impressions})`);
  }

  const rowId = raw['row_id'] ?? raw['rowId'] ?? raw['Row ID'] ?? `row_${rowIndex + 1}`;

  if (errors.length > 0) {
    return { validRow: null, errors };
  }

  return {
    validRow: {
      row_id: rowId as string | number,
      search_term: String(searchTermRaw).trim(),
      match_type: matchType,
      campaign: campaign || 'Uncategorized Campaign',
      ad_group: adGroup || 'Uncategorized Ad Group',
      impressions,
      clicks,
      cost,
      conversions,
      conversion_value: conversionValue,
    },
    errors: [],
  };
}

export function validateDataset(rawRows: Record<string, unknown>[]): ValidationSummary {
  const valid: RawSearchTermRow[] = [];
  const invalid: {
    row_index: number;
    raw: Record<string, unknown>;
    errors: string[];
  }[] = [];

  rawRows.forEach((row, index) => {
    const { validRow, errors } = validateRow(row, index);
    if (validRow) {
      valid.push(validRow);
    } else {
      invalid.push({
        row_index: index,
        raw: row,
        errors,
      });
    }
  });

  return {
    valid,
    invalid,
    total_processed: rawRows.length,
  };
}
