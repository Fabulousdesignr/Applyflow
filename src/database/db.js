// Database Controller & Scoring Logic for Applyflow
import { getEnvConfig } from '../config/env.js';
import { supabase, isSupabaseAuthConfigured } from '../lib/supabase.js';

/** @type {string | null} Active auth user for scoped cache and RLS-backed API calls */
let activeUserId = null;

const LEGACY_OPPORTUNITIES_KEY = 'applyflow_opportunities';

export function opportunitiesCacheKey(userId) {
  return `applyflow_opportunities_${userId}`;
}

/** Bind persistence layer to the logged-in user (call on login / user change). */
export function setDataUserId(userId) {
  activeUserId = userId || null;
}

export function getDataUserId() {
  return activeUserId;
}

/** Remove opportunity caches so the next account cannot see stale rows. */
export function clearUserDataCache(userId = activeUserId) {
  try {
    localStorage.removeItem(LEGACY_OPPORTUNITIES_KEY);
    if (userId) {
      localStorage.removeItem(opportunitiesCacheKey(userId));
    }
  } catch (e) {
    console.warn('clearUserDataCache failed:', e);
  }
}

function readUserCache(userId) {
  try {
    const raw = localStorage.getItem(opportunitiesCacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUserCache(userId, list) {
  localStorage.setItem(opportunitiesCacheKey(userId), JSON.stringify(list));
}

function updateUserCacheOpportunity(userId, opp) {
  const list = readUserCache(userId);
  const index = list.findIndex((item) => item.id === opp.id);
  if (index >= 0) {
    list[index] = opp;
  } else {
    list.unshift(opp);
  }
  writeUserCache(userId, list);
}

function deleteUserCacheOpportunity(userId, id) {
  writeUserCache(
    userId,
    readUserCache(userId).filter((item) => item.id !== id)
  );
}

function isSupabaseConfigured(settings) {
  return Boolean(settings.supabaseUrl && settings.supabaseAnonKey);
}

function canUseAuthenticatedSupabase(settings) {
  return (
    isSupabaseAuthConfigured() &&
    supabase &&
    activeUserId &&
    isSupabaseConfigured(settings)
  );
}

async function getAccessToken() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function getRestHeaders(settings, accessToken) {
  return {
    'Content-Type': 'application/json',
    apikey: settings.supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    Prefer: 'return=representation',
  };
}

function isTemporaryId(id) {
  return !id || String(id).startsWith('opp-');
}

/** Strip server-owned fields; omit temp ids so Postgres generates UUIDs. */
function toSupabaseInsertPayload(opp) {
  const { id, user_id, created_at, ...rest } = opp;
  return {
    ...rest,
    compatibility_score: opp.compatibility_score ?? calculateCompatibilityScore(opp),
  };
}

function toSupabaseUpdatePayload(opp) {
  const { id, user_id, created_at, ...rest } = opp;
  return {
    ...rest,
    compatibility_score: opp.compatibility_score ?? calculateCompatibilityScore(opp),
  };
}

// 100-Point Job Compatibility Scoring Heuristics
export function calculateCompatibilityScore(opp) {
  let score = 0;

  const remote = String(opp.global_remote_friendly || '').toLowerCase();
  if (remote.includes('yes') && !remote.includes('restricted') && !remote.includes('timezone')) {
    score += 20;
  } else if (remote.includes('yes') || remote.includes('contractor') || remote.includes('emea') || remote.includes('timezone') || remote.includes('abuja')) {
    score += 12;
  } else if (remote.includes('hybrid')) {
    score += 5;
  }

  const ai = String(opp.ai_workflow_mentioned || '').toLowerCase();
  if (ai.includes('cursor') || ai.includes('v0') || ai.includes('claude') || ai.includes('lovable') || ai.includes('figma ai') || ai.includes('magic patterns') || ai.includes('generative ui')) {
    score += 15;
  } else if (ai.length > 5) {
    score += 8;
  }

  const notes = String(opp.notes || '').toLowerCase();
  const whyChance = String(opp.why_i_have_a_chance || '').toLowerCase();
  const timezoneNotes = String(opp.wat_compatibility || '').toLowerCase();
  if (notes.includes('async-first') || whyChance.includes('async-first') || notes.includes('async') || whyChance.includes('async')) {
    score += 15;
  } else if (notes.includes('flexible') || whyChance.includes('flexible') || timezoneNotes.includes('self-directed') || timezoneNotes.includes('async')) {
    score += 10;
  } else {
    score += 5;
  }

  const wat = String(opp.wat_compatibility || '').toLowerCase();
  if (wat === 'perfect' || wat.includes('perfect') || wat.includes('100% wat') || wat.includes('lagos')) {
    score += 15;
  } else if (wat === 'high' || wat.includes('high') || wat.includes('cet') || wat.includes('emea')) {
    score += 12;
  } else if (wat === 'medium' || wat.includes('medium') || wat.includes('americas')) {
    score += 8;
  } else {
    score += 3;
  }

  const mid = String(opp.mid_entry_friendly || '').toLowerCase();
  const role = String(opp.role_title || '').toLowerCase();
  if (mid.includes('yes') || role.includes('middle') || role.includes('generalist') || role.includes('mid-level') || role.includes('mid-to-senior') || role.includes('3+')) {
    score += 15;
  } else if (role.includes('senior') || role.includes('lead') || role.includes('staff')) {
    score += 9;
  } else {
    score += 5;
  }

  const outreach = String(opp.outreach_method || '').toLowerCase();
  const name = String(opp.founder_hr_name || '').toLowerCase();
  if (outreach.includes('reddit') || outreach.includes('email pitch') || outreach.includes('dm') || (name.length > 2 && !name.includes('n/a'))) {
    score += 10;
  } else if (outreach.includes('linkedin')) {
    score += 6;
  } else {
    score += 3;
  }

  const size = String(opp.company_size || '');
  if (size.includes('11-50')) {
    score += 10;
  } else if (size.includes('51-200')) {
    score += 8;
  } else if (size.includes('1-10')) {
    score += 7;
  } else if (size.includes('201-500')) {
    score += 5;
  } else if (size.includes('500+')) {
    score += 2;
  } else {
    score += 5;
  }

  return Math.min(100, score);
}

// Settings management (Supabase & AI Keys) — env vars override localStorage
export function getSettings() {
  const env = getEnvConfig();
  const defaults = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    openaiApiKey: '',
    claudeApiKey: '',
    geminiApiKey: '',
    savedFilters: [],
  };

  let stored = { ...defaults };
  try {
    const data = localStorage.getItem('applyflow_settings');
    if (data) stored = { ...defaults, ...JSON.parse(data) };
  } catch {
    stored = { ...defaults };
  }

  return {
    ...stored,
    geminiApiKey: env.geminiApiKey || stored.geminiApiKey || '',
    openaiApiKey: env.openaiApiKey || stored.openaiApiKey || '',
    supabaseUrl: env.supabaseUrl || stored.supabaseUrl || '',
    supabaseAnonKey: env.supabaseAnonKey || stored.supabaseAnonKey || '',
    claudeApiKey: env.claudeApiKey || stored.claudeApiKey || '',
  };
}

export function saveSettings(settings) {
  const env = getEnvConfig();
  const persisted = {
    ...settings,
    geminiApiKey: env.geminiApiKey ? '' : settings.geminiApiKey || '',
    openaiApiKey: env.openaiApiKey ? '' : settings.openaiApiKey || '',
    supabaseUrl: env.supabaseUrl ? '' : settings.supabaseUrl || '',
    supabaseAnonKey: env.supabaseAnonKey ? '' : settings.supabaseAnonKey || '',
    claudeApiKey: env.claudeApiKey ? '' : settings.claudeApiKey || '',
  };
  localStorage.setItem('applyflow_settings', JSON.stringify(persisted));
}

/** Authenticated load — RLS returns only the current user's rows. No seed merge. */
export async function getOpportunities() {
  const settings = getSettings();
  const userId = activeUserId;

  if (!userId) {
    return [];
  }

  // Drop legacy shared cache so counts do not bleed across accounts
  try {
    localStorage.removeItem(LEGACY_OPPORTUNITIES_KEY);
  } catch {
    /* ignore */
  }

  if (canUseAuthenticatedSupabase(settings)) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        writeUserCache(userId, data);
        return data;
      }
      console.warn('Supabase fetch failed:', error?.message ?? error);
    } catch (e) {
      console.warn('Supabase fetch error:', e);
    }

    return readUserCache(userId);
  }

  return readUserCache(userId);
}

