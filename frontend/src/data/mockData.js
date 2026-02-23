// Mock data for Danish Legal Assistant frontend
// Source: data/danish_laws_production.json from the Python backend (41 real laws)

export const CATEGORY_CONFIG = {
  immigration: {
    label: 'Immigration',
    emoji: '🔵',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
    borderLeftClass: 'border-l-blue-500',
    dotClass: 'bg-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-900/40',
  },
  tax: {
    label: 'Tax',
    emoji: '🟢',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    borderLeftClass: 'border-l-emerald-500',
    dotClass: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-900/40',
  },
  labor: {
    label: 'Labor',
    emoji: '🟡',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    borderLeftClass: 'border-l-amber-500',
    dotClass: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-900/40',
  },
  business: {
    label: 'Business',
    emoji: '🟣',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
    borderLeftClass: 'border-l-purple-500',
    dotClass: 'bg-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-900/40',
  },
};

// Minimal mock fallback — the real 41 laws are loaded from the API.
// This is only used if the backend is unavailable.
export const LAWS = [
  {
    id: 'imm_pay_limit_001',
    category: 'immigration',
    subcategory: 'work_permits',
    title: 'Pay Limit Scheme — Work Permit for High-Salary Jobs',
    title_da: 'Beløbsordningen',
    law_reference: 'Udlændingeloven §9a, stk. 2, nr. 12',
    content:
      'The Pay Limit Scheme (Beløbsordningen) allows non-EU/EEA citizens to obtain a residence and work permit in Denmark if offered a job with a sufficiently high annual salary. For 2026, the minimum annual salary is DKK 552,000 (adjusted every January 1). No specific educational background or professional field is required. Processing time is normally 1 month. The fee is DKK 6,810.',
    summary: 'Work permit for jobs paying DKK 552,000+ annually. No education requirement. 1-month processing. Valid up to 4 years.',
    keywords: ['pay limit', 'beløbsordningen', 'work permit', 'high salary', '552000', 'DKK', 'SIRI'],
    key_facts: { salary_threshold: 'DKK 552,000/year (2026)', processing_time: '1 month (up to 3 months)', fee: 'DKK 6,810', validity: 'Up to 4 years' },
    related_laws: ['imm_fast_track_002', 'imm_supplementary_pay_003'],
    source_url: 'https://www.nyidanmark.dk/en-GB/You-want-to-apply/Work/Pay-limit-scheme',
    practical_tips: 'The salary threshold is adjusted annually on January 1. Benefits like company car do NOT count.',
    last_verified: '2025-02-22',
  },
  {
    id: 'imm_fast_track_002',
    category: 'immigration',
    subcategory: 'work_permits',
    title: 'Fast-Track Scheme — Expedited Work Permits for Certified Companies',
    title_da: 'Fast-track-ordningen',
    law_reference: 'Udlændingeloven §9a, stk. 2, nr. 14',
    content:
      'The Fast-Track Scheme enables SIRI-certified companies to hire foreign workers with reduced processing times (~10 business days). Five tracks: Pay Limit, Supplementary Pay Limit, Short-Term (up to 3 months), Researcher, and Educational. Employer must be SIRI-certified. Fee DKK 6,810.',
    summary: 'Expedited work permits (~10 days) through SIRI-certified companies. Five tracks including pay limit, short-term, and researcher.',
    keywords: ['fast-track', 'certified company', 'quick processing', 'SIRI certification', 'expedited'],
    key_facts: { salary_threshold: 'DKK 552,000 (pay limit) / DKK 446,000 (supplementary)', processing_time: '~10 business days', fee: 'DKK 6,810', validity: 'Up to 4 years' },
    related_laws: ['imm_pay_limit_001', 'imm_supplementary_pay_003'],
    source_url: 'https://www.nyidanmark.dk/en-GB/You-want-to-apply/Work/Fast-track',
    practical_tips: 'Check if your employer is SIRI-certified on their website.',
    last_verified: '2025-02-22',
  },
  {
    id: 'tax_income_001',
    category: 'tax',
    subcategory: 'personal_income',
    title: 'Personal Income Tax — Overview of Rates and Brackets',
    title_da: 'Personlig indkomstskat',
    law_reference: 'Personskatteloven §6, §7; Kommuneskatteloven',
    content:
      'Denmark uses a multi-bracket progressive income tax system. For 2026: Bottom tax (bundskat) is 12.01% on income above DKK 49,700. Top tax (topskat) is 15% on income exceeding DKK 611,800. Municipal tax (kommuneskat) averages 25.1%. Labour Market Contribution (AM-bidrag) is 8% of gross salary, calculated first.',
    summary: 'Progressive income tax with bottom bracket (12.01%), top bracket (15%), and municipal tax (~25%). Effective rate 37–52%.',
    keywords: ['income tax', 'bundskat', 'topskat', 'kommuneskat', 'AM-bidrag', 'tax bracket'],
    key_facts: { am_bidrag: '8% of gross salary', bottom_tax: '12.01% (above DKK 49,700)', top_tax: '15% (above DKK 611,800)', municipal_tax: '~25.1% (average)', effective_rate: '37–52% depending on income' },
    related_laws: ['tax_forskerskat_002', 'tax_card_003'],
    source_url: 'https://www.skat.dk/borger/skatter-og-afgifter/indkomstskat',
    practical_tips: 'Use skat.dk tax calculator (skatteberegning) to estimate your exact take-home pay.',
    last_verified: '2025-02-22',
  },
  {
    id: 'lab_vacation_001',
    category: 'labor',
    subcategory: 'leave',
    title: 'Annual Vacation Entitlement — 5 Weeks Paid Leave',
    title_da: 'Ferie og feriepenge',
    law_reference: 'Ferieloven §7, §16, §23',
    content:
      'All employees in Denmark accrue 2.08 vacation days per month of employment, totalling 25 days (5 weeks) per year. Vacation pay is 12.5% of gross earnings. The vacation year runs from September 1 to August 31. Up to 5 unused days can be transferred to next year.',
    summary: '5 weeks (25 days) paid vacation per year. Vacation pay is 12.5% of gross salary. Up to 5 days can be carried over.',
    keywords: ['vacation', 'ferie', '25 days', '5 weeks', '12.5%', 'FerieKonto', 'holiday'],
    key_facts: { entitlement: '25 days (5 weeks) per year', accrual: '2.08 days per month of employment', vacation_pay: '12.5% of gross salary from earning year', carryover: 'Up to 5 days to next vacation year' },
    related_laws: ['lab_parental_leave_002', 'lab_sick_leave_003'],
    source_url: 'https://www.borger.dk/arbejde-dagpenge-ferie/ferie/ferie-for-loenmmodtagere',
    practical_tips: 'You can check your vacation pay balance at FerieKonto (feriekonto.dk).',
    last_verified: '2025-02-22',
  },
  {
    id: 'biz_aps_001',
    category: 'business',
    subcategory: 'company_formation',
    title: 'ApS (Private Limited Company) — Formation and Requirements',
    title_da: 'Anpartsselskab (ApS)',
    law_reference: 'Selskabsloven §4, §5, §33',
    content:
      'An ApS (Anpartsselskab) is the most common business structure for small/medium companies in Denmark. Minimum share capital is DKK 40,000. Registration is done via Virk.dk. A Danish CVR number is issued upon registration. The company must have at least one director (direktør) who can be a non-resident.',
    summary: 'Most common Danish company type. DKK 40,000 minimum capital. Register at Virk.dk. 1-3 business days processing.',
    keywords: ['ApS', 'limited company', 'anpartsselskab', 'CVR', 'share capital', 'virk.dk', 'company formation'],
    key_facts: { minimum_capital: 'DKK 40,000', registration_platform: 'virk.dk', processing_time: '1–3 business days', ceo_residence: 'No Danish residency required for director' },
    related_laws: ['biz_as_002', 'biz_vat_003'],
    source_url: 'https://virk.dk/myndigheder/stat/ErhvervsstyrelsenOgVirkDK/selvbetjening/Registrer_virksomhed',
    practical_tips: 'You can register an ApS yourself at virk.dk for a fee of DKK 670. A lawyer is not required.',
    last_verified: '2025-02-22',
  },
];

export const EXAMPLE_QUERIES = [
  { text: 'Can I work in Denmark with a Ukrainian passport?', category: 'immigration' },
  { text: 'What is the income tax rate in Denmark?', category: 'tax' },
  { text: 'How many vacation days am I entitled to per year?', category: 'labor' },
  { text: 'What are the EU Blue Card requirements?', category: 'immigration' },
  { text: 'What is the notice period for employment termination?', category: 'labor' },
  { text: 'How do I get a Danish tax card as a foreigner?', category: 'tax' },
];

export const STATS = {
  lawCount: 41,
  categoryCount: 4,
  avgSearchMs: 17,
  accuracy: '100%',
};
