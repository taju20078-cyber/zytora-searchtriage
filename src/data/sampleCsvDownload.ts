import { DEMO_DATASET } from './demoDataset';
import { generateCSVContent } from '../lib/csvExport';

export function getSampleCSVString(): string {
  const headers = [
    'row_id',
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

  const rows = DEMO_DATASET.map((r) => [
    r.row_id,
    r.search_term,
    r.match_type,
    r.campaign,
    r.ad_group,
    r.impressions,
    r.clicks,
    r.cost.toFixed(2),
    r.conversions,
    r.conversion_value.toFixed(2),
  ]);

  return generateCSVContent(headers, rows);
}