export async function saveOpportunity(opp) {
  const settings = getSettings();
  const userId = activeUserId;
  const score = calculateCompatibilityScore(opp);
  const updatedOpp = {
    ...opp,
    compatibility_score: score,
    id: opp.id || `opp-${Math.random().toString(36).substring(2, 11)}`,
    created_at: opp.created_at || new Date().toISOString(),
  };

  if (!userId) {
    return updatedOpp;
  }

  if (canUseAuthenticatedSupabase(settings)) {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        const isNew = isTemporaryId(opp.id);
        const url = isNew
          ? `${settings.supabaseUrl}/rest/v1/opportunities`
          : `${settings.supabaseUrl}/rest/v1/opportunities?id=eq.${encodeURIComponent(opp.id)}`;

        const body = isNew
          ? toSupabaseInsertPayload(updatedOpp)
          : toSupabaseUpdatePayload(updatedOpp);

        const response = await fetch(url, {
          method: isNew ? 'POST' : 'PATCH',
          headers: getRestHeaders(settings, accessToken),
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const result = await response.json();
          const saved = Array.isArray(result) ? result[0] : result;
          if (saved) {
            updateUserCacheOpportunity(userId, saved);
            return saved;
          }
        }
        console.warn('Supabase save failed:', response.status, response.statusText);
      }
    } catch (e) {
      console.warn('Supabase save error:', e);
    }
  }

  updateUserCacheOpportunity(userId, updatedOpp);
  return updatedOpp;
}

