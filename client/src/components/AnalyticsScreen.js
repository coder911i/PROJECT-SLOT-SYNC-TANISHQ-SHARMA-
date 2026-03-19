import { useState, useEffect } from 'react';
import { getAnalytics } from '../api';

export default function AnalyticsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const analytics = await getAnalytics();
      setData(analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    setLoading(false);
  };

  const statCards = [
    { icon: '📅', label: 'Total Sessions', value: data?.totalSessions || 0, color: '#6C63FF' },
    { icon: '✓', label: 'Confirmed Interviews', value: data?.confirmedSessions || 0, color: '#00E5A0' },
    { icon: '⭐', label: 'Perfect Matches', value: data?.perfectMatches || 0, color: '#FF6B35' },
    { icon: '📊', label: 'Avg Panel Participation', value: `${data?.avgParticipation || 0}%`, color: '#3B82F6' },
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '24px' }}>Analytics</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#1A1D27', borderRadius: '16px', padding: '24px', opacity: 0.5,
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <div style={{ height: '16px', background: '#2A2D3E', borderRadius: '4px', width: '40%', marginBottom: '16px' }} />
              <div style={{ height: '48px', background: '#2A2D3E', borderRadius: '4px', width: '60%' }} />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '24px' }}>Analytics</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {statCards.map((card, idx) => (
          <div key={idx} style={{
            background: '#1A1D27', borderRadius: '16px', padding: '24px',
            border: '1px solid rgba(255,255,255,0.04)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: `${card.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', marginBottom: '12px'
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '14px', color: '#8B8FA8' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
