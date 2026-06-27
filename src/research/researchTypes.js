// Applyflow Research Engine — types, filter options, future-ready storage keys

/** Reserved for research history (not implemented yet) */
export const RESEARCH_STORAGE_KEYS = {
  history: 'applyflow_research_history',
  savedPrompts: 'applyflow_research_saved_prompts',
  watchlists: 'applyflow_research_watchlists',
};

export const ROLE_CATEGORIES = [
  'Product Design',
  'UI/UX',
  'Product Designer',
  'Design Systems',
  'AI-native Designer',
  'Visual Design',
  'UX Research',
  'No-code Product Design',
  'AI Product Design',
];

export const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Mid-Senior', 'Senior', 'Lead'];

export const REMOTE_PREFERENCES = [
  'Global Remote Only',
  'Remote First',
  'Async Friendly',
  'No Strong Preference',
];

export const TIMEZONE_OPTIONS = [
  'WAT Preferred',
  'Europe Overlap',
  'Americas Overlap',
  'Any',
];

export const TEAM_SIZES = [
  'Startup (1–20)',
  'Growth (21–100)',
  'Scale (100–200)',
  'Any',
];

export const AI_TOOL_OPTIONS = [
  'Figma',
  'Cursor',
  'Claude',
  'Gemini',
  'Lovable',
  'Antigravity',
  'v0',
  'AI prototyping',
  'Design Systems',
  'No-code tools',
];

export const RESULT_COUNTS = [5, 10, 20];

// ─── NEW: Region & Location ───────────────────────────────────────────────────
export const REGION_OPTIONS = [
  'Global',
  'Africa',
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Middle East',
];

export const WORK_ELIGIBILITY_OPTIONS = [
  'Global remote only',
  'Local roles',
  'Visa sponsorship',
  'Open to relocation',
];

// ─── NEW: Core Skills ─────────────────────────────────────────────────────────
export const CORE_SKILL_OPTIONS = [
  'Product Design',
  'UX Research',
  'Wireframing',
  'Design Systems',
  'Prototyping',
  'User Flows',
  'Visual Design',
  'Motion Design',
  'Design Ops',
];

// ─── NEW: Company Profile ─────────────────────────────────────────────────────
export const INDUSTRY_OPTIONS = [
  'AI',
  'Fintech',
  'SaaS',
  'Healthtech',
  'Web3',
  'E-commerce',
  'Agency',
  'EdTech',
  'ClimaTech',
];

export const COMPANY_STAGE_OPTIONS = [
  'Startup',
  'Seed',
  'Series A',
  'Growth',
  'Enterprise',
];

// ─── NEW: Must-Haves ──────────────────────────────────────────────────────────
export const MUST_HAVES_OPTIONS = [
  'Remote only',
  'Flexible hours',
  'No relocation',
  'Visa sponsorship required',
  'No coding interview',
  'Founder-led startup',
  'Async work culture',
];

// ─── NEW: Compensation ────────────────────────────────────────────────────────
export const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'NGN'];
export const PAY_FREQUENCY_OPTIONS = ['Monthly', 'Yearly', 'Contract'];

// ─── NEW: AI Search Modes ─────────────────────────────────────────────────────
export const SEARCH_MODES = [
  {
    id: 'precision',
    label: 'Precision Mode',
    icon: '🎯',
    desc: 'Find only highly relevant, exact-fit matches based on your criteria.',
  },
  {
    id: 'discovery',
    label: 'Discovery Mode',
    icon: '🔭',
    desc: 'Find hidden opportunities and unconventional fits you might have missed.',
  },
  {
    id: 'aggressive',
    label: 'Aggressive Mode',
    icon: '🚀',
    desc: 'Find stretch opportunities and high-ceiling roles you can still win.',
  },
];

// ─── DEFAULT FILTERS ──────────────────────────────────────────────────────────
export const DEFAULT_RESEARCH_FILTERS = {
  // Existing
  roleCategories: ['Product Designer'],
  roleTitle: '',
  experienceLevel: 'Mid',
  remotePreference: 'Global Remote Only',
  timezoneCompatibility: 'WAT Preferred',
  teamSize: 'Any',
  aiTools: ['Figma', 'Cursor'],
  resultsCount: 10,
  // New
  region: 'Global',
  countryCity: '',
  workEligibility: ['Global remote only'],
  minSalary: '',
  currency: 'USD',
  payFrequency: 'Monthly',
  coreSkills: [],
  industries: [],
  companyStages: [],
  mustHaves: [],
  searchMode: 'discovery',
};

/**
 * Future-ready research session shape (persist history later).
 * @typedef {Object} ResearchSessionMeta
 * @property {string} id
 * @property {string} createdAt
 * @property {typeof DEFAULT_RESEARCH_FILTERS} filters
 * @property {number} resultCount
 */

export function createResearchSessionMeta(filters, resultCount) {
  return {
    id: `rs-${Date.now()}`,
    createdAt: new Date().toISOString(),
    filters,
    resultCount,
  };
}
