import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function ResultsScreen({ result, sessionId, setScreen }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmForm, setConfirmForm] = useState({
    interviewDate: '',
    interviewTime: '',
    meetingLink: ''
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    // Auto-populate confirm form if we have slot data
    if (result && result.slots && result.slots.length > 0) {
      const firstSlot = result.slots[0];
      setConfirmForm({
        interviewDate: firstSlot.date || '',
        interviewTime: firstSlot.startTime || '',
        meetingLink: ''
      });
    }
  }, [result]);

  if (!result || !result.slots) {
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
              Best Slots
            </h1>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '16px' 
            }}>
              No slots found
            </p>
          </div>
          <button
            onClick={() => setScreen('input')}
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
            Back
          </button>
        </div>
        
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
            🔍
          </div>
          <div style={{ 
            fontSize: '18px', 
            marginBottom: '8px',
            color: '#fff'
          }}>
            No matching slots found
          </div>
          <div style={{ 
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '24px'
          }}>
            Try adding more availability or checking different dates
          </div>
          <button
            onClick={() => setScreen('input')}
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
            Add More Availability
          </button>
        </div>
      </div>
    );
  }

  const getMatchQuality = (score) => {
    if (score >= 90) return { text: 'Perfect Match', color: '#10b981' };
    if (score >= 70) return { text: 'Good Match', color: '#f59e0b' };
    return { text: 'Fair Match', color: '#f97316' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const handleBookSlot = (slot) => {
    setModal(slot);
    setConfirmForm({
      interviewDate: slot.date || '',
      interviewTime: slot.startTime || '',
      meetingLink: ''
    });
  };

  const handleConfirmBooking = async () => {
    if (!confirmForm.interviewDate || !confirmForm.interviewTime || !confirmForm.meetingLink) {
      showToast('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/schedule/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: modal.candidateId || 1, // This would come from the slot data
          interviewDate: confirmForm.interviewDate,
          interviewTime: confirmForm.interviewTime,
          meetingLink: confirmForm.meetingLink
        })
      });

      if (res.ok) {
        showToast('Interview confirmed! Emails sent.');
        setModal(null);
        setScreen('candidates');
      } else {
        showToast('Failed to confirm booking');
      }
    } catch (err) {
      console.error(err);
      showToast('Error confirming booking');
    } finally {
      setLoading(false);
    }
  };

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
            Best Slots for {result.candidateName || 'Candidate'}
          </h1>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '16px' 
          }}>
            Found {result.slots.length} matching time slots
          </p>
        </div>
        <button
          onClick={() => setScreen('input')}
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
          Back
        </button>
      </div>

      {/* Slot Cards */}
      <div style={{ 
        display: 'grid', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        {result.slots.map((slot, index) => {
          const quality = getMatchQuality(slot.score || 75);
          return (
            <div key={index} style={{
              background: '#1f2937',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #374151',
              position: 'relative'
            }}>
              {/* Slot Number Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '24px',
                background: '#6c63ff',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 700
              }}>
                Slot {index + 1}
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto',
                gap: '24px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#fff'
                  }}>
                    {formatDate(slot.date)}
                  </div>
                  <div style={{ 
                    fontSize: '18px',
                    color: '#9ca3af',
                    marginBottom: '12px'
                  }}>
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    gap: '16px',
                    fontSize: '14px',
                    color: '#9ca3af'
                  }}>
                    <div>
                      <strong>Candidate:</strong> {slot.candidateName || 'N/A'}
                    </div>
                    <div>
                      <strong>Interviewer:</strong> {slot.interviewerName || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: quality.color + '22',
                    color: quality.color,
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '16px'
                  }}>
                    {quality.text}
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 700,
                    color: quality.color,
                    marginBottom: '4px'
                  }}>
                    {slot.score || 75}%
                  </div>
                  <div style={{ 
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    Match Score
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleBookSlot(slot)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: '#6c63ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginTop: '16px',
                  transition: 'all 0.2s'
                }}
              >
                Book This Slot
              </button>
            </div>
          );
        })}
      </div>

      {/* All Availability Table */}
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
          All Availability
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {result.slots.map((slot, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '12px', color: '#e5e7eb' }}>
                    {slot.candidateName || slot.interviewerName || 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: '#6c63ff22',
                      color: '#6c63ff',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {slot.candidateName ? 'Candidate' : 'Interviewer'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#e5e7eb' }}>
                    {formatDate(slot.date)}
                  </td>
                  <td style={{ padding: '12px', color: '#e5e7eb' }}>
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleBookSlot(slot)}
                      style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Book
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              fontSize: '20px',
              color: '#fff'
            }}>
              Confirm Interview Booking
            </h2>
            <p style={{ 
              color: '#9ca3af', 
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              for {modal.candidateName || 'Candidate'} on {formatDate(modal.date)}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: 500
              }}>
                Interview Date
              </label>
              <input
                type="date"
                value={confirmForm.interviewDate}
                onChange={e => setConfirmForm(prev => ({ ...prev, interviewDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  colorScheme: 'dark'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: 500
              }}>
                Interview Time
              </label>
              <input
                type="time"
                value={confirmForm.interviewTime}
                onChange={e => setConfirmForm(prev => ({ ...prev, interviewTime: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  colorScheme: 'dark'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: 500
              }}>
                Meeting Link
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={confirmForm.meetingLink}
                onChange={e => setConfirmForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#111827',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  colorScheme: 'dark'
                }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px'
            }}>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: loading ? '#4c4685' : '#6c63ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Confirming...' : 'Confirm & Send Emails'}
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