export async function deleteOpportunity(id) {
  const settings = getSettings();
  const userId = activeUserId;

  if (!userId) {
    return true;
  }

  if (canUseAuthenticatedSupabase(settings)) {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        const response = await fetch(
          `${settings.supabaseUrl}/rest/v1/opportunities?id=eq.${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
            headers: getRestHeaders(settings, accessToken),
          }
        );
        if (response.ok) {
          deleteUserCacheOpportunity(userId, id);
          return true;
        }
        console.warn('Supabase delete failed:', response.statusText);
      }
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
  }

  deleteUserCacheOpportunity(userId, id);
  return true;
}

export async function bulkUpdateStatus(ids, newStatus) {
  for (const id of ids) {
    const opp = await getOpportunityById(id);
    if (opp) {
      opp.status = newStatus;
      if (newStatus === 'Applied' && !opp.applied_date) {
        opp.applied_date = new Date().toISOString().substring(0, 10);
      }
      await saveOpportunity(opp);
    }
  }
}

export async function bulkDelete(ids) {
  for (const id of ids) {
    await deleteOpportunity(id);
  }
}

async function getOpportunityById(id) {
  const list = await getOpportunities();
  return list.find((item) => item.id === id);
}

export async function testSupabaseConnection(url, anonKey) {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      const response = await fetch(`${url}/rest/v1/opportunities?select=id&limit=1`, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    }

    const response = await fetch(`${url}/rest/v1/opportunities?limit=1`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Migrate legacy or user-local rows into Supabase under the signed-in user (RLS). */
export async function migrateLocalToSupabase(url, anonKey) {
  const userId = activeUserId;
  if (!userId) {
    console.warn('migrateLocalToSupabase: no authenticated user');
    return false;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return false;

    let list = readUserCache(userId);
    try {
      const legacy = localStorage.getItem(LEGACY_OPPORTUNITIES_KEY);
      if (legacy) {
        const legacyRows = JSON.parse(legacy);
        if (Array.isArray(legacyRows) && legacyRows.length > 0) {
          const ids = new Set(list.map((r) => r.id));
          for (const row of legacyRows) {
            if (!ids.has(row.id)) list.push(row);
          }
        }
      }
    } catch {
      /* ignore */
    }

    if (list.length === 0) return true;

    const payload = list.map((item) => {
      if (isTemporaryId(item.id)) {
        return toSupabaseInsertPayload(item);
      }
      return {
        id: item.id,
        ...toSupabaseUpdatePayload(item),
      };
    });

    const response = await fetch(`${url}/rest/v1/opportunities`, {
      method: 'POST',
      headers: {
        ...getRestHeaders({ supabaseUrl: url, supabaseAnonKey: anonKey }, accessToken),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      localStorage.removeItem(LEGACY_OPPORTUNITIES_KEY);
      await getOpportunities();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Migration error:', e);
    return false;
  }
}
