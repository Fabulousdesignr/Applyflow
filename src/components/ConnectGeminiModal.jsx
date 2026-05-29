import React from 'react';
import { Key, X } from 'lucide-react';

export default function ConnectGeminiModal({ isOpen, onClose, onOpenSettings }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 300 }} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>Connect Gemini API Key</span>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Connect your Gemini API key first. Set <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>VITE_GEMINI_API_KEY</code> in <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>.env.local</code>, or add it in Settings.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="btn btn-primary"
          >
            <span>Open Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
