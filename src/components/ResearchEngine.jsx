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
  ChevronDown,
  ChevronRight,
  MapPin,
  DollarSign,
  Target,
  Building2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe,
  Search,
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
  REGION_OPTIONS,
  WORK_ELIGIBILITY_OPTIONS,
  CORE_SKILL_OPTIONS,
  INDUSTRY_OPTIONS,
  COMPANY_STAGE_OPTIONS,
  MUST_HAVES_OPTIONS,
  CURRENCY_OPTIONS,
  PAY_FREQUENCY_OPTIONS,
  SEARCH_MODES,
  createResearchSessionMeta,
} from '../research/researchTypes';
import {
  runGeminiResearch,
  mapResearchResultToOpportunity,
  isGeminiConfigured,
  isTavilyConfigured,
} from '../research/researchService';
import {
  findDuplicateOpportunity,
  mergeOpportunityFields,
} from '../research/duplicateUtils';
import DuplicateOpportunityModal from './DuplicateOpportunityModal';
import ConnectGeminiModal from './ConnectGeminiModal';

/* ─── Sub-components ─────────────────────────────────────────────────────── */

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

function CheckboxList({ options, selected, onChange }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="re-checkbox-list">
      {options.map((opt) => (
        <label key={opt} className="re-checkbox-row">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="re-checkbox-input"
          />
          <span className="re-checkbox-label">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function Section({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="re-section">
      <button
        type="button"
        className="re-section-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="re-section-icon">{icon}</span>
        <span className="re-section-title">{title}</span>
        <span className="re-section-chevron">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>
      {open && <div className="re-section-body">{children}</div>}
    </div>
  );
}

/* ─── Idle state panel ───────────────────────────────────────────────────── */

/** Build an array of { group, tags } from current filters — completely reactive */
function buildPreviewGroups(filters) {
  const groups = [];

  // Role
  const roleTags = [
    ...(filters.roleTitle ? [`"${filters.roleTitle}"`] : []),
    ...(filters.roleCategories || []),
  ];
  if (roleTags.length) groups.push({ group: 'Role', color: 'blue', tags: roleTags });

  // Experience
  if (filters.experienceLevel) {
    groups.push({ group: 'Level', color: 'violet', tags: [filters.experienceLevel] });
  }

  // Location
  const locationTags = [
    ...(filters.region && filters.region !== 'Global' ? [filters.region] : []),
    ...(filters.countryCity ? [filters.countryCity] : []),
    ...(filters.workEligibility || []),
    ...(filters.timezoneCompatibility && filters.timezoneCompatibility !== 'Any'
      ? [filters.timezoneCompatibility]
      : []),
  ];
  if (locationTags.length) groups.push({ group: 'Location', color: 'green', tags: locationTags });

  // Remote preference
  if (filters.remotePreference && filters.remotePreference !== 'No Strong Preference') {
    groups.push({ group: 'Remote', color: 'sky', tags: [filters.remotePreference] });
  }

  // Compensation
  if (filters.minSalary) {
    groups.push({
      group: 'Min Pay',
      color: 'amber',
      tags: [`${filters.minSalary} ${filters.currency || 'USD'} / ${filters.payFrequency || 'Monthly'}`],
    });
  }

  // Core skills
  if (filters.coreSkills?.length) {
    groups.push({ group: 'Skills', color: 'blue', tags: filters.coreSkills });
  }

  // AI tools
  if (filters.aiTools?.length) {
    groups.push({ group: 'Tools', color: 'violet', tags: filters.aiTools });
  }

  // Industries
  if (filters.industries?.length) {
    groups.push({ group: 'Industry', color: 'sky', tags: filters.industries });
  }

  // Company stage
  if (filters.companyStages?.length) {
    groups.push({ group: 'Stage', color: 'green', tags: filters.companyStages });
  }

  // Team size
  if (filters.teamSize && filters.teamSize !== 'Any') {
    groups.push({ group: 'Team', color: 'amber', tags: [filters.teamSize] });
  }

  // Must-haves
  if (filters.mustHaves?.length) {
    groups.push({ group: 'Must-Have', color: 'red', tags: filters.mustHaves });
  }

  // Search mode — always shown
  const modeMap = { precision: '🎯 Precision', discovery: '🔭 Discovery', aggressive: '🚀 Aggressive' };
  groups.push({
    group: 'Mode',
    color: 'mode',
    tags: [modeMap[filters.searchMode] || '🔭 Discovery'],
  });

  return groups;
}

function IdlePanel({ filters }) {
  const suggestions = [
    { icon: '🌍', title: 'AI startups hiring in Europe', tag: 'Discovery' },
    { icon: '🌱', title: 'Remote Fintech roles open to Africa', tag: 'Hot' },
    { icon: '🔭', title: 'Hidden roles from company career pages', tag: 'Unconventional' },
    { icon: '⚡', title: 'AI-native design roles at seed stage', tag: 'Emerging' },
  ];

  const insights = [
    '📈 Product design demand up 12% globally',
    '🤖 AI-native designer roles growing 3× YoY',
    '🌐 Remote-first adoption highest in SaaS',
    '💼 Series A startups are top design hirers',
  ];

  const previewGroups = buildPreviewGroups(filters);
  const totalTags = previewGroups.reduce((n, g) => n + g.tags.length, 0);

  return (
    <div className="re-idle-panel">
      {/* ── Search Preview — always visible and always reactive ── */}
      <div className="re-idle-header">
        <Sparkles size={15} style={{ color: '#0A5BFF' }} />
        <span>Search Preview</span>
        {totalTags > 0 && (
          <span className="re-preview-count">{totalTags} filter{totalTags !== 1 ? 's' : ''} active</span>
        )}
      </div>

      <div className="re-preview-live">
        {previewGroups.map(({ group, color, tags }) => (
          <div key={group} className="re-preview-group">
            <span className="re-preview-group-label">{group}</span>
            <div className="re-preview-tags">
              {tags.map((tag) => (
                <span key={tag} className={`re-preview-tag re-preview-tag--${color}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        {totalTags === 0 && (
          <p className="re-preview-empty-hint">Select filters on the left to build your search.</p>
        )}
      </div>

      {/* ── AI Suggestions ── */}
      <div className="re-idle-section-label" style={{ marginTop: '4px' }}>AI Suggestions</div>
      <div className="re-suggestions">
        {suggestions.map((s) => (
          <div key={s.title} className="re-suggestion-card">
            <span className="re-suggestion-icon">{s.icon}</span>
            <span className="re-suggestion-text">{s.title}</span>
            <span className="re-suggestion-tag">{s.tag}</span>
          </div>
        ))}
      </div>

      <div className="re-idle-section-label">Recent Market Intelligence</div>
      <div className="re-insights">
        {insights.map((i) => (
          <div key={i} className="re-insight-pill">{i}</div>
        ))}
      </div>
    </div>
  );
}


/* ─── Main Component ─────────────────────────────────────────────────────── */

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

    if (!isTavilyConfigured(settings)) {
      setPhase('error');
      setErrorMessage('Tavily Search API key is missing. Add VITE_TAVILY_API_KEY to your .env.local file and restart the development server.');
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
    setStatusLine('Formulating query and querying Tavily API…');

    try {
      setStatusLine('Tavily is scanning Greenhouse, Ashby, Lever & startups for active listings…');
      const rawItems = await runGeminiResearch(settings.geminiApiKey, settings.tavilyApiKey, filters);

      createResearchSessionMeta(filters, rawItems.length);

      setResults(rawItems);
      setPhase('results');
      setStatusLine(`Found ${rawItems.length} verified opportunities. Review and import.`);
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
      {/* Page Header */}
      <div className="re-page-header">
        <div>
          <h1 className="re-page-title">AI Discovery Engine</h1>
          <p className="re-page-subtitle">
            Discover tailored opportunities using AI-powered global market intelligence.
          </p>
        </div>
        <div className="re-header-meta">
          <span className="re-mode-badge">
            {SEARCH_MODES.find((m) => m.id === filters.searchMode)?.icon}{' '}
            {SEARCH_MODES.find((m) => m.id === filters.searchMode)?.label}
          </span>
        </div>
      </div>

      <div className="research-layout">
        {/* ── Left: Input panel ──────────────────────────────────────── */}
        <section className="research-panel research-input-panel">
          <div className="research-panel-head">
            <Radar size={14} style={{ color: 'var(--accent-blue)' }} />
            <span>Discovery Parameters</span>
          </div>

          <div className="research-form">

            {/* 1. Role Target */}
            <Section icon={<Target size={13} />} title="Role Target" defaultOpen>
              <div className="form-group">
                <label className="form-label">Role Title</label>
                <div className="re-search-input-wrapper">
                  <Search size={12} className="re-search-icon" />
                  <input
                    type="text"
                    className="form-input re-text-input re-search-input"
                    placeholder="e.g. Product Designer, Design Lead…"
                    value={filters.roleTitle}
                    onChange={(e) => updateFilter('roleTitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" id="role-categories-label">
                  Role Categories
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
                  <label className="form-label">Experience</label>
                  <select
                    className="form-input research-select"
                    value={filters.experienceLevel}
                    onChange={(e) => updateFilter('experienceLevel', e.target.value)}
                  >
                    {EXPERIENCE_LEVELS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Remote</label>
                  <select
                    className="form-input research-select"
                    value={filters.remotePreference}
                    onChange={(e) => updateFilter('remotePreference', e.target.value)}
                  >
                    {REMOTE_PREFERENCES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            {/* 2. Location */}
            <Section icon={<MapPin size={13} />} title="Location Preferences" defaultOpen>
              <div className="research-form-row">
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <select
                    className="form-input research-select"
                    value={filters.region}
                    onChange={(e) => updateFilter('region', e.target.value)}
                  >
                    {REGION_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select
                    className="form-input research-select"
                    value={filters.timezoneCompatibility}
                    onChange={(e) => updateFilter('timezoneCompatibility', e.target.value)}
                  >
                    {TIMEZONE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Country / City</label>
                <div className="re-search-input-wrapper">
                  <Globe size={12} className="re-search-icon" />
                  <input
                    type="text"
                    className="form-input re-text-input re-search-input"
                    placeholder="e.g. Nigeria, Germany, London…"
                    value={filters.countryCity}
                    onChange={(e) => updateFilter('countryCity', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Work Eligibility</label>
                <MultiSelectChips
                  options={WORK_ELIGIBILITY_OPTIONS}
                  selected={filters.workEligibility}
                  onChange={(v) => updateFilter('workEligibility', v)}
                />
              </div>
            </Section>

            {/* 3. Compensation */}
            <Section icon={<DollarSign size={13} />} title="Compensation" defaultOpen={false}>
              <div className="re-comp-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Minimum Salary</label>
                  <input
                    type="number"
                    className="form-input re-text-input"
                    placeholder="e.g. 3000"
                    value={filters.minSalary}
                    onChange={(e) => updateFilter('minSalary', e.target.value)}
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Currency</label>
                  <select
                    className="form-input research-select"
                    value={filters.currency}
                    onChange={(e) => updateFilter('currency', e.target.value)}
                  >
                    {CURRENCY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pay Frequency</label>
                <div className="research-chip-grid">
                  {PAY_FREQUENCY_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      className={`research-chip ${filters.payFrequency === o ? 'active' : ''}`}
                      onClick={() => updateFilter('payFrequency', o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* 4. Skills */}
            <Section icon={<Zap size={13} />} title="Skills & Strengths" defaultOpen>
              <div className="form-group">
                <label className="form-label">Core Skills</label>
                <MultiSelectChips
                  options={CORE_SKILL_OPTIONS}
                  selected={filters.coreSkills}
                  onChange={(v) => updateFilter('coreSkills', v)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" id="ai-tools-label">
                  AI / Tool Stack
                </label>
                <MultiSelectChips
                  id="ai-tools-label"
                  options={AI_TOOL_OPTIONS}
                  selected={filters.aiTools}
                  onChange={(v) => updateFilter('aiTools', v)}
                />
              </div>
            </Section>

            {/* 5. Company Profile */}
            <Section icon={<Building2 size={13} />} title="Ideal Company Profile" defaultOpen={false}>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <MultiSelectChips
                  options={INDUSTRY_OPTIONS}
                  selected={filters.industries}
                  onChange={(v) => updateFilter('industries', v)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Stage</label>
                <MultiSelectChips
                  options={COMPANY_STAGE_OPTIONS}
                  selected={filters.companyStages}
                  onChange={(v) => updateFilter('companyStages', v)}
                />
              </div>
              <div className="research-form-row">
                <div className="form-group">
                  <label className="form-label">Team Size</label>
                  <select
                    className="form-input research-select"
                    value={filters.teamSize}
                    onChange={(e) => updateFilter('teamSize', e.target.value)}
                  >
                    {TEAM_SIZES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Results</label>
                  <select
                    className="form-input research-select"
                    value={filters.resultsCount}
                    onChange={(e) => updateFilter('resultsCount', Number(e.target.value))}
                  >
                    {RESULT_COUNTS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            {/* 6. Must-Haves */}
            <Section icon={<ShieldCheck size={13} />} title="Must-Haves" defaultOpen={false}>
              <CheckboxList
                options={MUST_HAVES_OPTIONS}
                selected={filters.mustHaves}
                onChange={(v) => updateFilter('mustHaves', v)}
              />
            </Section>

            {/* 7. AI Search Mode */}
            <Section icon={<TrendingUp size={13} />} title="AI Search Strategy" defaultOpen>
              <div className="re-mode-cards">
                {SEARCH_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`re-mode-card ${filters.searchMode === mode.id ? 'active' : ''}`}
                    onClick={() => updateFilter('searchMode', mode.id)}
                  >
                    <span className="re-mode-icon">{mode.icon}</span>
                    <span className="re-mode-label">{mode.label}</span>
                    <span className="re-mode-desc">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Run button */}
            <button
              type="button"
              className="btn btn-primary research-run-btn"
              onClick={handleRunResearch}
              disabled={phase === 'running'}
            >
              {phase === 'running' ? (
                <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Sparkles size={14} />
              )}
              <span>{phase === 'running' ? 'Searching…' : 'Run Discovery'}</span>
            </button>
          </div>
        </section>

        {/* ── Right: Results panel ───────────────────────────────────── */}
        <section className="research-panel research-results-panel">
          <div className="research-panel-head">
            <Sparkles size={14} style={{ color: '#0A5BFF' }} />
            <span>Discovery Results</span>
            {phase === 'results' && (
              <span className="research-results-badge">{visibleResults.length} active</span>
            )}
          </div>

          <div className="research-results-body">
            {phase === 'idle' && <IdlePanel filters={filters} />}

            {phase === 'running' && (
              <div className="research-status-box">
                <Loader2
                  size={18}
                  className="spinner"
                  style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)', flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontWeight: 600 }}>Discovery in progress</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {statusLine}
                  </p>
                </div>
              </div>
            )}

            {phase === 'error' && (
              <div className="research-alert research-alert-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
                        <div className="re-card-badges">
                          {result.classification && (
                            <span className={`re-badge-class re-badge-class--${result.classification.toLowerCase().replace(/\s+/g, '-')}`}>
                              {result.classification}
                            </span>
                          )}
                          <span className="research-card-type">{result.company_type}</span>
                        </div>
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
