// Database Controller & Scoring Logic for Applyflow
import { seedOpportunities } from './seedData';
import { getEnvConfig } from '../config/env.js';

// 100-Point Job Compatibility Scoring Heuristics
export function calculateCompatibilityScore(opp) {
  let score = 0;

  // 1. Global Remote Friendliness (Max 20 Pts)
  const remote = String(opp.global_remote_friendly || '').toLowerCase();
  if (remote.includes('yes') && !remote.includes('restricted') && !remote.includes('timezone')) {
    score += 20;
  } else if (remote.includes('yes') || remote.includes('contractor') || remote.includes('emea') || remote.includes('timezone') || remote.includes('abuja')) {
    score += 12;
  } else if (remote.includes('hybrid')) {
    score += 5;
  }

  // 2. AI-Native Workflow Mentioned (Max 15 Pts)
  const ai = String(opp.ai_workflow_mentioned || '').toLowerCase();
  if (ai.includes('cursor') || ai.includes('v0') || ai.includes('claude') || ai.includes('lovable') || ai.includes('figma ai') || ai.includes('magic patterns') || ai.includes('generative ui')) {
    score += 15;
  } else if (ai.length > 5) {
    score += 8;
  }

  // 3. Async Compatibility (Max 15 Pts)
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

  // 4. WAT Timezone Overlap (Max 15 Pts)
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

  // 5. Mid-Level Friendliness (Max 15 Pts)
  const mid = String(opp.mid_entry_friendly || '').toLowerCase();
  const role = String(opp.role_title || '').toLowerCase();
  if (mid.includes('yes') || role.includes('middle') || role.includes('generalist') || role.includes('mid-level') || role.includes('mid-to-senior') || role.includes('3+')) {
    score += 15;
  } else if (role.includes('senior') || role.includes('lead') || role.includes('staff')) {
    score += 9;
  } else {
    score += 5;
  }

  // 6. Founder Accessibility / Small Team (Max 10 Pts)
  const outreach = String(opp.outreach_method || '').toLowerCase();
  const name = String(opp.founder_hr_name || '').toLowerCase();
  if (outreach.includes('reddit') || outreach.includes('email pitch') || outreach.includes('dm') || (name.length > 2 && !name.includes('n/a'))) {
    score += 10;
  } else if (outreach.includes('linkedin')) {
    score += 6;
  } else {
    score += 3;
  }

  // 7. Startup Size (Max 10 Pts)
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
  } catch (e) {
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

// Check if Supabase sync is active and configured
function isSupabaseConfigured(settings) {
  return settings.supabaseUrl && settings.supabaseAnonKey;
}

// Low-dependency PostgREST headers creator
function getSupabaseHeaders(settings) {
  return {
    'Content-Type': 'application/json',
    'apikey': settings.supabaseAnonKey,
    'Authorization': `Bearer ${settings.supabaseAnonKey}`,
    'Prefer': 'return=representation'
  };
}

// Primary DB operations layer with offline LocalStorage fallback
export async function getOpportunities() {
  const settings = getSettings();
  
  if (isSupabaseConfigured(settings)) {
    try {
      const response = await fetch(`${settings.supabaseUrl}/rest/v1/opportunities?order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': settings.supabaseAnonKey,
          'Authorization': `Bearer ${settings.supabaseAnonKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Sync local storage so user has local backup
        localStorage.setItem('applyflow_opportunities', JSON.stringify(data));
        return data;
      }
      console.warn("Supabase fetch failed, falling back to LocalStorage:", response.statusText);
    } catch (e) {
      console.warn("Supabase fetch error, falling back to LocalStorage:", e);
    }
  }

  // LocalStorage Fallback
  let localData = localStorage.getItem('applyflow_opportunities');
  let parsedLocalData = [];
  try {
    if (localData) parsedLocalData = JSON.parse(localData);
  } catch (e) {
    parsedLocalData = [];
  }

  // Ensure all seed opportunities are in local storage
  let hasNewSeeds = false;
  const existingIds = new Set(parsedLocalData.map(opp => opp.id));
  
  for (const seedOpp of seedOpportunities) {
    if (!existingIds.has(seedOpp.id)) {
      parsedLocalData.push({
        ...seedOpp,
        compatibility_score: calculateCompatibilityScore(seedOpp),
        created_at: new Date().toISOString()
      });
      hasNewSeeds = true;
    }
  }

  if (hasNewSeeds || !localData) {
    localStorage.setItem('applyflow_opportunities', JSON.stringify(parsedLocalData));
  }

  return parsedLocalData;
}

export async function saveOpportunity(opp) {
  const settings = getSettings();
  const score = calculateCompatibilityScore(opp);
  const updatedOpp = {
    ...opp,
    compatibility_score: score,
    // Provide a random UUID locally if new
    id: opp.id || `opp-${Math.random().toString(36).substring(2, 11)}`,
    created_at: opp.created_at || new Date().toISOString()
  };

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured(settings)) {
    try {
      const isNew = !opp.id;
      const url = isNew 
        ? `${settings.supabaseUrl}/rest/v1/opportunities` 
        : `${settings.supabaseUrl}/rest/v1/opportunities?id=eq.${opp.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: getSupabaseHeaders(settings),
        body: JSON.stringify(updatedOpp)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result && result[0]) {
          // Update local copy and return
          updateLocalOpportunity(result[0]);
          return result[0];
        }
      }
      console.warn("Supabase save failed, falling back to local:", response.statusText);
    } catch (e) {
      console.warn("Supabase save error, falling back to local:", e);
    }
  }

  // 2. Save locally
  updateLocalOpportunity(updatedOpp);
  return updatedOpp;
}

function updateLocalOpportunity(opp) {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('applyflow_opportunities') || '[]');
  } catch (e) {
    list = [];
  }
  const index = list.findIndex(item => item.id === opp.id);
  if (index >= 0) {
    list[index] = opp;
  } else {
    list.unshift(opp);
  }
  localStorage.setItem('applyflow_opportunities', JSON.stringify(list));
}

export async function deleteOpportunity(id) {
  const settings = getSettings();
  
  if (isSupabaseConfigured(settings)) {
    try {
      const response = await fetch(`${settings.supabaseUrl}/rest/v1/opportunities?id=eq.${id}`, {
        method: 'DELETE',
        headers: getSupabaseHeaders(settings)
      });
      if (response.ok) {
        deleteLocalOpportunity(id);
        return true;
      }
      console.warn("Supabase delete failed, falling back to local:", response.statusText);
    } catch (e) {
      console.warn("Supabase delete error, falling back to local:", e);
    }
  }

  deleteLocalOpportunity(id);
  return true;
}

function deleteLocalOpportunity(id) {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('applyflow_opportunities') || '[]');
  } catch (e) {
    list = [];
  }
  const updated = list.filter(item => item.id !== id);
  localStorage.setItem('applyflow_opportunities', JSON.stringify(updated));
}

// Bulk delete and bulk update statuses helpers
export async function bulkUpdateStatus(ids, newStatus) {
  for (const id of ids) {
    let opp = await getOpportunityById(id);
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
  return list.find(item => item.id === id);
}

// Supabase Connection test helper
export async function testSupabaseConnection(url, anonKey) {
  try {
    const response = await fetch(`${url}/rest/v1/opportunities?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Supabase Migrator - uploads all local items to Supabase
export async function migrateLocalToSupabase(url, anonKey) {
  try {
    const list = JSON.parse(localStorage.getItem('applyflow_opportunities') || '[]');
    if (list.length === 0) return true;
    
    // We clean ids so they conform to DB generation or sync cleanly
    const payload = list.map(item => {
      const { id, ...rest } = item;
      // If id is a custom temporary code (like opp-001), let Supabase generate a proper UUID
      if (id.startsWith('opp-')) {
        return {
          ...rest,
          compatibility_score: calculateCompatibilityScore(item)
        };
      }
      return {
        id,
        ...rest,
        compatibility_score: calculateCompatibilityScore(item)
      };
    });

    const response = await fetch(`${url}/rest/v1/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (e) {
    console.error("Migration error:", e);
    return false;
  }
}
