import { useState } from 'react';

export default function AutomationsScreen() {
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [zapierUrl, setZapierUrl] = useState(localStorage.getItem('zapier_webhook_url') || '');

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleZapierUrlChange = (e) => {
    const url = e.target.value;
    setZapierUrl(url);
    localStorage.setItem('zapier_webhook_url', url);
  };

  const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  const automations = [
    {
      id: 1,
      icon: '🔍',
      title: 'Auto-Screen Candidates',
      description: 'When a candidate fills your Google Form / Typeform, SlotSync auto-screens them and emails results to your hiring manager.',
      status: 'Active',
      statusColor: '#00E5A0',
      url: `${BASE_URL}/api/webhooks/screen-candidate`,
      borderColor: '#6C63FF',
      steps: [
        'Copy the webhook URL above',
        'Zapier: Trigger = Google Forms → New Response',
        'Action = Webhooks by Zapier → POST → paste URL',
        'Map fields: candidateName, candidateEmail, availability, role, experience, skills',
        'Action = Gmail → Send Email → use {{emailBody}} field'
      ]
    },
    {
      id: 2,
      icon: '📅',
      title: 'Auto-Notify on Confirmation',
      description: 'When you confirm an interview in SlotSync, candidate and all interviewers are emailed automatically via Zapier.',
      status: zapierUrl ? 'Active' : 'Not Configured',
      statusColor: zapierUrl ? '#00E5A0' : '#8B8FA8',
      url: zapierUrl,
      borderColor: '#00E5A0',
      isInput: true,
      inputLabel: 'Paste your Zapier Catch Hook URL:',
      steps: [
        'Zapier: Trigger = Webhooks by Zapier → Catch Hook',
        'Copy Zapier\'s webhook URL → paste above',
        'Add to server/.env: ZAPIER_INTERVIEW_CONFIRMED_WEBHOOK=your_url',
        'Restart server',
        'Action = Gmail → Send Email to candidate using {{candidateEmailBody}}',
        'Action = Gmail → Send Email to manager using {{managerEmailBody}}'
      ]
    },
    {
      id: 3,
      icon: '⏰',
      title: 'Daily Interview Reminders',
      description: 'Every morning at 8 AM, everyone with an interview today gets an automatic reminder. Zero manual work.',
      status: 'Active',
      statusColor: '#00E5A0',
      url: `${BASE_URL}/api/automations/daily-reminders`,
      borderColor: '#FF6B35',
      steps: [
        'Zapier: Trigger = Schedule → Every Day → 8:00 AM',
        'Action = Webhooks by Zapier → GET → paste endpoint URL',
        'Action = Looping by Zapier → loop over {{interviews}}',
        'Action = Gmail → Send to {{candidateEmail}} using {{candidateReminderBody}}',
        'Action = Gmail → Send to interviewers using {{interviewerReminderBody}}'
      ]
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Automations</h1>
      <p style={{ color: '#8B8FA8', marginBottom: '32px' }}>Connect SlotSync with Zapier to automate your workflow</p>

      {automations.map(auto => (
        <div key={auto.id} style={{
          background: '#1A1D27', borderRadius: '20px', padding: '28px',
          border: '1px solid rgba(255,255,255,0.04)',
          borderLeft: `3px solid ${auto.borderColor}`,
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `${auto.borderColor}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0
            }}>
              {auto.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{auto.title}</h3>
                <span style={{
                  padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                  background: `${auto.statusColor}20`, color: auto.statusColor
                }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: auto.statusColor, marginRight: '4px', animation: auto.statusColor === '#00E5A0' ? 'pulse 2s infinite' : 'none' }} />
                  {auto.status}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#8B8FA8', lineHeight: 1.5 }}>{auto.description}</p>
            </div>
          </div>

          {auto.isInput ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#c4c0ff', display: 'block', marginBottom: '8px' }}>
                {auto.inputLabel}
              </label>
              <input
                value={zapierUrl}
                onChange={handleZapierUrlChange}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                  background: '#F8F9FF', fontSize: '13px', color: '#1A1D27', outline: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>
          ) : (
            <div style={{
              background: '#111319', borderRadius: '10px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <code style={{ fontSize: '13px', color: '#c4c0ff', fontFamily: 'monospace' }}>
                {auto.url}
              </code>
              <button onClick={() => handleCopy(auto.url, auto.id)} style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none',
                background: copiedUrl === auto.id ? '#00E5A0' : '#6C63FF', color: '#fff',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                {copiedUrl === auto.id ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          )}

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', marginBottom: '12px', letterSpacing: '0.5px' }}>
              SETUP STEPS
            </div>
            <ol style={{ margin: 0, padding: '0 0 0 20px', color: '#e2e2eb', fontSize: '14px', lineHeight: 1.8 }}>
              {auto.steps.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
              ))}
            </ol>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            {!auto.isInput && (
              <button onClick={() => handleCopy(auto.url, auto.id)} style={{
                padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #6C63FF',
                background: 'transparent', color: '#fff', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer'
              }}>
                {copiedUrl === auto.id ? 'Copied!' : 'Copy URL'}
              </button>
            )}
            <button onClick={() => window.open('https://zapier.com', '_blank')} style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#6C63FF', color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer'
            }}>
              Open Zapier →
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
