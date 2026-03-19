import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';

const AVATAR_COLORS = ['#6C63FF', '#00E5A0', '#FF6B35', '#3B82F6', '#EC4899'];

function ProgressBar({ percent }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(percent), 300); }, [percent]);
  const color = percent === 100 ? '#00E5A0' : percent >= 80 ? '#6C63FF' : '#FF6B35';
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: '999px', transition: 'width 1s ease 0.3s' }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: '10px', color: '#8B8FA8', fontWeight: 600, letterSpacing: '0.5px', marginTop: '4px' }}>
        {percent === 100 ? `${percent}% PANEL PARTICIPATION` : `${percent}% PANEL PARTICIPATION`}
      </div>
    </div>
  );
}

export default function ResultsScreen({ result, sessionId, setScreen }) {
  const [conflictOpen, setConflictOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (!result || !result.slots) return null;

  const bestSlot = result.slots[0];

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          {['RK', 'RK'].map((init, i) => (
            <div key={i} style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00E5A0, #6C63FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '10px', fontWeight: 700
            }}>{init}</div>
          ))}
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{result.slots.length} slots found</h1>
        <p style={{ color: '#8B8FA8', fontSize: '16px' }}>We found the optimal windows for your project sync.</p>
      </div>

      {/* Slot Cards */}
      {result.slots.map((slot, idx) => (
        <div key={idx} style={{
          background: '#1A1D27', borderRadius: '20px', padding: '24px 28px',
          marginBottom: '16px', cursor: 'pointer',
          border: idx === 0 ? '1px solid rgba(196,192,255,0.2)' : '1px solid rgba(255,255,255,0.04)',
          boxShadow: idx === 0 ? '0 0 40px rgba(108,99,255,0.15)' : 'none',
          opacity: idx === 2 ? 0.7 : 1,
          animation: idx === 0 ? 'borderGlow 3s ease-in-out infinite' : 'none',
          transition: 'transform 0.2s, box-shadow 0.2s',
          position: 'relative'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>

          {idx === 0 && (
            <div style={{
              position: 'absolute', top: '-12px', left: '24px',
              background: '#00E5A0', color: '#003824', fontSize: '11px', fontWeight: 800,
              padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.5px'
            }}>✦ BEST MATCH</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: idx === 2 ? '#8B8FA8' : '#fff', marginBottom: '4px' }}>
                {slot.dateLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: idx === 2 ? '#6B6B9F' : '#6C63FF' }}>
                  {slot.startTime} — {slot.endTime}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#8B8FA8', marginTop: '6px', fontStyle: 'italic' }}>
                {slot.reason}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {slot.availableInterviewers.map((name, i) => (
                  <div key={i} style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '11px', fontWeight: 700,
                    marginLeft: i > 0 ? '-8px' : '0',
                    border: '2px solid #1A1D27', zIndex: slot.availableInterviewers.length - i
                  }}>{name[0].toUpperCase()}</div>
                ))}
                {slot.missingInterviewers.map((name, i) => (
                  <div key={`missing-${i}`} style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#2A2D3E', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#555', fontSize: '11px', fontWeight: 700,
                    marginLeft: '-8px', border: '2px solid #1A1D27',
                    textDecoration: 'line-through', opacity: 0.4
                  }}>{name[0].toUpperCase()}</div>
                ))}
              </div>
            </div>
          </div>

          <ProgressBar percent={slot.participationPercent} />
        </div>
      ))}

      {/* Conflict Details */}
      {result.conflictReport?.hasConflicts && (
        <div style={{ marginTop: '24px', background: '#1A1D27', borderRadius: '16px', overflow: 'hidden' }}>
          <button onClick={() => setConflictOpen(!conflictOpen)} style={{
            width: '100%', padding: '18px 24px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', color: '#e2e2eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Conflict Details ({result.conflictReport.conflicts.length})</span>
            </div>
            <span style={{ transform: conflictOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', fontSize: '16px', color: '#8B8FA8' }}>∨</span>
          </button>

          {conflictOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              {result.conflictReport.conflicts.map((c, i) => (
                <div key={i} style={{
                  background: '#111319', borderRadius: '12px', padding: '14px 16px',
                  marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(255,107,53,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                  }}>⚠️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e2eb', marginBottom: '4px' }}>{c.name}</div>
                    <div style={{ fontSize: '13px', color: '#8B8FA8' }}>{c.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button onClick={() => setShowModal(true)} style={{
          padding: '16px 48px', borderRadius: '999px', border: 'none',
          background: 'linear-gradient(135deg, #6C63FF, #8B87FF)', color: '#fff',
          fontSize: '16px', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(108,99,255,0.35)', transition: 'all 0.2s'
        }}
        onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
          Confirm Best Match
        </button>
        <div>
          <button onClick={() => setScreen('input')} style={{
            marginTop: '12px', background: 'none', border: 'none',
            color: '#8B8FA8', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline'
          }}>Regenerate options</button>
        </div>
      </div>

      {showModal && (
        <ConfirmModal 
          sessionId={sessionId} 
          selectedSlot={bestSlot}
          onClose={() => setShowModal(false)}
          onSuccess={() => setScreen('history')}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(108,99,255,0.15); }
          50% { box-shadow: 0 0 40px rgba(108,99,255,0.35); }
        }
      `}</style>
    </div>
  );
}
