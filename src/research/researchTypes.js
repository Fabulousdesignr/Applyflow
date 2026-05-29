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
];

export const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Mid-Senior'];

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

export const DEFAULT_RESEARCH_FILTERS = {
  roleCategories: ['Product Designer'],
  experienceLevel: 'Mid',
  remotePreference: 'Global Remote Only',
  timezoneCompatibility: 'WAT Preferred',
  teamSize: 'Any',
  aiTools: ['Figma', 'Cursor'],
  resultsCount: 10,
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
