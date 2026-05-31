import React from 'react';
import { 
  LayoutDashboard, 
  TableProperties, 
  Tags, 
  CloudUpload, 
  Settings, 
  Radar,
  LogOut
} from 'lucide-react';
import { filterActiveOpportunities } from '../utils/opportunityArchive';

function emailInitials(email) {
  if (!email) return 'AF';
  const local = email.split('@')[0] || '';
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local.slice(0, 1).toUpperCase() || 'AF';
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  opportunities, 
  openSettings,
  userEmail,
  onLogout,
}) {
  // Compute counts for badging (active pipeline; archived excluded)
  const activeOpportunities = filterActiveOpportunities(opportunities);
  const total = activeOpportunities.length;
  const researching = activeOpportunities.filter(o => o.status === 'Researching').length;
  const applying = activeOpportunities.filter(o => o.status === 'Applying').length;
  const applied = activeOpportunities.filter(o => o.status === 'Applied').length;
  const interview = activeOpportunities.filter(o => o.status === 'Interview').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'database', label: 'Opportunities', icon: TableProperties, count: total },
    { id: 'research', label: 'Research', icon: Radar },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'upload', label: 'AI Parse & Import', icon: CloudUpload },
  ];

  const statusItems = [
    { label: 'Researching', count: researching, color: '#818cf8' },
    { label: 'Applying', count: applying, color: '#a78bfa' },
    { label: 'Applied', count: applied, color: '#60a5fa' },
    { label: 'Interviews', count: interview, color: '#fbbf24' },
  ];

  return (
    <aside className="sidebar">
      {/* Header / Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-dot" />
          <span>Applyflow</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <span style={{
            fontSize: '9px',
            fontFamily: 'JetBrains Mono, monospace',
            backgroundColor: '#1d2025',
            border: '1px solid #2d3039',
            padding: '1px 4px',
            borderRadius: '3px',
            color: '#9ca3af'
          }}>v1.0</span>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id}
              className={`menu-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <div className="menu-item-left">
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="menu-item-count">{item.count}</span>
              )}
            </div>
          );
        })}

        <div className="sidebar-divider" />

        {/* Dynamic Status Breakdown */}
        <div className="sidebar-section-title">Application Status</div>
        {statusItems.map((status, i) => (
          <div 
            key={i}
            className="menu-item"
            style={{ paddingLeft: '16px', color: '#9ca3af' }}
            onClick={() => {
              setCurrentTab('database');
              // We'll pass status filter down in state in App.jsx
            }}
          >
            <div className="menu-item-left">
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: status.color 
              }} />
              <span style={{ fontSize: '12px' }}>{status.label}</span>
            </div>
            <span className="menu-item-count" style={{ fontSize: '10px' }}>{status.count}</span>
          </div>
        ))}
      </nav>

      {/* Footer Profile Section */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="user-profile">
            <div className="user-avatar">{emailInitials(userEmail)}</div>
            <div className="user-info">
              <span className="user-name">{userEmail || 'Signed in'}</span>
              <span className="user-meta">Magic link session</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="icon-btn"
                onClick={openSettings}
                title="Database & Key Settings"
              >
                <Settings size={15} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={onLogout}
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
