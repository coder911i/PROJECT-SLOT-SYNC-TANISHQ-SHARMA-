import { useState } from 'react';
import { confirmInterview } from '../api';

export default function ConfirmModal({ sessionId, selectedSlot, onClose, onSuccess }) {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleConfirm = async () => {
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setToast({ type: 'error', message: 'Please fill in all fields' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      await confirmInterview(sessionId, selectedSlot, candidateName, candidateEmail);
      setToast({ type: 'success', message: '✓ Interview confirmed! Notifications sent automatically.' });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to confirm. Please try again.' });
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }} onClick={onClose}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '32px', width: '480px', maxWidth: '90%'
        }} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1D27', marginBottom: '8px' }}>
            Confirm Interview
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
            Confirming: <span style={{ color: '#6C63FF', fontWeight: 600 }}>{selectedSlot?.dateLabel} at {selectedSlot?.startTime}</span>
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Candidate Name *
            </label>
            <input
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                background: '#F8F9FF', fontSize: '14px', color: '#1A1D27', outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Candidate Email *
            </label>
            <input
              type="email"
              value={candidateEmail}
              onChange={e => setCandidateEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                background: '#F8F9FF', fontSize: '14px', color: '#1A1D27', outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleConfirm} disabled={loading} style={{
              flex: 1, padding: '14px', borderRadius: '999px', border: 'none',
              background: 'linear-gradient(135deg, #6C63FF, #8B87FF)', color: '#fff',
              fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Confirming...' : 'Confirm & Send Notifications'}
            </button>
            <button onClick={onClose} style={{
              padding: '14px 24px', borderRadius: '999px', border: '1.5px solid #E5E7EB',
              background: 'transparent', color: '#6B7280', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
