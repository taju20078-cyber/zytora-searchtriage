import { ExcludedIntentType, IntentAnalysis, ProductIntentType } from '../types/searchTerm';
import { normalizeQuery } from './normalizeQuery';

interface IntentRule<T> {
  type: T;
  patterns: RegExp[];
  label: string;
}

const OFFERED_PRODUCT_RULES: IntentRule<ProductIntentType>[] = [
  {
    type: 'sba_loans',
    patterns: [
      /\bsba\b/i,
      /\bsba 7\(?a\)?\b/i,
      /\bsba 504\b/i,
      /\bsmall business administration loan/i,
      /\bsba express loan\b/i,
      /\bsba lender\b/i,
      /\bsba microloan\b/i,
    ],
    label: 'SBA Loans (7(a), 504, Express)',
  },
  {
    type: 'equipment_financing',
    patterns: [
      /\bequipment (financing|loan|lease|leasing)\b/i,
      /\bmachinery (financing|loan|lease)\b/i,
      /\bcommercial (truck|vehicle|equipment) (financing|loan)\b/i,
      /\bheavy equipment financing\b/i,
      /\bmedical equipment financing\b/i,
      /\brestaurant equipment loan\b/i,
    ],
    label: 'Equipment Financing & Leasing',
  },
  {
    type: 'merchant_cash_advance',
    patterns: [
      /\bmerchant cash advance\b/i,
      /\bmca\b/i,
      /\bmca funding\b/i,
      /\bcredit card split funding\b/i,
      /\brevenue based (financing|funding|advance)\b/i,
      /\bdaily (debit|repayment) loan\b/i,
    ],
    label: 'Merchant Cash Advance (MCA)',
  },
  {
    type: 'line_of_credit',
    patterns: [
      /\bbusiness line of credit\b/i,
      /\bcommercial line of credit\b/i,
      /\brevolving credit line business\b/i,
      /\bbusiness loc\b/i,
      /\bunsecured business line\b/i,
      /\bline of credit for (llc|business|company)\b/i,
    ],
    label: 'Business Line of Credit (LOC)',
  },
  {
    type: 'working_capital',
    patterns: [
      /\bworking capital\b/i,
      /\bcash flow loan\b/i,
      /\bshort term business loan\b/i,
      /\bbridge loan business\b/i,
      /\binventory financing\b/i,
      /\baccounts receivable financing\b/i,
      /\binvoice factoring\b/i,
    ],
    label: 'Working Capital & Cash Flow Loans',
  },
  {
    type: 'general_business_finance',
    patterns: [
      /\bbusiness loan(s)?\b/i,
      /\bsmall business loan(s)?\b/i,
      /\bcommercial loan(s)?\b/i,
      /\bbusiness funding\b/i,
      /\bcommercial lending\b/i,
      /\bstartup business loan(s)?\b/i,
      /\bllc loan(s)?\b/i,
      /\bcorporate loan(s)?\b/i,
    ],
    label: 'Commercial Business Lending',
  },
];

const EXCLUDED_PRODUCT_RULES: IntentRule<ExcludedIntentType>[] = [
  {
    type: 'personal_loans',
    patterns: [
      /\bpersonal loan(s)?\b/i,
      /\bpersonal line of credit\b/i,
      /\bfor personal use\b/i,
      /\bpayday loan(s)?\b/i,
      /\bindividual loan(s)?\b/i,
      /\bpeer to peer personal\b/i,
      /\bpersonal debt consolidation\b/i,
      /\bemergency cash for individual\b/i,
      /\bpersonal installment loan(s)?\b/i,
    ],
    label: 'Personal Loans / Consumer Credit',
  },
  {
    type: 'mortgage',
    patterns: [
      /\bmortgage(s)?\b/i,
      /\bhome loan(s)?\b/i,
      /\bhome purchase loan\b/i,
      /\brefinance (home|house|mortgage)\b/i,
      /\bfha loan(s)?\b/i,
      /\bva loan(s)?\b/i,
      /\bfirst time homebuyer\b/i,
      /\bresidential mortgage\b/i,
      /\bheloc\b/i,
    ],
    label: 'Mortgages & Residential Home Loans',
  },
  {
    type: 'car_loan',
    patterns: [
      /\b(car|auto|vehicle|truck) loan(s)?\b/i,
      /\bauto financing\b/i,
      /\bauto title loan(s)?\b/i,
      /\bused car finance\b/i,
      /\bmotorcycle loan(s)?\b/i,
      /\bcar lease for personal\b/i,
    ],
    label: 'Car & Auto Consumer Loans',
  },
  {
    type: 'student_loan',
    patterns: [
      /\bstudent loan(s)?\b/i,
      /\bcollege loan(s)?\b/i,
      /\btuition (loan|finance)\b/i,
      /\bfafsa\b/i,
      /\bstudent debt (forgiveness|refinance)\b/i,
      /\bschool loan(s)?\b/i,
    ],
    label: 'Student Loans & Education Debt',
  },
  {
    type: 'grants',
    patterns: [
      /\bgrant(s)?\b/i,
      /\bfree government money\b/i,
      /\bfree grant(s)?\b/i,
      /\bpell grant\b/i,
      /\bnonprofit grant(s)?\b/i,
      /\bstimulus check(s)?\b/i,
      /\bfree funding without repayment\b/i,
    ],
    label: 'Government & Non-Profit Grants',
  },
  {
    type: 'job_seeking',
    patterns: [
      /\bjob(s)?\b/i,
      /\bcareer(s)?\b/i,
      /\bhiring\b/i,
      /\bsalary\b/i,
      /\bwork from home\b/i,
      /\binternship(s)?\b/i,
      /\bresume\b/i,
      /\bglassdoor\b/i,
      /\binterview questions\b/i,
      /\bloan officer career\b/i,
      /\bunderwriter job\b/i,
    ],
    label: 'Employment & Career Seeking',
  },
  {
    type: 'templates_and_info',
    patterns: [
      /\b(sample|template|form|free download|pdf download|agreement template|blank form)\b/i,
      /\b(what is|meaning of|definition of|wikipedia|formula|how does.*work)\b/i,
      /\b(exam|quiz|homework|answers)\b/i,
    ],
    label: 'Informational / Academic / Templates',
  },
  {
    type: 'consumer_credit',
    patterns: [
      /\bcredit card bad credit personal\b/i,
      /\bconsumer debt relief\b/i,
      /\bcredit repair for individual\b/i,
    ],
    label: 'Consumer Credit Repair',
  },
];

