export default function Navbar() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
      background: '#0F1117', borderBottom: '1px solid rgba(108,99,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>SlotSync</span>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: '#8B8FA8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Dashboard</a>
          <a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, borderBottom: '2px solid #6C63FF', paddingBottom: '2px' }}>Workflows</a>
          <a href="#" style={{ color: '#8B8FA8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>History</a>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#8B8FA8', fontSize: '20px', cursor: 'pointer' }}>🔔</span>
        <span style={{ color: '#8B8FA8', fontSize: '20px', cursor: 'pointer' }}>⚙️</span>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C63FF, #00E5A0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer'
        }}>RK</div>
      </div>
    </header>
  );
}
