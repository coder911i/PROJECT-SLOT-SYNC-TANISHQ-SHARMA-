import { useState } from 'react';

const AVATAR_COLORS = ['#6C63FF', '#00E5A0', '#FF6B35'];

export default function EmptyScreen({ result, setScreen }) {
  const nearMissSlots = result?.slots?.filter(s => s.participationPercent > 0 && s.participationPercent < 60) || [];
  const hasConflicts = result?.conflictReport?.hasConflicts;
  const firstConflict = result?.conflictReport?.conflicts?.[0];

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>

      {/* Icon */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: '#1A1D27', border: '1px solid rgba(255,107,53,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px'
          }}>📅</div>
          <div style={{
            position: 'absolute', bottom: '4px', right: '4px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#FF6B35', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '16px',
            border: '2px solid #0F1117'
          }}>✕</div>
        </div>
      </div>

      <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>
        Couldn't find a perfect match
      </h1>
      <p style={{ color: '#8B8FA8', fontSize: '16px', marginBottom: '40px' }}>
        But here's what's closest to your criteria
      </p>

      {/* Near miss rows */}
      <div style={{ marginBottom: '24px' }}>
        {nearMissSlots.length > 0 ? nearMissSlots.map((slot, idx) => (
          <div key={idx} style={{
            background: '#1A1D27', borderRadius: '16px', padding: '16px 24px',
            marginBottom: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.04)',
            cursor: 'pointer', transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <span style={{
              background: '#2A2D3E', color: '#e2e2eb', fontWeight: 700,
              fontSize: '13px', padding: '8px 16px', borderRadius: '8px', letterSpacing: '0.3px'
            }}>{slot.dateLabel} • {slot.startTime}</span>

            <div style={{ display: 'flex' }}>
              {[...slot.availableInterviewers, ...slot.missingInterviewers].map((name, i) => (
                <div key={i} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: slot.missingInterviewers.includes(name) ? '#2A2D3E' : AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: slot.missingInterviewers.includes(name) ? '#555' : '#fff',
                  fontSize: '12px', fontWeight: 700,
                  marginLeft: i > 0 ? '-8px' : '0',
                  border: '2px solid #1A1D27',
                  opacity: slot.missingInterviewers.includes(name) ? 0.4 : 1,
                  textDecoration: slot.missingInterviewers.includes(name) ? 'line-through' : 'none'
                }}>{name[0].toUpperCase()}</div>
              ))}
            </div>
          </div>
        )) : (
          <>
            <div style={{
              background: '#1A1D27', borderRadius: '16px', padding: '16px 24px',
              marginBottom: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.04)',
              opacity: 0.5
            }}>
              <span style={{
                background: '#2A2D3E', color: '#8B8FA8', fontWeight: 700,
                fontSize: '13px', padding: '8px 16px', borderRadius: '8px', letterSpacing: '0.3px'
              }}>MON, OCT 12 • 09:30 AM</span>
              <div style={{ color: '#8B8FA8', fontSize: '13px' }}>No matches</div>
            </div>
            <div style={{
              background: '#1A1D27', borderRadius: '16px', padding: '16px 24px',
              marginBottom: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.04)',
              opacity: 0.5
            }}>
              <span style={{
                background: '#2A2D3E', color: '#8B8FA8', fontWeight: 700,
                fontSize: '13px', padding: '8px 16px', borderRadius: '8px', letterSpacing: '0.3px'
              }}>WED, OCT 14 • 02:00 PM</span>
              <div style={{ color: '#8B8FA8', fontSize: '13px' }}>No matches</div>
            </div>
          </>
        )}
      </div>

      {/* Suggestion card */}
      {hasConflicts && (
        <div style={{
          background: '#1A1D27', borderRadius: '16px', padding: '20px 24px',
          border: '1px solid rgba(255,255,255,0.04)',
          borderLeft: '3px solid #00E5A0',
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '40px', textAlign: 'left', cursor: 'pointer'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(0,229,160,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
          }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e2eb', marginBottom: '4px' }}>
              Remove{' '}
              <span style={{ color: '#00E5A0' }}>{firstConflict?.name}</span>
              {' '}to unlock 2 more slots
            </div>
            <div style={{ fontSize: '13px', color: '#8B8FA8' }}>
              {result?.conflictReport?.suggestion || 'They are out of office during your preferred window.'}
            </div>
          </div>
          <span style={{ color: '#00E5A0', fontSize: '18px', fontWeight: 700 }}>→</span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={() => setScreen('input')} style={{
          padding: '14px 40px', borderRadius: '999px',
          border: '2px solid #6C63FF', background: 'transparent',
          color: '#fff', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s'
        }}
        onMouseOver={e => { e.target.style.background = '#6C63FF'; }}
        onMouseOut={e => { e.target.style.background = 'transparent'; }}>
          TRY AGAIN
        </button>
        <button style={{
          background: 'none', border: 'none', color: '#8B8FA8',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          letterSpacing: '1px'
        }}>CANCEL SEARCH</button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