export function analyzeIntent(query: string): IntentAnalysis {
  const norm = normalizeQuery(query);
  const notes: string[] = [];

  const matchedOffered: ProductIntentType[] = [];
  const matchedExcluded: ExcludedIntentType[] = [];

  for (const rule of OFFERED_PRODUCT_RULES) {
    if (rule.patterns.some((p) => p.test(norm))) {
      matchedOffered.push(rule.type);
      notes.push(`Matched offered product pattern: ${rule.label}`);
    }
  }

  for (const rule of EXCLUDED_PRODUCT_RULES) {
    if (rule.patterns.some((p) => p.test(norm))) {
      matchedExcluded.push(rule.type);
      notes.push(`Matched excluded intent pattern: ${rule.label}`);
    }
  }

  // Check contextual phrases where user is seeking personal finance disguised with business words
  // e.g., "can i get a personal loan for my business", "personal loan to start business", "personal loan vs business loan"
  const isPersonalInDisguise =
    /\bpersonal loan\b/i.test(norm) ||
    /\bfor personal use\b/i.test(norm) ||
    /\bpayday\b/i.test(norm) ||
    /\b(car|auto|student|mortgage|grant) loan\b/i.test(norm) ||
    /\b(fha|va|heloc)\b/i.test(norm);

  const hasCommercial = matchedOffered.length > 0;
  const hasExcluded = matchedExcluded.length > 0;

  let primary_intent: IntentAnalysis['primary_intent'] = 'generic';

  if (hasExcluded) {
    if (matchedExcluded.includes('job_seeking')) {
      primary_intent = 'job_seeking';
    } else if (matchedExcluded.includes('grants')) {
      primary_intent = 'grant_seeking';
    } else if (matchedExcluded.includes('personal_loans') || isPersonalInDisguise) {
      primary_intent = 'personal_loan';
    } else if (matchedExcluded.includes('templates_and_info')) {
      primary_intent = 'informational';
    } else {
      primary_intent = 'excluded_product';
    }

    if (hasCommercial) {
      notes.push(
        'Conflict detected: Query contains both commercial terminology and excluded consumer/grant/career markers. Excluded intent takes precedence for Kestrel products.'
      );
    }
  } else if (hasCommercial) {
    primary_intent = 'offered_product';
  } else {
    // Check if ambiguous
    const ambiguousTerms = ['fast money', 'quick loan', 'borrow $5000', 'need money today', 'cash advance', 'apply for money', 'financing', 'credit line'];
    const isAmbiguous = ambiguousTerms.some((t) => norm.includes(t));
    if (isAmbiguous) {
      primary_intent = 'ambiguous';
      notes.push('Ambiguous intent: Query seeks funding without specifying commercial or personal eligibility context.');
    } else {
      primary_intent = 'generic';
    }
  }

  // Calculate intent confidence score (0-100)
  let intentConfidence = 50;
  if (hasExcluded && !hasCommercial) {
    intentConfidence = 95; // very clear excluded intent
  } else if (hasExcluded && hasCommercial) {
    intentConfidence = 85; // clear negative filter override
  } else if (hasCommercial) {
    // specific products like SBA, Equipment, MCA are higher confidence than vague 'loan'
    if (matchedOffered.some((p) => p !== 'general_business_finance')) {
      intentConfidence = 90;
    } else {
      intentConfidence = 75;
    }
  } else if (primary_intent === 'ambiguous') {
    intentConfidence = 35;
  } else {
    intentConfidence = 45;
  }

  return {
    primary_intent,
    has_commercial_context: hasCommercial,
    has_excluded_context: hasExcluded,
    matched_offered_products: matchedOffered,
    matched_excluded_intents: matchedExcluded,
    intent_confidence: intentConfidence,
    notes,
  };
}
