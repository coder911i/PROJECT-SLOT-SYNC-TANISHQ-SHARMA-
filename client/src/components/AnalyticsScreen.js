import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function AnalyticsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics`);
      const analytics = await res.json();
      setData(analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    setLoading(false);
  };

  const statCards = [
    { 
      icon: '👥', 
      label: 'Total Candidates', 
      value: data?.totalCandidates || 0, 
      color: '#6c63ff' 
    },
    { 
      icon: '✅', 
      label: 'Confirmed', 
      value: data?.confirmedCount || 0, 
      color: '#10b981' 
    },
    { 
      icon: '⏳', 
      label: 'Pending', 
      value: data?.pendingCount || 0, 
      color: '#f59e0b' 
    },
    { 
      icon: '❌', 
      label: 'Rejected', 
      value: data?.rejectedCount || 0, 
      color: '#ef4444' 
    },
    { 
      icon: '📈', 
      label: 'Confirmation Rate', 
      value: `${data?.confirmationRate || 0}%`, 
      color: '#3b82f6' 
    },
    { 
      icon: '📅', 
      label: "Today's Interviews", 
      value: data?.todayInterviews || 0, 
      color: '#f97316' 
    }
  ];

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
              Analytics
            </h1>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '16px' 
            }}>
              Track your recruitment metrics
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
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
                width: '60%', 
                marginBottom: '12px' 
              }} />
              <div style={{ 
                height: '32px', 
                background: '#374151', 
                borderRadius: '4px', 
                width: '40%' 
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
            Analytics
          </h1>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '16px' 
          }}>
            Track your recruitment metrics
          </p>
        </div>
        <button
          onClick={loadAnalytics}
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
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {statCards.map((card, index) => (
          <div key={index} style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #374151',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ 
              fontSize: '24px', 
              marginBottom: '8px',
              opacity: 0.8
            }}>
              {card.icon}
            </div>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: card.color,
              marginBottom: '4px'
            }}>
              {card.value}
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Top Positions */}
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #374151'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600,
            marginBottom: '16px',
            color: '#fff'
          }}>
            Top Positions
          </h3>
          {data?.topPositions?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.topPositions.map((pos, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#111827',
                  borderRadius: '8px'
                }}>
                  <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                    {pos.position}
                  </span>
                  <span style={{
                    background: '#6c63ff22',
                    color: '#6c63ff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {pos.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              No position data yet
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #374151'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600,
            marginBottom: '16px',
            color: '#fff'
          }}>
            Recent Activity
          </h3>
          {data?.recentActivity?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.recentActivity.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#111827',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ color: '#e5e7eb', fontSize: '14px', marginBottom: '2px' }}>
                      {activity.candidateName}
                    </div>
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '12px' 
                    }}>
                      {new Date(activity.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    background: activity.status === 'confirmed' ? '#10b98122' : 
                               activity.status === 'rejected' ? '#ef444422' : '#f59e0b22',
                    color: activity.status === 'confirmed' ? '#10b981' : 
                           activity.status === 'rejected' ? '#ef4444' : '#f59e0b',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
