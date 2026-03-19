import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function HistoryScreen({ setScreen, onLoadResult }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/history`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Position', 'Experience',
      'Status', 'Interview Date', 'Interview Time', 'Meeting Link',
      'Submitted Date', 'Skills', 'Score'
    ];
    
    const csvContent = [
      headers.join(','),
      ...history.map(item => [
        `"${item.candidateName || ''}"`,
        `"${item.candidateEmail || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.position || ''}"`,
        `"${item.experience || ''}"`,
        `"${item.status || ''}"`,
        `"${item.interviewDate || ''}"`,
        `"${item.interviewTime || ''}"`,
        `"${item.meetingLink || ''}"`,
        `"${new Date(item.submittedAt).toLocaleDateString()}"`,
        `"${item.skills || ''}"`,
        `"${item.score || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('History exported successfully');
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusColor = (status) => {
    if (status === 'confirmed') return '#10b981';
    if (status === 'rejected') return '#ef4444';
    return '#9ca3af';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#fff', minHeight: '100vh' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              marginBottom: '8px' 
            }}>
              History
            </h1>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '16px' 
            }}>
              View confirmed and rejected candidates
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'grid', 
          gap: '16px' 
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #374151',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <div style={{ 
                height: '16px', 
                background: '#374151', 
                borderRadius: '4px', 
                width: '40%', 
                marginBottom: '12px' 
              }} />
              <div style={{ 
                height: '12px', 
                background: '#374151', 
                borderRadius: '4px', 
                width: '60%', 
                marginBottom: '8px' 
              }} />
              <div style={{ 
                height: '12px', 
                background: '#374151', 
                borderRadius: '4px', 
                width: '50%' 
              }} />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes pulse { 
            0%, 100% { opacity: 0.5; } 
            50% { opacity: 0.8; } 
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', color: '#fff', minHeight: '100vh' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20, right: 20,
          background: '#10b981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          fontWeight: 500
        }}>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            marginBottom: '8px' 
          }}>
            History
          </h1>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '16px' 
          }}>
            View confirmed and rejected candidates
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            padding: '10px 20px',
            background: '#6c63ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #374151'
      }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              color: filter === tab.id ? '#fff' : '#9ca3af',
              borderBottom: filter === tab.id ? '2px solid #6c63ff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === tab.id ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: '#1f2937',
          borderRadius: '12px',
          border: '1px solid #374151'
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px' 
          }}>
            📋
          </div>
          <div style={{ 
            fontSize: '18px', 
            marginBottom: '8px',
            color: '#fff'
          }}>
            No history yet
          </div>
          <div style={{ 
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            {filter === 'all' 
              ? 'No candidates have been confirmed or rejected yet'
              : `No ${filter} candidates yet`
            }
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '16px' 
        }}>
          {filteredHistory.map(item => (
            <div key={item.id} style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #374151',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: '#fff'
                    }}>
                      {item.candidateName}
                    </div>
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '14px',
                      marginBottom: '2px'
                    }}>
                      {item.candidateEmail}
                    </div>
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}>
                      {item.position}
                    </div>
                  </div>
                  <span style={{
                    background: getStatusColor(item.status) + '22',
                    color: getStatusColor(item.status),
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: `1px solid ${getStatusColor(item.status)}44`
                  }}>
                    {item.status}
                  </span>
                </div>

                {item.status === 'confirmed' && (item.interviewDate || item.interviewTime) && (
                  <div style={{
                    background: '#10b98122',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    border: '1px solid #10b98144'
                  }}>
                    <div style={{ 
                      fontSize: '14px',
                      color: '#fff',
                      marginBottom: '4px'
                    }}>
                      <strong>Interview:</strong> {item.interviewDate} at {item.interviewTime}
                    </div>
                    {item.meetingLink && (
                      <div>
                        <a 
                          href={item.meetingLink}
                          style={{ 
                            color: '#6c63ff',
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join Meeting →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                  {item.skills && <span>Skills: {item.skills}</span>}
                  {item.score && <span>Score: {item.score}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
