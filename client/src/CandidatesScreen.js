import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL 
  || 'http://localhost:4000/api';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  rejected: '#ef4444'
};

export default function CandidatesScreen() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    interviewDate: '',
    interviewTime: '',
    meetingLink: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API}/candidates`);
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(
      fetchCandidates, 30000
    );
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleConfirm = async () => {
    if (!form.interviewDate || 
        !form.interviewTime || 
        !form.meetingLink) {
      alert('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API}/schedule/confirm`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            candidateId: modal.id,
            ...form
          })
        }
      );
      if (res.ok) {
        showToast(
          'Interview confirmed! Emails sent.'
        );
        setModal(null);
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(
      'Reject this candidate?'
    )) return;
    try {
      await fetch(
        `${API}/candidates/${id}/status`,
        {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            status: 'rejected' 
          })
        }
      );
      showToast('Candidate rejected');
      fetchCandidates();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = candidates.filter(c => {
    const matchFilter = filter === 'all' 
      || c.status === filter;
    const matchSearch = 
      c.candidateName?.toLowerCase()
        .includes(search.toLowerCase()) ||
      c.position?.toLowerCase()
        .includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    total: candidates.length,
    pending: candidates.filter(
      c => c.status === 'pending'
    ).length,
    confirmed: candidates.filter(
      c => c.status === 'confirmed'
    ).length,
    rejected: candidates.filter(
      c => c.status === 'rejected'
    ).length
  };

  return (
    <div style={{ 
      padding: '24px', 
      color: '#fff',
      minHeight: '100vh'
    }}>
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

      <h1 style={{ 
        fontSize: '28px', 
        marginBottom: '8px' 
      }}>
        Candidates
      </h1>
      <p style={{ 
        color: '#9ca3af', 
        marginBottom: '24px' 
      }}>
        All candidates who submitted the form
      </p>

      {/* Stats Row */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { label:'Total', 
            value: counts.total, 
            color:'#6c63ff' },
          { label:'Pending', 
            value: counts.pending, 
            color:'#f59e0b' },
          { label:'Confirmed', 
            value: counts.confirmed, 
            color:'#10b981' },
          { label:'Rejected', 
            value: counts.rejected, 
            color:'#ef4444' }
        ].map(s => (
          <div key={s.label} style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '16px 24px',
            minWidth: '120px',
            textAlign: 'center',
            border: `1px solid ${s.color}33` 
          }}>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: s.color 
            }}>
              {s.value}
            </div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '13px',
              marginTop: '4px'
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          placeholder="Search by name or position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#fff',
            fontSize: '14px'
          }}
        />
        {['all','pending','confirmed','rejected']
          .map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: filter === f 
                ? '#6c63ff' : '#1f2937',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              textTransform: 'capitalize',
              fontWeight: filter === f ? 600 : 400
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Candidates List */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          color: '#9ca3af' 
        }}>
          Loading candidates...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: '#9ca3af',
          background: '#1f2937',
          borderRadius: '12px'
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px' 
          }}>
            👥
          </div>
          <div style={{ fontSize: '18px' }}>
            No candidates yet
          </div>
          <div style={{ 
            fontSize: '14px',
            marginTop: '8px'
          }}>
            Candidates will appear here 
            after filling the Google Form
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
          {filtered.map(c => (
            <div key={c.id} style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #374151'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 700,
                    marginBottom: '4px'
                  }}>
                    {c.candidateName}
                  </div>
                  <div style={{ 
                    color: '#9ca3af', 
                    fontSize: '14px',
                    marginBottom: '2px'
                  }}>
                    {c.candidateEmail}
                  </div>
                  <div style={{ 
                    color: '#9ca3af', 
                    fontSize: '14px' 
                  }}>
                    {c.phone}
                  </div>
                </div>
                <span style={{
                  background: STATUS_COLORS[
                    c.status
                  ] + '22',
                  color: STATUS_COLORS[c.status],
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: `1px solid ${
                    STATUS_COLORS[c.status]
                  }44`
                }}>
                  {c.status}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 
                  'repeat(auto-fit,minmax(200px,1fr))',
                gap: '8px',
                margin: '16px 0',
                padding: '16px',
                background: '#111827',
                borderRadius: '8px'
              }}>
                {[
                  ['Position', c.position],
                  ['Experience', c.experience],
                  ['Preferred Date', c.availability],
                  ['Time Slot', c.preferredTime],
                  ['Mode', c.interviewMode],
                  ['Location', c.location]
                ].map(([label, value]) => value && (
                  <div key={label}>
                    <div style={{ 
                      color: '#6b7280', 
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {label}
                    </div>
                    <div style={{ 
                      color: '#e5e7eb', 
                      fontSize: '14px',
                      marginTop: '2px'
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {c.status === 'confirmed' && (
                <div style={{
                  padding: '12px 16px',
                  background: '#10b98122',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid #10b98144',
                  fontSize: '14px'
                }}>
                  <b>Interview:</b> {c.interviewDate}
                  {' '}at {c.interviewTime}
                  {c.meetingLink && (
                    <> — <a 
                      href={c.meetingLink}
                      style={{ color: '#6c63ff' }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join Meeting
                    </a></>
                  )}
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: '8px' 
              }}>
                {c.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setModal(c)}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Confirm Interview
                    </button>
                    <button
                      onClick={() => 
                        handleReject(c.id)
                      }
                      style={{
                        padding: '8px 16px',
                        background: '#ef444422',
                        color: '#ef4444',
                        border: '1px solid #ef444444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
                <div style={{ 
                  marginLeft: 'auto',
                  color: '#6b7280', 
                  fontSize: '12px',
                  alignSelf: 'center'
                }}>
                  Submitted: {new Date(
                    c.submittedAt
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {modal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            border: '1px solid #374151'
          }}>
            <h2 style={{ 
              marginBottom: '8px',
              fontSize: '20px'
            }}>
              Confirm Interview
            </h2>
            <p style={{ 
              color: '#9ca3af', 
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              for {modal.candidateName}
            </p>

            {[
              { label: 'Interview Date', 
                key: 'interviewDate', 
                type: 'date' },
              { label: 'Interview Time', 
                key: 'interviewTime', 
                type: 'time' },
              { label: 'Meeting Link', 
                key: 'meetingLink', 
                type: 'url',
                placeholder: 
                  'https://meet.google.com/...' }
            ].map(field => (
              <div key={field.key} 
                   style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    [field.key]: e.target.value
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    background: '#111827',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            <div style={{ 
              display: 'flex', 
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6c63ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting 
                    ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting 
                  ? 'Sending...' 
                  : 'Confirm & Send Emails'}
              </button>
              <button
                onClick={() => setModal(null)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
