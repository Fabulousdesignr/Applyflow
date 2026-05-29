// Applyflow Research Engine — Gemini prompt, API, parsing, schema mapping

import { calculateCompatibilityScore } from '../database/db';
import { callGeminiGenerateContent, extractGeminiText } from '../config/geminiClient.js';

const RESEARCH_TIMEOUT_MS = 90000;

/**
 * @param {import('./researchTypes.js').DEFAULT_RESEARCH_FILTERS} filters
 */
export function buildResearchPrompt(filters) {
  const roleList = (filters.roleCategories || []).join(', ') || 'Product Designer';
  const toolsList = (filters.aiTools || []).join(', ') || 'Figma';

  return `You are a tactical remote job research agent for product designers, especially those in West Africa (WAT timezone).

Run targeted research and return ONLY valid JSON — no markdown, no explanation, no prose.

USER CRITERIA:
- Role categories: ${roleList}
- Experience level: ${filters.experienceLevel}
- Remote preference: ${filters.remotePreference}
- Timezone compatibility: ${filters.timezoneCompatibility}
- Team size preference: ${filters.teamSize}
- AI / tool stack interest: ${toolsList}
- Number of opportunities to return: exactly ${filters.resultsCount}

REQUIREMENTS:
- Return real or highly plausible active remote roles at startups/SaaS/agencies that hire internationally.
- Prioritize global remote, async-friendly, and WAT-compatible employers when requested.
- Each object MUST use exactly these keys (all strings):
  company_name, role_title, country, company_type, remote_status, salary_estimate, hiring_freshness, tools, why_match, career_page, application_link

- company_type must be one of: AI Startup, SaaS, Fintech, Agency, No-Code Studio
- tools: comma-separated design/AI tools mentioned for the role
- why_match: one concise sentence (max 25 words) explaining fit for this candidate profile
- career_page and application_link: full URLs or empty string if unknown

Return a JSON object with a single key "opportunities" whose value is an array of ${filters.resultsCount} objects. No other keys at root level.`;
}

function stripJsonFences(text) {
  return String(text)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * @param {unknown} raw
 * @returns {Array<Record<string, string>>}
 */
export function parseResearchResponse(raw) {
  let parsed = raw;
  if (typeof raw === 'string') {
    const cleaned = stripJsonFences(raw);
    parsed = JSON.parse(cleaned);
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.opportunities)) {
    return parsed.opportunities;
  }
  if (parsed && Array.isArray(parsed.results)) {
    return parsed.results;
  }

  throw new Error('Invalid research response: expected JSON array of opportunities.');
}

function inferCompanyType(roleCategories, companyTypeFromAi) {
  const allowed = ['AI Startup', 'SaaS', 'Fintech', 'Agency', 'No-Code Studio'];
  if (allowed.includes(companyTypeFromAi)) return companyTypeFromAi;

  const cats = (roleCategories || []).join(' ').toLowerCase();
  if (cats.includes('ai-native') || cats.includes('ai')) return 'AI Startup';
  if (cats.includes('no-code')) return 'No-Code Studio';
  if (cats.includes('design systems')) return 'SaaS';
  return 'SaaS';
}

function mapRemotePreference(remotePreference) {
  const map = {
    'Global Remote Only': 'Fully Remote Worldwide',
    'Remote First': 'Remote First',
    'Async Friendly': 'Fully Remote (Async)',
    'No Strong Preference': 'Remote/Hybrid',
  };
  return map[remotePreference] || 'Fully Remote';
}

function mapExperienceToMidFlag(level) {
  if (level === 'Entry') return 'Yes (Entry-friendly)';
  if (level === 'Mid-Senior') return 'Yes (Mid-to-Senior)';
  return 'Yes';
}

/**
 * Map Gemini research row → full Applyflow opportunity schema.
 * @param {Record<string, string>} result
 * @param {object} filters
 */
export function mapResearchResultToOpportunity(result, filters) {
  const tools = String(result.tools || '').trim();
  const aiToolsSelected = (filters.aiTools || []).join(', ');

  const opp = {
    company_name: String(result.company_name || 'Unknown Company').trim(),
    role_title: String(result.role_title || 'Product Designer').trim(),
    country: String(result.country || 'Global Remote').trim(),
    company_type: inferCompanyType(filters.roleCategories, result.company_type),
    company_size: filters.teamSize === 'Any' ? '' : filters.teamSize.replace(/\s*\(.*\)/, ''),
    remote_status: String(result.remote_status || mapRemotePreference(filters.remotePreference)).trim(),
    global_remote_friendly: filters.remotePreference === 'Global Remote Only' ? 'Yes' : 'Yes',
    mid_entry_friendly: mapExperienceToMidFlag(filters.experienceLevel),
    ai_workflow_mentioned: tools || aiToolsSelected,
    key_tools_mentioned: tools || 'Figma',
    salary_estimate: String(result.salary_estimate || '').trim(),
    date_posted: new Date().toISOString().substring(0, 7),
    hiring_freshness: String(result.hiring_freshness || 'Active').trim(),
    wat_compatibility:
      filters.timezoneCompatibility === 'WAT Preferred'
        ? 'High'
        : filters.timezoneCompatibility === 'Europe Overlap'
          ? 'High'
          : filters.timezoneCompatibility === 'Americas Overlap'
            ? 'Medium'
            : 'Medium',
    career_page: String(result.career_page || '').trim(),
    application_link: String(result.application_link || '').trim(),
    linkedin_page: '',
    founder_hr_name: '',
    outreach_method: 'Direct Apply',
    why_i_have_a_chance: String(result.why_match || result.why_i_have_a_chance || '').trim(),
    portfolio_advice: '',
    application_emphasis: `Target ${(filters.roleCategories || []).slice(0, 2).join(', ')} roles. Tools: ${aiToolsSelected}.`,
    status: 'Researching',
    priority: 'Medium',
    notes: `[AI Research] ${filters.remotePreference} · ${filters.experienceLevel} · ${filters.timezoneCompatibility}`,
    follow_up_date: '',
    applied_date: '',
    interview_stage: '',
  };

  opp.compatibility_score = calculateCompatibilityScore(opp);
  return opp;
}

/**
 * @param {string} apiKey
 * @param {object} filters
 * @returns {Promise<Array<Record<string, string>>>}
 */
export async function runGeminiResearch(apiKey, filters) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESEARCH_TIMEOUT_MS);

  try {
    const { data } = await callGeminiGenerateContent(
      apiKey,
      {
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
        contents: [
          {
            parts: [{ text: buildResearchPrompt(filters) }],
          },
        ],
      },
      { signal: controller.signal }
    );

    const text = extractGeminiText(data);

    if (!text) {
      throw new Error('Gemini returned an empty response. Try again or reduce results count.');
    }

    const items = parseResearchResponse(text);
    if (!items.length) {
      throw new Error('No opportunities found. Try broader filters or a higher results count.');
    }

    return items.slice(0, filters.resultsCount || 10);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Research timed out. Check your connection or try fewer results.');
    }
    if (err instanceof SyntaxError) {
      throw new Error('Invalid JSON from Gemini. Please run research again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Quick connectivity check for Settings panel.
 */
export async function testGeminiConnection(apiKey) {
  if (!apiKey?.trim()) return false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    await callGeminiGenerateContent(
      apiKey,
      { contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }] },
      { signal: controller.signal }
    );
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isGeminiConfigured(settings) {
  return Boolean(settings?.geminiApiKey?.trim());
}
