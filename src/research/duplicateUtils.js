// Shared duplicate detection for imports (upload + research engine)

export function normalizeKey(value) {
  return String(value || '').toLowerCase().trim();
}

/**
 * Find existing opportunity by company_name + role_title (case-insensitive).
 */
export function findDuplicateOpportunity(opportunities, companyName, roleTitle) {
  const company = normalizeKey(companyName);
  const role = normalizeKey(roleTitle);
  if (!company || !role) return null;

  return (
    opportunities.find(
      (o) =>
        normalizeKey(o.company_name) === company &&
        normalizeKey(o.role_title) === role
    ) || null
  );
}

/**
 * Merge incoming fields into existing record (research/upload import).
 */
export function mergeOpportunityFields(existing, incoming) {
  return {
    ...existing,
    country: incoming.country || existing.country,
    company_type: incoming.company_type || existing.company_type,
    remote_status: incoming.remote_status || existing.remote_status,
    salary_estimate: incoming.salary_estimate || existing.salary_estimate,
    hiring_freshness: incoming.hiring_freshness || existing.hiring_freshness,
    key_tools_mentioned: incoming.key_tools_mentioned || existing.key_tools_mentioned,
    ai_workflow_mentioned: incoming.ai_workflow_mentioned || existing.ai_workflow_mentioned,
    why_i_have_a_chance: incoming.why_i_have_a_chance || existing.why_i_have_a_chance,
    career_page: incoming.career_page || existing.career_page,
    application_link: incoming.application_link || existing.application_link,
    notes: [existing.notes, incoming.notes].filter(Boolean).join('\n'),
    compatibility_score: incoming.compatibility_score ?? existing.compatibility_score,
  };
}
