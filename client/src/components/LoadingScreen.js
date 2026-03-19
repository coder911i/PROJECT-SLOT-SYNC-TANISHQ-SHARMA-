import { useState, useEffect } from 'react';

const MESSAGES = [
  'Parsing availability...',
  'Finding overlaps...',
  'Resolving conflicts...',
  'Ranking slots...'
];

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % MESSAGES.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 136px)', animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6C63FF, #8B87FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '32px'
      }}>
        <span style={{ fontSize: '48px', color: '#fff' }}>✦</span>
      </div>
      <p style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
        {MESSAGES[messageIndex]}
      </p>
      <p style={{ fontSize: '14px', color: '#8B8FA8' }}>
        This takes less than a second
      </p>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
