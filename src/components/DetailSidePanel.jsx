import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ExternalLink, 
  Trash2, 
  Zap, 
  FileText, 
  Target, 
  Send 
} from 'lucide-react';
import { calculateCompatibilityScore } from '../database/db';

export default function DetailSidePanel({ 
  opportunity, 
  onClose, 
  onSave, 
  onDelete 
}) {
  const [activeTab, setActiveTab] = useState('specs');
  const [formData, setFormData] = useState({ ...opportunity });
  const saveTimerRef = useRef(null);
  const latestFormRef = useRef(formData);

  // Keep ref in sync so the cleanup effect always has the latest data
  useEffect(() => {
    latestFormRef.current = formData;
  }, [formData]);

  // Flush any pending debounced save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        onSave(latestFormRef.current);
      }
    };
  }, []);

  if (!opportunity) return null;

  // Handle local form edits — update local state instantly, debounce the expensive save
  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    // Automatically re-calculate score if relevant field changes
    if ([
      'wat_compatibility', 
      'company_size', 
      'global_remote_friendly', 
      'ai_workflow_mentioned', 
      'mid_entry_friendly', 
      'outreach_method'
    ].includes(field)) {
      updated.compatibility_score = calculateCompatibilityScore(updated);
    }
    setFormData(updated);

    // Debounce the save: only persist after 400ms of inactivity
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSave(updated);
      saveTimerRef.current = null;
    }, 400);
  };

  // For select/dropdown changes, save immediately (user expects instant feedback)
  const handleSelectFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    if ([
      'wat_compatibility', 
      'company_size', 
      'global_remote_friendly', 
      'ai_workflow_mentioned', 
      'mid_entry_friendly', 
      'outreach_method'
    ].includes(field)) {
      updated.compatibility_score = calculateCompatibilityScore(updated);
    }
    setFormData(updated);
    // Selects save immediately — no debounce needed since user clicks once
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    onSave(updated);
  };

  const handleLocalDelete = () => {
    if (window.confirm(`Delete ${formData.company_name} permanently?`)) {
      onDelete(formData.id);
      onClose();
    }
  };

  const score = formData.compatibility_score || 0;

  return (
    <>
      {/* Dim backdrop */}
      <div className="detail-drawer-overlay" onClick={onClose} />
      
      {/* Drawer Body */}
      <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Header Row */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
              {formData.company_name || 'New Opportunity'}
            </span>
            <span className={`score-pill ${score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low'}`} style={{ fontSize: '10px' }}>
              {score} pts
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              onClick={handleLocalDelete}
              className="icon-btn"
              title="Delete Role"
              style={{ color: '#f87171' }}
            >
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="icon-btn">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="drawer-tabs">
          <div 
            onClick={() => setActiveTab('specs')}
            className={`drawer-tab ${activeTab === 'specs' ? 'active' : ''}`}
          >
            Role Specs
          </div>
          <div 
            onClick={() => setActiveTab('pitch')}
            className={`drawer-tab ${activeTab === 'pitch' ? 'active' : ''}`}
          >
            Pitch Strategy
          </div>
          <div 
            onClick={() => setActiveTab('outreach')}
            className={`drawer-tab ${activeTab === 'outreach' ? 'active' : ''}`}
          >
            Outreach & Timeline
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="drawer-body">

          {/* TAB 1: SPECS */}
          {activeTab === 'specs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input 
                    type="text" 
                    value={formData.company_name || ''}
                    onChange={(e) => handleFieldChange('company_name', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role Title</label>
                  <input 
                    type="text" 
                    value={formData.role_title || ''}
                    onChange={(e) => handleFieldChange('role_title', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input 
                    type="text" 
                    value={formData.country || ''}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Remote Status</label>
                  <input 
                    type="text" 
                    value={formData.remote_status || ''}
                    onChange={(e) => handleFieldChange('remote_status', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Company Type</label>
                  <select 
                    value={formData.company_type || 'SaaS'}
                    onChange={(e) => handleSelectFieldChange('company_type', e.target.value)}
                    className="form-select-styled"
                  >
                    <option value="AI Startup">AI Startup</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Agency">Agency</option>
                    <option value="No-Code Studio">No-Code Studio</option>
                    <option value="Reddit">Reddit Outreach</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Company Size</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 11-50"
                    value={formData.company_size || ''}
                    onChange={(e) => handleFieldChange('company_size', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Salary Estimate</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $80k - $110k"
                    value={formData.salary_estimate || ''}
                    onChange={(e) => handleFieldChange('salary_estimate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WAT Compatibility</label>
                  <select 
                    value={formData.wat_compatibility || 'Perfect'}
                    onChange={(e) => handleSelectFieldChange('wat_compatibility', e.target.value)}
                    className="form-select-styled"
                  >
                    <option value="Perfect">Perfect WAT (Lagos overlap)</option>
                    <option value="High">High (CET / EMEA)</option>
                    <option value="Medium">Medium (Americas window)</option>
                    <option value="Low">Low (APAC split shift)</option>
                  </select>
                </div>
              </div>

              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Global Remote Contractor Friendly?</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Yes / Timezone windows"
                    value={formData.global_remote_friendly || ''}
                    onChange={(e) => handleFieldChange('global_remote_friendly', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mid-Level friendly?</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Yes / Focuses on execution"
                    value={formData.mid_entry_friendly || ''}
                    onChange={(e) => handleFieldChange('mid_entry_friendly', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="sidebar-divider" />

              <div className="form-group">
                <label className="form-label">Core Link Profiles</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {formData.application_link && (
                    <a 
                      href={formData.application_link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary" 
                      style={{ justifyContent: 'flex-start', fontSize: '11px', height: '24px' }}
                    >
                      <ExternalLink size={12} />
                      <span>Submit Application Page</span>
                    </a>
                  )}
                  {formData.career_page && (
                    <a 
                      href={formData.career_page} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary" 
                      style={{ justifyContent: 'flex-start', fontSize: '11px', height: '24px' }}
                    >
                      <ExternalLink size={12} />
                      <span>Company Career Directory</span>
                    </a>
                  )}
                  {formData.linkedin_page && (
                    <a 
                      href={formData.linkedin_page} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary" 
                      style={{ justifyContent: 'flex-start', fontSize: '11px', height: '24px' }}
                    >
                      <ExternalLink size={12} />
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PITCH STRATEGY */}
          {activeTab === 'pitch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="score-insight-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} style={{ color: '#fbbf24' }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '12px' }}>Algorithmic Match Score: {score}/100</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Based on WAT, AI stacks, global frameworks, and startup sizes</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Why I Have A Chance (WAT / Profile match)</label>
                <textarea 
                  value={formData.why_i_have_a_chance || ''}
                  onChange={(e) => handleFieldChange('why_i_have_a_chance', e.target.value)}
                  className="form-textarea"
                  placeholder="Identify your competitive edge (e.g. perfect European timezone fit, fast-prototyping, Figma component system mastery)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Figma &amp; AI-Native Workflow Focus</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cursor, v0, Lovable, Claude Code, Figma auto-layout"
                  value={formData.ai_workflow_mentioned || ''}
                  onChange={(e) => handleFieldChange('ai_workflow_mentioned', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Tools &amp; Dev Literacy</label>
                <input 
                  type="text" 
                  placeholder="e.g. Figma component variables, HTML/CSS coding, React"
                  value={formData.key_tools_mentioned || ''}
                  onChange={(e) => handleFieldChange('key_tools_mentioned', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Portfolio Adjustments Required</label>
                <textarea 
                  value={formData.portfolio_advice || ''}
                  onChange={(e) => handleFieldChange('portfolio_advice', e.target.value)}
                  className="form-textarea"
                  placeholder="What case studies or active prototype links should you prioritize showing this company?"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Application Emphasis Notes</label>
                <textarea 
                  value={formData.application_emphasis || ''}
                  onChange={(e) => handleFieldChange('application_emphasis', e.target.value)}
                  className="form-textarea"
                  placeholder="E.g. Highlight developer handoff details, B2B dense grid structures, or speed of prototyping"
                />
              </div>
            </div>
          )}

          {/* TAB 3: OUTREACH & TIMELINE */}
          {activeTab === 'outreach' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    value={formData.status || 'Not Started'}
                    onChange={(e) => handleSelectFieldChange('status', e.target.value)}
                    className="form-select-styled"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Researching">Researching</option>
                    <option value="Applying">Applying</option>
                    <option value="Applied">Applied</option>
                    <option value="Followed Up">Followed Up</option>
                    <option value="Interview">Interview</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Offer">Offer</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    value={formData.priority || 'Medium'}
                    onChange={(e) => handleSelectFieldChange('priority', e.target.value)}
                    className="form-select-styled"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Applied Date</label>
                  <input 
                    type="date" 
                    value={formData.applied_date || ''}
                    onChange={(e) => handleFieldChange('applied_date', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Next Follow-Up</label>
                  <input 
                    type="date" 
                    value={formData.follow_up_date || ''}
                    onChange={(e) => handleFieldChange('follow_up_date', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="sidebar-divider" />

              <div className="field-grid">
                <div className="form-group">
                  <label className="form-label">Founder / Hiring Manager Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John O'Nolan (CEO)"
                    value={formData.founder_hr_name || ''}
                    onChange={(e) => handleFieldChange('founder_hr_name', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Outreach Method</label>
                  <select 
                    value={formData.outreach_method || 'Direct Apply'}
                    onChange={(e) => handleSelectFieldChange('outreach_method', e.target.value)}
                    className="form-select-styled"
                  >
                    <option value="Direct Apply">Direct Site Submission</option>
                    <option value="LinkedIn Outreach">LinkedIn InMail / DM Pitch</option>
                    <option value="Reddit DM">Reddit PM Pitch</option>
                    <option value="Direct Email">Direct Email Pitch</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Active Interview Stage</label>
                <select 
                  value={formData.interview_stage || ''}
                  onChange={(e) => handleSelectFieldChange('interview_stage', e.target.value)}
                  className="form-select-styled"
                >
                  <option value="">No Active Interview</option>
                  <option value="Recruiter Screen">Recruiter Screen</option>
                  <option value="Portfolio Review">Portfolio Review with Design Lead</option>
                  <option value="Technical/Code Test">Front-End/Technical Check</option>
                  <option value="Design Challenge">Take-Home Design Challenge</option>
                  <option value="Founder Round">Founder Sync / Culture Fit</option>
                  <option value="Offer / Negotiation">Offer Review</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">General Progress &amp; Strategical Notes</label>
                <textarea 
                  value={formData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Record call logs, feedback comments, salary negotiation items, or research findings here..."
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
