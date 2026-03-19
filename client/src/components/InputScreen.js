import { useState } from 'react';
import { scheduleInterview } from '../api';

const AVATAR_COLORS = ['#6C63FF', '#00E5A0', '#FF6B35', '#3B82F6', '#EC4899'];

const DEFAULT_INTERVIEWERS = [
  { id: 1, name: 'Arjun', availability: 'Tue 3–6 PM, Wed 2–5 PM' },
  { id: 2, name: 'Priya', availability: 'Tue 1–4 PM, Thu 3–5 PM' },
  { id: 3, name: 'Dev', availability: 'Wed 10 AM–1 PM, Fri 11 AM–2 PM' },
];

export default function InputScreen({ setScreen, onResult }) {
  const [tab, setTab] = useState('candidate');
  const [candidateName, setCandidateName] = useState('');
  const [candidateAvail, setCandidateAvail] = useState('Tue–Thu 2–5 PM, Fri 9 AM–12 PM');
  const [interviewers, setInterviewers] = useState(DEFAULT_INTERVIEWERS);
  const [focusedTextarea, setFocusedTextarea] = useState(null);
  const [error, setError] = useState('');

  const addInterviewer = () => {
    if (interviewers.length >= 5) return;
    setInterviewers([...interviewers, { id: Date.now(), name: '', availability: '' }]);
  };

  const removeInterviewer = (id) => setInterviewers(interviewers.filter(i => i.id !== id));

  const updateInterviewer = (id, field, value) => {
    setInterviewers(interviewers.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleFindSlots = async () => {
    setError('');
    const hasCandidate = candidateAvail.trim();
    const hasInterviewers = interviewers.some(i => i.name && i.availability);
    if (!hasCandidate || !hasInterviewers) {
      setError('Please fill in candidate availability and at least one interviewer');
      return;
    }
    
    setScreen('loading');
    try {
      const data = await scheduleInterview(candidateName, candidateAvail, interviewers);
      onResult(data.result, data.sessionId);
    } catch (err) {
      setScreen('input');
      setError('Failed to schedule. Please try again.');
    }
  };

  const textareaStyle = (id) => ({
    width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${focusedTextarea === id ? '#6C63FF' : '#e5e7eb'}`,
    background: '#F8F9FF', color: '#1A1D27', fontSize: '14px', resize: 'vertical',
    minHeight: '80px', outline: 'none', fontFamily: 'Inter, sans-serif',
    boxShadow: focusedTextarea === id ? '0 0 0 3px rgba(108,99,255,0.1)' : 'none',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', gap: '60px', alignItems: 'center', minHeight: 'calc(100vh - 136px)', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Left panel */}
      <div style={{ flex: '0 0 38%', position: 'relative' }}>
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.3), rgba(0,229,160,0.2))',
          filter: 'blur(80px)', top: '-60px', left: '-40px', zIndex: 0, pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '13px', color: '#6C63FF', fontWeight: 600, letterSpacing: '1px', marginBottom: '12px' }}>AI SCHEDULER</div>
          <h1 style={{ fontSize: '52px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
            Who's<br />available?
          </h1>
          <p style={{ fontSize: '16px', color: '#8B8FA8', lineHeight: 1.6, maxWidth: '320px' }}>
            Drop in availability. We'll find the perfect slot in seconds.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            {['Fast', 'Smart', 'Conflict-free'].map(tag => (
              <span key={tag} style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(108,99,255,0.12)', color: '#c4c0ff', border: '1px solid rgba(108,99,255,0.2)'
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right card */}
      <div style={{
        flex: 1, background: '#fff', borderRadius: '24px',
        padding: '32px', boxShadow: '0 40px 80px rgba(0,0,0,0.4)'
      }}>
        
        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#F3F4F6', borderRadius: '999px',
          padding: '4px', marginBottom: '28px'
        }}>
          {['candidate', 'interviewers'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              background: tab === t ? '#6C63FF' : 'transparent',
              color: tab === t ? '#fff' : '#6B7280', fontWeight: 600, fontSize: '14px',
              transition: 'all 0.2s', textTransform: 'capitalize'
            }}>
              {t === 'candidate' ? 'Candidate' : 'Interviewers'}
            </button>
          ))}
        </div>

        {/* Candidate Tab */}
        {tab === 'candidate' && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
              Candidate Name
            </label>
            <input
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB',
                background: '#F8F9FF', fontSize: '14px', color: '#1A1D27',
                outline: 'none', marginBottom: '16px', fontFamily: 'Inter, sans-serif',
                boxShadow: 'none'
              }}
            />
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
              Candidate Availability
            </label>
            <textarea
              value={candidateAvail}
              onChange={e => setCandidateAvail(e.target.value)}
              onFocus={() => setFocusedTextarea('candidate')}
              onBlur={() => setFocusedTextarea(null)}
              placeholder="e.g. Tue–Thu 2–5 PM, Fri 9 AM–12 PM"
              style={{ ...textareaStyle('candidate'), minHeight: '120px' }}
            />
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
              Use formats like "Mon–Wed 2–5 PM" or "Fri 9 AM–12 PM, 3–6 PM"
            </p>
          </div>
        )}

        {/* Interviewers Tab */}
        {tab === 'interviewers' && (
          <div>
            {interviewers.map((interviewer, idx) => (
              <div key={interviewer.id} style={{
                display: 'flex', gap: '12px', marginBottom: '16px',
                padding: '14px', background: '#F9FAFB', borderRadius: '12px', alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '13px', marginTop: '2px'
                }}>
                  {interviewer.name ? interviewer.name[0].toUpperCase() : (idx + 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    value={interviewer.name}
                    onChange={e => updateInterviewer(interviewer.id, 'name', e.target.value)}
                    placeholder="Interviewer name"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB',
                      background: '#fff', fontSize: '13px', fontWeight: 600, color: '#1A1D27',
                      outline: 'none', marginBottom: '8px', fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <textarea
                    value={interviewer.availability}
                    onChange={e => updateInterviewer(interviewer.id, 'availability', e.target.value)}
                    onFocus={() => setFocusedTextarea(interviewer.id)}
                    onBlur={() => setFocusedTextarea(null)}
                    placeholder="e.g. Tue 3–6 PM, Wed 2–5 PM"
                    style={textareaStyle(interviewer.id)}
                  />
                </div>
                <button onClick={() => removeInterviewer(interviewer.id)} style={{
                  background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
                  fontSize: '18px', padding: '4px', borderRadius: '6px', flexShrink: 0,
                  transition: 'color 0.2s'
                }} onMouseOver={e => e.target.style.color = '#EF4444'}
                   onMouseOut={e => e.target.style.color = '#9CA3AF'}>✕</button>
              </div>
            ))}

            {interviewers.length < 5 && (
              <button onClick={addInterviewer} style={{
                width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px dashed #D1D5DB',
                background: 'transparent', color: '#6B7280', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.color = '#6C63FF'; }}
              onMouseOut={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.color = '#6B7280'; }}>
                + Add Interviewer
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* CTA Button */}
        <button onClick={handleFindSlots} style={{
          width: '100%', marginTop: '28px', padding: '16px', borderRadius: '999px', border: 'none',
          background: 'linear-gradient(135deg, #6C63FF, #00E5A0)', color: '#fff',
          fontSize: '16px', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(108,99,255,0.35)', transition: 'all 0.2s',
          letterSpacing: '0.3px'
        }}
        onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
          ✦ Find Best Slots →
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
