import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { 
  getSettings, 
  saveSettings, 
  testSupabaseConnection, 
  migrateLocalToSupabase 
} from '../database/db';

export default function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [settings, setSettings] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    openaiApiKey: '',
    claudeApiKey: ''
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'failed' | null
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null); // 'success' | 'failed' | null

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
      setTestResult(null);
      setMigrationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    saveSettings(settings);
    alert("Settings saved successfully!");
    onSyncComplete(); // Trigger state refresh in App.jsx
    onClose();
  };

  const handleTestConnection = async () => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      alert("Please fill in both Supabase URL and Anon Key first!");
      return;
    }
    setTesting(true);
    setTestResult(null);
    const success = await testSupabaseConnection(settings.supabaseUrl, settings.supabaseAnonKey);
    setTesting(false);
    setTestResult(success ? 'success' : 'failed');
  };

  const handleMigrate = async () => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      alert("Please fill in and verify Supabase settings before migrating!");
      return;
    }
    setMigrating(true);
    setMigrationResult(null);
    const success = await migrateLocalToSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
    setMigrating(false);
    setMigrationResult(success ? 'success' : 'failed');
    if (success) {
      alert("Successfully migrated all LocalStorage records to Supabase PostgreSQL database!");
      onSyncComplete();
    } else {
      alert("Migration failed. Please ensure your opportunities table schema exists in Supabase and that RLS policies allow inserts.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Title Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>Developer Configurations &amp; Sync</span>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Configure database endpoints and large language model parsing credentials. All inputs are saved entirely in your local browser storage and never sent to external servers.
          </p>

          {/* Section 1: Supabase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
              <Database size={13} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supabase PostgreSQL Backend</span>
            </div>

            <div className="form-group">
              <label className="form-label">Supabase URL</label>
              <input 
                type="text" 
                placeholder="https://your-project-id.supabase.co"
                value={settings.supabaseUrl || ''}
                onChange={(e) => handleFieldChange('supabaseUrl', e.target.value)}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Public Anon Key</label>
              <input 
                type="password" 
                placeholder="eyJHbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={settings.supabaseAnonKey || ''}
                onChange={(e) => handleFieldChange('supabaseAnonKey', e.target.value)}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                onClick={handleTestConnection}
                disabled={testing}
                className="btn btn-secondary"
                style={{ fontSize: '11px', height: '24px', flexGrow: 1 }}
              >
                {testing ? <RefreshCw size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={12} />}
                <span>Test Sync Endpoint</span>
              </button>
              
              <button 
                onClick={handleMigrate}
                disabled={migrating}
                className="btn btn-secondary"
                style={{ fontSize: '11px', height: '24px', flexGrow: 1 }}
              >
                {migrating ? <RefreshCw size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
                <span>Upload Local Data to SQL</span>
              </button>
            </div>

            {/* Test Results messages */}
            {testResult === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px', borderRadius: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Connection Verified! Ready to read/write from Supabase REST.</span>
              </div>
            )}
            {testResult === 'failed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px', borderRadius: '4px' }}>
                <AlertCircle size={13} />
                <span>Connection failed. Check project ID, CORS permissions, and anonymization tokens.</span>
              </div>
            )}
          </div>

          {/* Section 2: LLMs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
              <Key size={13} style={{ color: '#a78bfa' }} />
              <span style={{ fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Generative AI API Keys (Optional)</span>
            </div>

            <div className="form-group">
              <label className="form-label">Anthropic Claude API Key</label>
              <input 
                type="password" 
                placeholder="sk-ant-api03-..."
                value={settings.claudeApiKey || ''}
                onChange={(e) => handleFieldChange('claudeApiKey', e.target.value)}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Google Gemini API Key (Free Tier)</label>
              <input 
                type="password" 
                placeholder="AIzaSy..."
                value={settings.geminiApiKey || ''}
                onChange={(e) => handleFieldChange('geminiApiKey', e.target.value)}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">OpenAI API Key</label>
              <input 
                type="password" 
                placeholder="sk-proj-..."
                value={settings.openaiApiKey || ''}
                onChange={(e) => handleFieldChange('openaiApiKey', e.target.value)}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            <span>Cancel</span>
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <span>Save Developer Configurations</span>
          </button>
        </div>

      </div>
    </div>
  );
}
