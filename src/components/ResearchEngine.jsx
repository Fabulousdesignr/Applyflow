import React, { useState, useCallback } from 'react';
import {
  Radar,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { getSettings } from '../database/db';
import {
  DEFAULT_RESEARCH_FILTERS,
  ROLE_CATEGORIES,
  EXPERIENCE_LEVELS,
  REMOTE_PREFERENCES,
  TIMEZONE_OPTIONS,
  TEAM_SIZES,
  AI_TOOL_OPTIONS,
  RESULT_COUNTS,
  createResearchSessionMeta,
} from '../research/researchTypes';
import {
  runGeminiResearch,
  mapResearchResultToOpportunity,
  isGeminiConfigured,
} from '../research/researchService';
import {
  findDuplicateOpportunity,
  mergeOpportunityFields,
} from '../research/duplicateUtils';
import DuplicateOpportunityModal from './DuplicateOpportunityModal';
import ConnectGeminiModal from './ConnectGeminiModal';

function MultiSelectChips({ options, selected, onChange, id }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="research-chip-grid" role="group" aria-labelledby={id}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`research-chip ${selected.includes(opt) ? 'active' : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ResearchEngine({
  opportunities,
  onImportOpportunity,
  onOpenSettings,
}) {
  const [filters, setFilters] = useState({ ...DEFAULT_RESEARCH_FILTERS });
  const [phase, setPhase] = useState('idle'); // idle | running | results | error
  const [errorMessage, setErrorMessage] = useState('');
  const [results, setResults] = useState([]);
  const [dismissedKeys, setDismissedKeys] = useState(new Set());
  const [importedKeys, setImportedKeys] = useState(new Set());
  const [statusLine, setStatusLine] = useState('');

  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState(null);
  // { pendingOpp, existingOpp, resultKey }

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resultKey = (r, index) =>
    `${r.company_name}|${r.role_title}|${index}`.toLowerCase();

  const visibleResults = results.filter(
    (r, i) => !dismissedKeys.has(resultKey(r, i)) && !importedKeys.has(resultKey(r, i))
  );

  const handleRunResearch = async () => {
    const settings = getSettings();
    if (!isGeminiConfigured(settings)) {
      setShowGeminiModal(true);
      return;
    }

    if (!filters.roleCategories?.length) {
      setPhase('error');
      setErrorMessage('Select at least one role category.');
      return;
    }

    setPhase('running');
    setErrorMessage('');
    setResults([]);
    setDismissedKeys(new Set());
    setImportedKeys(new Set());
    setStatusLine('Building research prompt…');

    try {
      setStatusLine('Contacting Gemini — scanning global remote roles…');
      const rawItems = await runGeminiResearch(settings.geminiApiKey, filters);

      // Future-ready: session meta for history feature
      createResearchSessionMeta(filters, rawItems.length);

      setResults(rawItems);
      setPhase('results');
      setStatusLine(`Found ${rawItems.length} opportunities. Review and import.`);
    } catch (err) {
      setPhase('error');
      setErrorMessage(err.message || 'Research failed. Please try again.');
      setStatusLine('');
    }
  };

  const commitImport = useCallback(
    async (oppPayload) => {
      await onImportOpportunity(oppPayload);
    },
    [onImportOpportunity]
  );

  const handleImportResult = (result, index) => {
    const mapped = mapResearchResultToOpportunity(result, filters);
    const existing = findDuplicateOpportunity(
      opportunities,
      mapped.company_name,
      mapped.role_title
    );

    const key = resultKey(result, index);

    if (existing) {
      setDuplicateModal({
        pendingOpp: mapped,
        existingOpp: existing,
        resultKey: key,
      });
      return;
    }

    commitImport({
      ...mapped,
      id: `opp-${Math.random().toString(36).substring(2, 11)}`,
      created_at: new Date().toISOString(),
    }).then(() => {
      setImportedKeys((prev) => new Set(prev).add(key));
    });
  };

  const handleDuplicateSkip = () => {
    if (duplicateModal?.resultKey) {
      setDismissedKeys((prev) => new Set(prev).add(duplicateModal.resultKey));
    }
    setDuplicateModal(null);
  };

  const handleDuplicateUpdate = () => {
    if (!duplicateModal) return;
    const { pendingOpp, existingOpp, resultKey: key } = duplicateModal;
    commitImport({
      ...pendingOpp,
      id: existingOpp.id,
      created_at: existingOpp.created_at,
    }).then(() => {
      setImportedKeys((prev) => new Set(prev).add(key));
      setDuplicateModal(null);
    });
  };

  const handleDuplicateMerge = () => {
    if (!duplicateModal) return;
    const { pendingOpp, existingOpp, resultKey: key } = duplicateModal;
    const merged = mergeOpportunityFields(existingOpp, pendingOpp);
    commitImport({
      ...merged,
      id: existingOpp.id,
      created_at: existingOpp.created_at,
      status: existingOpp.status || 'Researching',
    }).then(() => {
      setImportedKeys((prev) => new Set(prev).add(key));
      setDuplicateModal(null);
    });
  };

  const handleDismiss = (result, index) => {
    setDismissedKeys((prev) => new Set(prev).add(resultKey(result, index)));
  };

  return (
    <div className="research-view">
      <p className="research-page-desc">
        Find tailored remote opportunities using AI-powered global research.
      </p>
      <div className="research-layout">
        {/* Input panel */}
        <section className="research-panel research-input-panel">
          <div className="research-panel-head">
            <Radar size={14} style={{ color: 'var(--accent-blue)' }} />
            <span>Research Parameters</span>
          </div>

          <div className="research-form">
            <div className="form-group">
              <label className="form-label" id="role-categories-label">
                Role Category
              </label>
              <MultiSelectChips
                id="role-categories-label"
                options={ROLE_CATEGORIES}
                selected={filters.roleCategories}
                onChange={(v) => updateFilter('roleCategories', v)}
              />
            </div>

            <div className="research-form-row">
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select
                  className="form-input research-select"
                  value={filters.experienceLevel}
                  onChange={(e) => updateFilter('experienceLevel', e.target.value)}
                >
                  {EXPERIENCE_LEVELS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Remote Preference</label>
                <select
                  className="form-input research-select"
                  value={filters.remotePreference}
                  onChange={(e) => updateFilter('remotePreference', e.target.value)}
                >
                  {REMOTE_PREFERENCES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="research-form-row">
              <div className="form-group">
                <label className="form-label">Timezone Compatibility</label>
                <select
                  className="form-input research-select"
                  value={filters.timezoneCompatibility}
                  onChange={(e) => updateFilter('timezoneCompatibility', e.target.value)}
                >
                  {TIMEZONE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team Size</label>
                <select
                  className="form-input research-select"
                  value={filters.teamSize}
                  onChange={(e) => updateFilter('teamSize', e.target.value)}
                >
                  {TEAM_SIZES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" id="ai-tools-label">
                AI / Tool Stack Interest
              </label>
              <MultiSelectChips
                id="ai-tools-label"
                options={AI_TOOL_OPTIONS}
                selected={filters.aiTools}
                onChange={(v) => updateFilter('aiTools', v)}
              />
            </div>

            <div className="form-group" style={{ maxWidth: '140px' }}>
              <label className="form-label">Results Count</label>
              <select
                className="form-input research-select"
                value={filters.resultsCount}
                onChange={(e) => updateFilter('resultsCount', Number(e.target.value))}
              >
                {RESULT_COUNTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary research-run-btn"
              onClick={handleRunResearch}
              disabled={phase === 'running'}
            >
              {phase === 'running' ? (
                <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Play size={14} />
              )}
              <span>Run Research</span>
            </button>
          </div>
        </section>

        {/* Results / status panel */}
        <section className="research-panel research-results-panel">
          <div className="research-panel-head">
            <Sparkles size={14} style={{ color: '#a78bfa' }} />
            <span>Research Results</span>
            {phase === 'results' && (
              <span className="research-results-badge">{visibleResults.length} active</span>
            )}
          </div>

          <div className="research-results-body">
            {phase === 'idle' && (
              <div className="research-empty">
                <Radar size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <p>Configure filters and run research to discover remote opportunities.</p>
              </div>
            )}

            {phase === 'running' && (
              <div className="research-status-box">
                <Loader2
                  size={18}
                  className="spinner"
                  style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }}
                />
                <div>
                  <span style={{ fontWeight: 600 }}>Research in progress</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {statusLine}
                  </p>
                </div>
              </div>
            )}

            {phase === 'error' && (
              <div className="research-alert research-alert-error">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {phase === 'results' && visibleResults.length === 0 && (
              <div className="research-empty">
                <CheckCircle2 size={28} style={{ color: '#10b981' }} />
                <p>All results reviewed. Run another search or adjust filters.</p>
              </div>
            )}

            {phase === 'results' && visibleResults.length > 0 && (
              <div className="research-cards">
                {results.map((result, index) => {
                  const key = resultKey(result, index);
                  if (dismissedKeys.has(key) || importedKeys.has(key)) return null;

                  return (
                    <article key={key} className="research-result-card">
                      <div className="research-card-top">
                        <div>
                          <h3 className="research-card-role">{result.role_title}</h3>
                          <p className="research-card-company">{result.company_name}</p>
                        </div>
                        <span className="research-card-type">{result.company_type}</span>
                      </div>
                      <div className="research-card-meta">
                        <span>{result.country}</span>
                        <span className="research-meta-dot">·</span>
                        <span>{result.remote_status}</span>
                        {result.salary_estimate && (
                          <>
                            <span className="research-meta-dot">·</span>
                            <span>{result.salary_estimate}</span>
                          </>
                        )}
                      </div>
                      <div className="research-card-freshness">
                        <span
                          className={`freshness-pill ${String(result.hiring_freshness).toLowerCase().includes('active') ? 'active' : ''}`}
                        >
                          {result.hiring_freshness || 'Unknown'}
                        </span>
                      </div>
                      <p className="research-card-why">{result.why_match}</p>
                      <div className="research-card-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ height: '28px', fontSize: '11px' }}
                          onClick={() => handleImportResult(result, index)}
                        >
                          <Download size={12} />
                          <span>Import</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ height: '28px', fontSize: '11px' }}
                          onClick={() => handleDismiss(result, index)}
                        >
                          <X size={12} />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <ConnectGeminiModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        onOpenSettings={onOpenSettings}
      />

      <DuplicateOpportunityModal
        isOpen={Boolean(duplicateModal)}
        companyName={duplicateModal?.pendingOpp?.company_name}
        roleTitle={duplicateModal?.pendingOpp?.role_title}
        onSkip={handleDuplicateSkip}
        onUpdate={handleDuplicateUpdate}
        onMerge={handleDuplicateMerge}
        onClose={() => setDuplicateModal(null)}
      />
    </div>
  );
}
