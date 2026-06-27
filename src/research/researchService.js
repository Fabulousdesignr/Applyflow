// Applyflow Research Engine — Gemini prompt, API, parsing, schema mapping

import { calculateCompatibilityScore } from '../database/db';
import { callGeminiGenerateContent, extractGeminiText } from '../config/geminiClient.js';
import { callTavilySearch } from '../config/tavilyClient.js';

const RESEARCH_TIMEOUT_MS = 90000;

/**
 * @param {import('./researchTypes.js').DEFAULT_RESEARCH_FILTERS} filters
 */
/**
 * Formulate 3 optimized search queries to query Tavily in parallel.
 */
export function buildOptimizedTavilyQueries(filters) {
  const queries = [];
  const baseTitle = filters.roleTitle?.trim() ? `"${filters.roleTitle.trim()}"` : '"Product Designer"';
  
  // Geographic and Remote constraints
  const locationConstraint = filters.countryCity?.trim() 
    ? `"${filters.countryCity.trim()}"` 
    : (filters.region && filters.region !== 'Global' ? `"${filters.region}"` : '');
  
  const remoteConstraint = filters.remotePreference === 'Global Remote Only'
    ? '"remote" ("worldwide" OR "anywhere" OR "global")'
    : '"remote"';

  // Query 1: structured job-boards search (Greenhouse / Ashby / Lever)
  const boardQuery = `(site:greenhouse.io OR site:ashbyhq.com OR site:lever.co) ${baseTitle} ${remoteConstraint} ${locationConstraint} "hiring"`.trim();
  queries.push(boardQuery);

  // Query 2: semantic startup / SaaS search
  const startupQuery = `${baseTitle} ${remoteConstraint} ${locationConstraint} ("startup" OR "SaaS" OR "AI Startup" OR "Fintech") "hiring"`.trim();
  queries.push(startupQuery);

  // Query 3: general/skills based filter search
  const skillsList = (filters.coreSkills || []).slice(0, 2).map(s => `"${s}"`).join(' OR ');
  const skillsPart = skillsList ? `(${skillsList})` : '';
  const generalQuery = `${baseTitle} ${remoteConstraint} ${locationConstraint} ${skillsPart} "careers" OR "apply"`.trim();
  queries.push(generalQuery);

  return queries;
}

/**
 * Prompt instructions for Gemini to act as a ranking, filtering, and scoring engine.
 */
