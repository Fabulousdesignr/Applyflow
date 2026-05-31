/** Archived opportunities use status = Rejected (no extra table). */
export const ARCHIVED_STATUS = 'Rejected';

export function isArchivedOpportunity(opp) {
  return opp?.status === ARCHIVED_STATUS;
}

export function filterActiveOpportunities(opportunities) {
  if (!Array.isArray(opportunities)) return [];
  return opportunities.filter((o) => !isArchivedOpportunity(o));
}

export function countArchivedOpportunities(opportunities) {
  if (!Array.isArray(opportunities)) return 0;
  return opportunities.filter(isArchivedOpportunity).length;
}
