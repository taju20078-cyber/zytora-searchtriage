import React from 'react';
import { BookOpen, CheckCircle2, ShieldAlert, AlertTriangle, Layers, Filter, Cpu, ArrowRight } from 'lucide-react';

export const MethodologySection: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          SearchIQ — Engineering Architecture & Triage Methodology
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Comprehensive documentation of deterministic rule modules, commercial taxonomy dictionaries, confidence rubrics, and safeguards for PS-01 Srishti-2K26.
        </p>
      </div>

      {/* System Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Cpu size={16} />
          <span>End-to-End System Architecture (Mermaid Flow)</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 overflow-x-auto text-xs font-mono leading-relaxed text-slate-700 dark:text-slate-300">
          <pre>{`flowchart TD
    A["CSV upload or dataset (25,000 rows)"] --> B["Parse & Header Normalization (Papa Parse)"]
    B --> C{"Validate Schema & Numbers"}
    C -- Invalid --> D["Show Validation Error Report"]
    C -- Valid --> E["Calculate Performance Features (CTR, CVR, CPA, ROAS)"]
    E --> F["Intent & Product Relevance Analysis (Kestrel Dictionaries)"]
    F --> G["Deterministic Triage Engine (Safeguards & Rules)"]
    E --> G
    G --> H["Calculate Confidence (0-100 deterministic score)"]
    H --> I{"Evidence Sufficient?"}
    I -- No --> J["Human Review Queue (Safeguards & Anomalies)"]
    I -- Yes --> K["PROMOTE / BLOCK / IGNORE"]
    J --> L["Analyst Accepts or Overrides"]
    K --> L
    L --> M["Save Reviewer Decision in LocalStorage"]
    M --> N["Export Full Classified CSV"]
    M --> O["Export PROMOTE Candidates"]
    M --> P["Export BLOCK Negatives"]
    M --> Q["Export Review Queue & Audit Log"]`}</pre>
        </div>
      </div>

      {/* Advertiser Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={16} />
            <span>Offered Products (Kestrel Business Funding)</span>
          </div>
          <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">• SBA Loans:</span>
              7(a), 504 real estate, express working capital loans.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">• Equipment Financing:</span>
              Heavy machinery, commercial trucks, medical & construction leasing.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">• Business Line of Credit (LOC):</span>
              Revolving unsecured credit lines for payroll and cash flow.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">• Merchant Cash Advance (MCA):</span>
              Daily sales advance and revenue-based commercial funding.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">• Working Capital Loans:</span>
              Invoice factoring, inventory loans, short-term LLC cash flow.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert size={16} />
            <span>Excluded Products & Intent (Immediate BLOCK)</span>
          </div>
          <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-rose-600">• Personal Loans:</span>
              Individual loans, bad credit personal cash, payday loans, debt consolidation.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-rose-600">• Residential Mortgages:</span>
              Home loans, refinance, FHA/VA, HELOC, first-time homebuyer.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-rose-600">• Auto & Student Loans:</span>
              Used car financing, auto title loans, student debt forgiveness, tuition.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-rose-600">• Free Grants:</span>
              Government grants, non-profit stimulus, free non-repayable money.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-rose-600">• Job & Career Seeking:</span>
              Loan officer jobs, salaries, careers, internships, hiring, employment.
            </li>
          </ul>
        </div>
      </div>

      {/* Core Decision Rules & Safeguards */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Decision Rules & Statistical Safeguards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              PROMOTE Criteria
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Assigned when search intent matches Kestrel commercial products and is backed by repeatable, credible conversion evidence (conversions &gt;= 2, profitable or healthy ROAS).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert size={14} />
              BLOCK Criteria
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Assigned when queries express explicit intent for excluded products (personal loans, auto, mortgages, grants, careers) or show persistent ad spend (&gt;=$150) with zero conversions.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter size={14} />
              IGNORE Criteria
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Queries without sufficient justification for action: low volume (&lt; 5 clicks), zero impressions/clicks, or general business queries without conversion proof.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              HUMAN REVIEW Safeguards
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              1 conversion from &lt;= 2 clicks is held in IGNORE and flagged for review. High spend (&gt;=$200) on commercial queries with 0 conv is escalated rather than blocked blindly.
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Score Rubric */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Deterministic Confidence Scoring Rubric (0 to 100)
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The confidence score represents the deterministic evidentiary strength of the rule match, not an opaque neural model probability:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-bold block text-indigo-600 dark:text-indigo-400 mb-0.5">Intent Strength</span>
            <span className="text-slate-500 text-[11px]">0 to 40 points based on specific product keyword dictionary matches.</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-bold block text-indigo-600 dark:text-indigo-400 mb-0.5">Sample Adequacy</span>
            <span className="text-slate-500 text-[11px]">0 to 35 points scaled by statistical click volume (&gt;=40 clk is max).</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-bold block text-indigo-600 dark:text-indigo-400 mb-0.5">Signal Consistency</span>
            <span className="text-slate-500 text-[11px]">0 to 25 points based on ROAS and conversion alignment.</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-bold block text-rose-600 dark:text-rose-400 mb-0.5">Penalties</span>
            <span className="text-slate-500 text-[11px]">-5 to -30 points deducted for sample anomalies and review flags.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
