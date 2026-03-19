export default function Sidebar({ screen, setScreen }) {
  const navItems = [
    { id: 'input', label: 'Input', icon: '✦' },
    { id: 'results', label: 'Results', icon: '✦' },
    { id: 'history', label: 'History', icon: '🕐' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'automations', label: 'Automations', icon: '⚡' },
  ];

  return (
    <aside style={{
      position: 'fixed', left: 0, top: '56px', bottom: 0, width: '220px',
      background: '#0F1117', borderRight: '1px solid rgba(108,99,255,0.1)',
      display: 'flex', flexDirection: 'column', padding: '16px 12px',
      justifyContent: 'space-between'
    }}>
      <div>
        <button onClick={() => setScreen('input')} style={{
          width: '100%', padding: '10px', borderRadius: '999px', border: 'none',
          background: 'linear-gradient(135deg, #6C63FF, #8B87FF)', color: '#fff',
          fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '24px'
        }}>+ New Sync</button>

        <div style={{ fontSize: '11px', color: '#8B8FA8', fontWeight: 600, letterSpacing: '1px', padding: '0 8px', marginBottom: '8px' }}>AI SCHEDULER</div>

        {navItems.map(item => (
          <div key={item.id} onClick={() => item.id !== 'results' && setScreen(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
              marginBottom: '4px',
              background: screen === item.id ? 'rgba(108,99,255,0.15)' : 'transparent',
              color: screen === item.id ? '#c4c0ff' : '#8B8FA8',
              fontWeight: screen === item.id ? 600 : 400, fontSize: '14px',
              transition: 'all 0.2s'
            }}>
            <span style={{ fontSize: '12px' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      <div>
        {['Support', 'Docs'].map(label => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
            color: '#8B8FA8', fontSize: '14px', marginBottom: '4px'
          }}>
            <span>{label === 'Support' ? '❓' : '📄'}</span>
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}
