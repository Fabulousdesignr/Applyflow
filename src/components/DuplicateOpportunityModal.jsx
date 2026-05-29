import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Shared duplicate resolution: Skip | Update | Merge
 */
export default function DuplicateOpportunityModal({
  isOpen,
  companyName,
  roleTitle,
  onSkip,
  onUpdate,
  onMerge,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 300 }} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
            <AlertTriangle size={16} />
            <span>Opportunity Already Exists</span>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            A record already exists for{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{companyName}</strong>
            {' — '}
            <strong style={{ color: 'var(--text-primary)' }}>{roleTitle}</strong>.
          </p>
        </div>
        <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
          <button type="button" onClick={onSkip} className="btn btn-secondary">
            <span>Skip</span>
          </button>
          <button type="button" onClick={onMerge} className="btn btn-secondary">
            <span>Merge</span>
          </button>
          <button type="button" onClick={onUpdate} className="btn btn-primary">
            <span>Update</span>
          </button>
        </div>
      </div>
    </div>
  );
}
