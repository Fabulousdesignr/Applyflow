import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  Zap, 
  Clock, 
  FileText, 
  CheckCircle, 
  Plus
} from 'lucide-react';
import {
  filterActiveOpportunities,
  countArchivedOpportunities,
} from '../utils/opportunityArchive';

export default function Dashboard({ 
  opportunities, 
  onNavigateToTab, 
  onSelectRow 
}) {
  const activeOpportunities = useMemo(
    () => filterActiveOpportunities(opportunities),
    [opportunities]
  );

  // Stat calculations (active pipeline only; archived shown separately)
  const total = activeOpportunities.length;
  const applied = activeOpportunities.filter(o => o.status === 'Applied').length;
  const pending = activeOpportunities.filter(o => ['Applying', 'Applied', 'Followed Up'].includes(o.status)).length;
  const interviews = activeOpportunities.filter(o => o.status === 'Interview').length;
  const rejections = countArchivedOpportunities(opportunities);
  
  const highPriority = activeOpportunities.filter(o => o.priority === 'High').length;
  const highScoring = activeOpportunities.filter(o => o.compatibility_score >= 80).length;
  const watPerfect = activeOpportunities.filter(o => String(o.wat_compatibility).toLowerCase().includes('perfect')).length;
  
  // Follow-up reminders
  const today = new Date().toISOString().substring(0, 10);
  const upcomingFollowups = activeOpportunities
    .filter(o => o.follow_up_date && o.follow_up_date >= today && o.status !== 'Closed')
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))
    .slice(0, 5);

  // Top high score opportunities
  const topCompatibility = [...activeOpportunities]
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .slice(0, 4);

  // Funnel calculations
  const stageStats = {
    'Not Started': activeOpportunities.filter(o => o.status === 'Not Started').length,
    'Researching': activeOpportunities.filter(o => o.status === 'Researching').length,
    'Applying': activeOpportunities.filter(o => o.status === 'Applying').length,
    'Applied': activeOpportunities.filter(o => o.status === 'Applied').length,
    'Interview': activeOpportunities.filter(o => o.status === 'Interview').length,
    'Offer': activeOpportunities.filter(o => o.status === 'Offer').length,
  };

  const maxStageCount = Math.max(...Object.values(stageStats), 1);

  // Company types breakdown
  const typeCounts = activeOpportunities.reduce((acc, o) => {
    acc[o.company_type] = (acc[o.company_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dashboard-view">
      {/* 8-Card Metrics Panel */}
      <div className="metrics-row">
        <div className="metric-card">
          <span className="metric-card-label">Total Pipeline</span>
          <span className="metric-card-value">{total}</span>
          <span className="metric-card-footer">opportunities</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">Applied Roles</span>
          <span className="metric-card-value" style={{ color: '#60a5fa' }}>{applied}</span>
          <span className="metric-card-footer">completed submissions</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">In-Flight Apps</span>
          <span className="metric-card-value" style={{ color: '#a78bfa' }}>{pending}</span>
          <span className="metric-card-footer">applying/applied</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">Active Interviews</span>
          <span className="metric-card-value" style={{ color: '#fbbf24' }}>{interviews}</span>
          <span className="metric-card-footer">live processes</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">High Priority</span>
          <span className="metric-card-value" style={{ color: '#f87171' }}>{highPriority}</span>
          <span className="metric-card-footer">immediate focus</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">High Scoring (&gt;80)</span>
          <span className="metric-card-value" style={{ color: '#10b981' }}>{highScoring}</span>
          <span className="metric-card-footer">highly compatible</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">WAT Perfect</span>
          <span className="metric-card-value" style={{ color: '#818cf8' }}>{watPerfect}</span>
          <span className="metric-card-footer">Lagos overlap (CET/EMEA)</span>
        </div>
        <div className="metric-card">
          <span className="metric-card-label">Rejections</span>
          <span className="metric-card-value" style={{ color: '#9ca3af' }}>{rejections}</span>
          <span className="metric-card-footer">lessons documented</span>
        </div>
      </div>

      {/* Main Sections */}
      <div className="dashboard-sections">
        {/* Left Side: Pipeline Funnel & High Compatibility Roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Pipeline Funnel Panel */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <span>Conversion Funnel Analytics</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'normal' }}>Pipeline progression index</span>
            </div>
            <div className="panel-body">
              <div className="stage-funnel">
                {Object.entries(stageStats).map(([stage, count], index) => {
                  const percentage = Math.round((count / maxStageCount) * 100);
                  const colors = ['#6b7280', '#818cf8', '#a78bfa', '#60a5fa', '#fbbf24', '#34d399'];
                  return (
                    <div key={stage} className="stage-funnel-row">
                      <span className="stage-label">{stage}</span>
                      <div className="stage-bar-container">
                        <div 
                          className="stage-bar" 
                          style={{ 
                            width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
                            backgroundColor: colors[index]
                          }} 
                        />
                      </div>
                      <span className="stage-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* High Compatibility Roles Alerts */}
          <div className="dashboard-panel">
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <span>Top AI-Match Recommendations (Score &gt; 80)</span>
              <Zap size={14} style={{ color: '#fbbf24' }} />
            </div>
            <div className="panel-body" style={{ padding: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {topCompatibility.map((opp, idx) => (
                  <div 
                    key={opp.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: idx === topCompatibility.length - 1 ? 'none' : '1px solid var(--border-primary)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      onNavigateToTab('database');
                      onSelectRow(opp);
                    }}
                    className="reminder-item-hover"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#f3f4f6' }}>{opp.company_name}</span>
                        <span style={{
                          fontSize: '10px',
                          backgroundColor: '#1c1e23',
                          border: '1px solid #2d3039',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          color: '#9ca3af'
                        }}>{opp.company_type}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block', wordBreak: 'break-word', overflow: 'hidden' }}>
                        {opp.role_title} • {opp.country}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span className={`score-pill ${opp.compatibility_score >= 80 ? 'high' : opp.compatibility_score >= 50 ? 'medium' : 'low'}`}>
                          {opp.compatibility_score} pts
                        </span>
                        <span style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                          WAT: {opp.wat_compatibility}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Follow-up Reminders & Company Types Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Follow-up Reminders */}
          <div className="dashboard-panel">
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: '#fbbf24' }} />
              <span>Upcoming Follow-ups</span>
            </div>
            <div className="panel-body">
              {upcomingFollowups.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '24px 0', 
                  color: '#6b7280',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                  <span>No pending follow-ups found!</span>
                </div>
              ) : (
                <div className="reminder-list">
                  {upcomingFollowups.map((opp) => (
                    <div 
                      key={opp.id} 
                      className="reminder-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onNavigateToTab('database');
                        onSelectRow(opp);
                      }}
                    >
                      <div className="reminder-info">
                        <span className="reminder-title">{opp.company_name}</span>
                        <span className="reminder-meta">{opp.role_title}</span>
                      </div>
                      <span className="reminder-date">{opp.follow_up_date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Company Sectors Panel */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <span>Opportunities by Industry</span>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(typeCounts).map(([type, count]) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: '500' }}>{type}</span>
                      <span style={{ color: '#f3f4f6', fontFamily: 'JetBrains Mono, monospace' }}>{count} ({percent}%)</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: '#1d2025', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${percent}%`, 
                        height: '100%', 
                        backgroundColor: '#6b7280', 
                        borderRadius: '2px' 
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
