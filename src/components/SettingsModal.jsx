import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Sparkles
} from 'lucide-react';
import { 
  getSettings, 
  saveSettings, 
  testSupabaseConnection, 
  migrateLocalToSupabase 
} from '../database/db';
import { testGeminiConnection, isGeminiConfigured } from '../research/researchService';
import { getEnvKeySource, isEnvKey } from '../config/env';

function EnvLockedHint() {
  return (
    <p style={{ fontSize: '10px', color: '#34d399', marginTop: '4px' }}>
      Set via <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>.env.local</code> (VITE_*). Not stored in browser.
    </p>
  );
}

export default function SettingsModal({ isOpen, onClose, onSyncComplete }) {
  const [settings, setSettings] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    openaiApiKey: '',
    claudeApiKey: '',
    geminiApiKey: '',
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
      setTestResult(null);
      setMigrationResult(null);
      setGeminiTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const envSources = getEnvKeySource();
  const geminiConnected = isGeminiConfigured(settings);

  const handleFieldChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
    if (field === 'geminiApiKey') {
      setGeminiTestResult(null);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    alert("Settings saved successfully!");
    onSyncComplete();
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

  const handleTestGemini = async () => {
    if (!settings.geminiApiKey?.trim()) {
      alert("Enter your Gemini API key first.");
      return;
    }
    setTestingGemini(true);
    setGeminiTestResult(null);
    const success = await testGeminiConnection(settings.geminiApiKey);
    setTestingGemini(false);
    setGeminiTestResult(success ? 'success' : 'failed');
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>Developer Configurations &amp; Sync</span>
          </div>
          <button type="button" onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Configure API credentials via <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>.env.local</code> (recommended) or local browser storage. Never commit real keys to git.
          </p>

          {/* Gemini — Research Engine */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} style={{ color: '#a78bfa' }} />
                <span style={{ fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gemini API (Research Engine)</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 600,
                  backgroundColor: geminiConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.15)',
                  border: geminiConnected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-secondary)',
                  color: geminiConnected ? '#34d399' : '#9ca3af',
                }}
              >
                {geminiConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Gemini API Key</label>
              <input 
                type="password" 
                placeholder={isEnvKey('geminiApiKey') ? 'Configured via VITE_GEMINI_API_KEY' : 'Set VITE_GEMINI_API_KEY in .env.local'}
                value={isEnvKey('geminiApiKey') ? '••••••••••••••••' : (settings.geminiApiKey || '')}
                onChange={(e) => handleFieldChange('geminiApiKey', e.target.value)}
                disabled={isEnvKey('geminiApiKey')}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', opacity: isEnvKey('geminiApiKey') ? 0.7 : 1 }}
              />
              {envSources.geminiApiKey === 'environment' && <EnvLockedHint />}
            </div>

            <button 
              type="button"
              onClick={handleTestGemini}
              disabled={testingGemini}
              className="btn btn-secondary"
              style={{ fontSize: '11px', height: '24px', alignSelf: 'flex-start' }}
            >
              {testingGemini ? <RefreshCw size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={12} />}
              <span>Test Gemini Connection</span>
            </button>

            {geminiTestResult === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px', borderRadius: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Gemini connected. Research Engine is ready.</span>
              </div>
            )}
            {geminiTestResult === 'failed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px', borderRadius: '4px' }}>
                <AlertCircle size={13} />
                <span>Gemini connection failed. Verify your API key and billing.</span>
              </div>
            )}
          </div>

          {/* Supabase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
              <Database size={13} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supabase PostgreSQL Backend</span>
            </div>

            <div className="form-group">
              <label className="form-label">Supabase URL</label>
              <input 
                type="text" 
                placeholder={isEnvKey('supabaseUrl') ? 'Configured via VITE_SUPABASE_URL' : 'https://your-project-id.supabase.co'}
                value={isEnvKey('supabaseUrl') ? settings.supabaseUrl : (settings.supabaseUrl || '')}
                onChange={(e) => handleFieldChange('supabaseUrl', e.target.value)}
                disabled={isEnvKey('supabaseUrl')}
                readOnly={isEnvKey('supabaseUrl')}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', opacity: isEnvKey('supabaseUrl') ? 0.7 : 1 }}
              />
              {envSources.supabaseUrl === 'environment' && <EnvLockedHint />}
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Public Anon Key</label>
              <input 
                type="password" 
                placeholder={isEnvKey('supabaseAnonKey') ? 'Configured via VITE_SUPABASE_ANON_KEY' : 'Public anon key'}
                value={isEnvKey('supabaseAnonKey') ? '••••••••••••••••' : (settings.supabaseAnonKey || '')}
                onChange={(e) => handleFieldChange('supabaseAnonKey', e.target.value)}
                disabled={isEnvKey('supabaseAnonKey')}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', opacity: isEnvKey('supabaseAnonKey') ? 0.7 : 1 }}
              />
              {envSources.supabaseAnonKey === 'environment' && <EnvLockedHint />}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button 
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="btn btn-secondary"
                style={{ fontSize: '11px', height: '24px', flexGrow: 1 }}
              >
                {testing ? <RefreshCw size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={12} />}
                <span>Test Sync Endpoint</span>
              </button>
              
              <button 
                type="button"
                onClick={handleMigrate}
                disabled={migrating}
                className="btn btn-secondary"
                style={{ fontSize: '11px', height: '24px', flexGrow: 1 }}
              >
                {migrating ? <RefreshCw size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
                <span>Upload Local Data to SQL</span>
              </button>
            </div>

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

          {/* Other LLMs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
              <Key size={13} style={{ color: '#a78bfa' }} />
              <span style={{ fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Other AI Keys (Document Parser)</span>
            </div>

            <div className="form-group">
              <label className="form-label">Anthropic Claude API Key</label>
              <input 
                type="password" 
                placeholder={isEnvKey('claudeApiKey') ? 'Configured via VITE_ANTHROPIC_API_KEY' : 'Optional'}
                value={isEnvKey('claudeApiKey') ? '••••••••••••••••' : (settings.claudeApiKey || '')}
                onChange={(e) => handleFieldChange('claudeApiKey', e.target.value)}
                disabled={isEnvKey('claudeApiKey')}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', opacity: isEnvKey('claudeApiKey') ? 0.7 : 1 }}
              />
              {envSources.claudeApiKey === 'environment' && <EnvLockedHint />}
            </div>

            <div className="form-group">
              <label className="form-label">OpenAI API Key</label>
              <input 
                type="password" 
                placeholder={isEnvKey('openaiApiKey') ? 'Configured via VITE_OPENAI_API_KEY' : 'Optional'}
                value={isEnvKey('openaiApiKey') ? '••••••••••••••••' : (settings.openaiApiKey || '')}
                onChange={(e) => handleFieldChange('openaiApiKey', e.target.value)}
                disabled={isEnvKey('openaiApiKey')}
                className="form-input"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', opacity: isEnvKey('openaiApiKey') ? 0.7 : 1 }}
              />
              {envSources.openaiApiKey === 'environment' && <EnvLockedHint />}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            <span>Cancel</span>
          </button>
          <button type="button" onClick={handleSave} className="btn btn-primary">
            <span>Save Developer Configurations</span>
          </button>
        </div>

      </div>
    </div>
  );
}
