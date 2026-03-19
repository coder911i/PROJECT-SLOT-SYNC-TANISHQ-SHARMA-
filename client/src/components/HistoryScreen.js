import { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../api';

export default function HistoryScreen({ setScreen, onLoadResult }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSession(id);
      loadSessions();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleView = (session) => {
    onLoadResult({
      slots: session.slots || [],
      conflictReport: session.conflictReport
    }, session.id);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    if (status === 'confirmed') return '#00E5A0';
    if (status === 'completed') return '#6C63FF';
    return '#8B8FA8';
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '24px' }}>History</h1>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#1A1D27', borderRadius: '16px', padding: '20px 24px',
            marginBottom: '12px', opacity: 0.5,
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <div style={{ height: '20px', background: '#2A2D3E', borderRadius: '4px', width: '60%', marginBottom: '8px' }} />
            <div style={{ height: '14px', background: '#2A2D3E', borderRadius: '4px', width: '40%' }} />
          </div>
        ))}
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No sessions yet</h2>
        <p style={{ color: '#8B8FA8', marginBottom: '24px' }}>Create your first interview scheduling session</p>
        <button onClick={() => setScreen('input')} style={{
          padding: '12px 24px', borderRadius: '999px', border: 'none',
          background: 'linear-gradient(135deg, #6C63FF, #8B87FF)', color: '#fff',
          fontSize: '14px', fontWeight: 700, cursor: 'pointer'
        }}>
          Create your first one →
        </button>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '24px' }}>History</h1>
      
      {sessions.map(session => (
        <div key={session.id} style={{
          background: '#1A1D27', borderRadius: '16px', padding: '20px 24px',
          marginBottom: '12px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              {session.candidate_name || 'Candidate'}
            </div>
            <div style={{ fontSize: '13px', color: '#8B8FA8' }}>
              {formatDate(session.created_at)} • {(session.slots || []).length} slots found
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              background: 'rgba(255,255,255,0.08)', color: getStatusColor(session.status)
            }}>
              {session.status}
            </span>
            <button onClick={() => handleView(session)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: '#6C63FF', color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer'
            }}>
              View
            </button>
            <button onClick={() => handleDelete(session.id)} style={{
              padding: '8px', borderRadius: '8px', border: 'none',
              background: 'transparent', color: '#8B8FA8', fontSize: '16px',
              cursor: 'pointer'
            }}>
              ✕
            </button>
          </div>
        </div>
      ))}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