export function buildHybridRankingPrompt(filters, tavilyResults) {
  const roleList = (filters.roleCategories || []).join(', ') || 'Product Designer';
  const toolsList = (filters.aiTools || []).join(', ') || 'Figma';
  const coreSkills = (filters.coreSkills || []).join(', ');
  const industries = (filters.industries || []).join(', ');
  const companyStages = (filters.companyStages || []).join(', ');
  const mustHaves = (filters.mustHaves || []).join(', ');
  const workEligibility = (filters.workEligibility || []).join(', ');

  const searchModeInstructions = {
    precision: 'Select ONLY the results that are highly relevant, exact-fit matches.',
    discovery: 'Select a mix of obvious fits and potential high-upside hidden gems from the search results.',
    aggressive: 'Include stretch opportunities slightly above experience level or at fast-growing teams.',
  };
  const modeInstruction = searchModeInstructions[filters.searchMode] || searchModeInstructions.discovery;

  // Format search results
  const formattedResults = tavilyResults.map((res, index) => {
    return `RESULT #${index + 1}:
Title: ${res.title}
URL: ${res.url}
Snippet/Content: ${res.content}`;
  }).join('\n\n');

  return `You are an AI-powered job discovery assistant. You will analyze real web search results and match them against the candidate's profile.

CANDIDATE FILTERS:
- Role target: ${filters.roleTitle ? `"${filters.roleTitle}" (also open to: ${roleList})` : roleList}
- Experience level: ${filters.experienceLevel}
- Core skills: ${coreSkills || roleList}
- AI / tool stack: ${toolsList}
- Geographic preference: ${filters.countryCity || filters.region || 'Global'}
- Work eligibility: ${workEligibility || 'Global remote only'}
- Remote preference: ${filters.remotePreference}
- Timezone compatibility: ${filters.timezoneCompatibility}
- Team size preference: ${filters.teamSize}
${filters.minSalary ? `- Minimum compensation: ${filters.minSalary} ${filters.currency} ${filters.payFrequency}` : ''}
${industries ? `- Preferred industries: ${industries}` : ''}
${companyStages ? `- Preferred company stages: ${companyStages}` : ''}
${mustHaves ? `- Non-negotiables (Must-Haves): ${mustHaves}` : ''}

SEARCH MODE: ${(filters.searchMode || 'discovery').toUpperCase()}
${modeInstruction}

INPUT WEB SEARCH RESULTS (These are the ONLY real web opportunities you can return):
${formattedResults}

INSTRUCTIONS:
1. Filter the web search results based on the candidate's profile. Remove any that are clearly not remote or mismatch the role target.
2. Rank the best fits up to a maximum of ${filters.resultsCount || 10} opportunities.
3. For each matched opportunity, generate a structured object.
4. **CRITICAL REQUIREMENT:** The "application_link" property in the output MUST be the exact, original, valid URL from the search result. Do not alter, shorten, or hallucinate URLs.
5. Do NOT invent or hallucinate any factual details. If a company name is not mentioned, use the one from the search title/url.
6. Evaluate and classify each opportunity quality as one of:
   - "Strong Match": highly aligned with all core criteria and preferences
   - "Stretch Role": slightly above experience/level or requires extra stack adaptation
   - "Hidden Gem": unconventional company fit or high-quality listing that is less visible
7. Calculate a custom match_score from 0 to 100 representing compatibility.

Each object MUST use exactly these keys (all strings):
company_name, role_title, country, company_type, remote_status, salary_estimate, hiring_freshness, tools, why_match, career_page, application_link, classification, match_score

- company_name: extract the company name from the title or description (e.g. "Senior UX Designer at Acme" -> Acme)
- role_title: extract the clean job title (e.g. "UX Designer")
- country: country of hiring (or Global Remote)
- company_type: must be one of: AI Startup, SaaS, Fintech, Agency, No-Code Studio (infer from content)
- remote_status: describe remote status (e.g. Fully Remote, Remote First, etc.)
- tools: comma-separated design/AI tools mentioned in the job description/snippet
- why_match: one concise sentence (max 30 words) explaining why this real job is a good fit for this candidate
- career_page and application_link: must be the exact URLs from the search results
- classification: must be exactly one of: "Strong Match", "Stretch Role", "Hidden Gem"
- match_score: integer from 0 to 100 representing the compatibility score

Return ONLY valid JSON. Return a JSON object with a single key "opportunities" whose value is an array of matched objects. No other keys or markdown fences at root level.`;
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
    classification: String(result.classification || 'Strong Match').trim(),
  };

  const scoreFromGemini = Number(result.match_score);
  opp.compatibility_score = !isNaN(scoreFromGemini) && scoreFromGemini >= 0 && scoreFromGemini <= 100
    ? scoreFromGemini
    : calculateCompatibilityScore(opp);

  return opp;
}

/**
 * @param {string} apiKey
 * @param {object} filters
 * @returns {Promise<Array<Record<string, string>>>}
 */
/**
 * Execute web search via Tavily, then rank/cross-reference via Gemini.
 * @param {string} geminiApiKey
 * @param {string} tavilyApiKey
 * @param {object} filters
 * @returns {Promise<Array<Record<string, string>>>}
 */
export async function runGeminiResearch(geminiApiKey, tavilyApiKey, filters) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESEARCH_TIMEOUT_MS);

  try {
    // 1. Perform 3 live web search queries in parallel using Tavily
    const queries = buildOptimizedTavilyQueries(filters);
    const searchDepth = 'basic'; // keep basic to optimize free credits
    
    const searchPromises = queries.map((q) =>
      callTavilySearch(tavilyApiKey, {
        query: q,
        search_depth: searchDepth,
        max_results: 8,
      }).catch((err) => {
        console.warn(`[Applyflow] Search query "${q}" failed:`, err);
        return { results: [] };
      })
    );

    const responses = await Promise.all(searchPromises);

    // Combine and deduplicate by URL
    const seenUrls = new Set();
    const uniqueResults = [];

    for (const resp of responses) {
      if (resp?.results) {
        for (const res of resp.results) {
          if (res.url && !seenUrls.has(res.url)) {
            seenUrls.add(res.url);
            uniqueResults.push(res);
          }
        }
      }
    }

    if (!uniqueResults.length) {
      throw new Error('Tavily returned no search results for this query. Try broadening your keywords/categories.');
    }

    // 2. Feed retrieved search results into Gemini for scoring and ranking
    const prompt = buildHybridRankingPrompt(filters, uniqueResults);
    const { data } = await callGeminiGenerateContent(
      geminiApiKey,
      {
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
        contents: [
          {
            parts: [{ text: prompt }],
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
      throw new Error('No compatible opportunities found from the web search. Try broader filters.');
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

export function isTavilyConfigured(settings) {
  return Boolean(settings?.tavilyApiKey?.trim());
}

