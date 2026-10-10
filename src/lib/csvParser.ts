import Papa from 'papaparse';
import { RawSearchTermRow } from '../types/searchTerm';
import { validateDataset, ValidationSummary } from '../engine/validateData';

export interface ParseResult {
  validRows: RawSearchTermRow[];
  invalidRows: ValidationSummary['invalid'];
  totalRows: number;
  detectedHeaders: string[];
  missingHeaders: string[];
  filename: string;
}

const HEADER_ALIASES: Record<string, string> = {
  // row_id
  row_id: 'row_id',
  rowid: 'row_id',
  'row id': 'row_id',
  id: 'row_id',

  // search_term
  search_term: 'search_term',
  searchterm: 'search_term',
  'search term': 'search_term',
  query: 'search_term',
  term: 'search_term',

  // match_type
  match_type: 'match_type',
  matchtype: 'match_type',
  'match type': 'match_type',
  type: 'match_type',

  // campaign
  campaign: 'campaign',
  'campaign name': 'campaign',
  campaign_name: 'campaign',

  // ad_group
  ad_group: 'ad_group',
  adgroup: 'ad_group',
  'ad group': 'ad_group',
  'ad group name': 'ad_group',

  // impressions
  impressions: 'impressions',
  impr: 'impressions',
  imprs: 'impressions',
  views: 'impressions',

  // clicks
  clicks: 'clicks',
  click: 'clicks',

  // cost
  cost: 'cost',
  spend: 'cost',
  'total cost': 'cost',
  amount_spent: 'cost',

  // conversions
  conversions: 'conversions',
  conv: 'conversions',
  convs: 'conversions',

  // conversion_value
  conversion_value: 'conversion_value',
  conversionvalue: 'conversion_value',
  'conversion value': 'conversion_value',
  conv_value: 'conversion_value',
  revenue: 'conversion_value',
  value: 'conversion_value',
};

export function normalizeHeader(rawHeader: string): string {
  const clean = rawHeader.toLowerCase().trim().replace(/['"]/g, '');
  return HEADER_ALIASES[clean] || clean;
}

export function parseCSVFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Keep strings for precision validation
      transformHeader: (header: string) => normalizeHeader(header),
      complete: (results) => {
        const detectedHeaders = results.meta.fields || [];
        const required = [
          'search_term',
          'match_type',
          'campaign',
          'ad_group',
          'impressions',
          'clicks',
          'cost',
          'conversions',
          'conversion_value',
        ];

        const missingHeaders = required.filter(
          (req) => !detectedHeaders.includes(req)
        );

        const validation = validateDataset(results.data);

        resolve({
          validRows: validation.valid,
          invalidRows: validation.invalid,
          totalRows: results.data.length,
          detectedHeaders,
          missingHeaders,
          filename: file.name,
        });
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

export function parseCSVString(
  csvContent: string,
  filename = 'input.csv'
): ParseResult {
  const results = Papa.parse<Record<string, unknown>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => normalizeHeader(header),
  });

  const detectedHeaders = results.meta.fields || [];
  const required = [
    'search_term',
    'match_type',
    'campaign',
    'ad_group',
    'impressions',
    'clicks',
    'cost',
    'conversions',
    'conversion_value',
  ];

  const missingHeaders = required.filter(
    (req) => !detectedHeaders.includes(req)
  );

  const validation = validateDataset(results.data);

  return {
    validRows: validation.valid,
    invalidRows: validation.invalid,
    totalRows: results.data.length,
    detectedHeaders,
    missingHeaders,
    filename,
  };
}
