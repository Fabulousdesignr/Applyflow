// Centralized environment configuration (Vite: only VITE_* vars are exposed to the client)

/**
 * Read API credentials from import.meta.env.
 * Never hardcode secrets in source — use .env.local (gitignored).
 */
export function getEnvConfig() {
  return {
    geminiApiKey: String(import.meta.env.VITE_GEMINI_API_KEY || '').trim(),
    openaiApiKey: String(import.meta.env.VITE_OPENAI_API_KEY || '').trim(),
    tavilyApiKey: String(import.meta.env.VITE_TAVILY_API_KEY || '').trim(),
    supabaseUrl: String(
      import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || ''
    ).trim(),
    supabaseAnonKey: String(
      import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || ''
    ).trim(),
    claudeApiKey: String(
      import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY || ''
    ).trim(),
  };
}

/** @param {'geminiApiKey'|'openaiApiKey'|'tavilyApiKey'|'supabaseUrl'|'supabaseAnonKey'|'claudeApiKey'} field */
export function isEnvKey(field) {
  const env = getEnvConfig();
  return Boolean(env[field]);
}

export function getEnvKeySource() {
  const env = getEnvConfig();
  return {
    geminiApiKey: env.geminiApiKey ? 'environment' : 'local',
    openaiApiKey: env.openaiApiKey ? 'environment' : 'local',
    tavilyApiKey: env.tavilyApiKey ? 'environment' : 'local',
    supabaseUrl: env.supabaseUrl ? 'environment' : 'local',
    supabaseAnonKey: env.supabaseAnonKey ? 'environment' : 'local',
    claudeApiKey: env.claudeApiKey ? 'environment' : 'local',
  };
}
