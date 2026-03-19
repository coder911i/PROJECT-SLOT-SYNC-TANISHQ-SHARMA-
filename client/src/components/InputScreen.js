import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function InputScreen({ setScreen, onResult }) {
  const [mainTab, setMainTab] = useState('add');
  const [roleTab, setRoleTab] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [availability, setAvailability] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    availableDate: '',
    startTime: '',
    endTime: ''
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`${API}/availability`);
      const data = await res.json();
      setAvailability(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch availability error:', err);
    }
  };

  useEffect(() => {
    if (mainTab === 'view') {
      fetchAvailability();
    }
  }, [mainTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.fullName || !form.email || !form.availableDate || !form.startTime || !form.endTime) {
      showToast('Please fill all fields');
      return;
    }

    if (form.startTime >= form.endTime) {
      showToast('End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: form.fullName,
          personEmail: form.email,
          role: roleTab,
          availableDate: form.availableDate,
          startTime: form.startTime,
          endTime: form.endTime
        })
      });

      if (res.ok) {
        showToast('Availability added successfully!');
        setForm({
          fullName: '',
          email: '',
          availableDate: '',
          startTime: '',
          endTime: ''
        });
        setMainTab('view');
        fetchAvailability();
      } else {
        showToast('Failed to add availability');
      }
    } catch (err) {
      console.error(err);
      showToast('Error adding availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability?')) return;
    
    try {
      const res = await fetch(`${API}/availability/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showToast('Availability deleted');
        fetchAvailability();
      } else {
        showToast('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting');
    }
  };

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #374151',
    background: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    colorScheme: 'dark',
    cursor: 'pointer'
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
            Availability Management
          </h1>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '16px' 
          }}>
            Add and view interview availability
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #374151'
      }}>
        {[
          { id: 'add', label: 'Add My Availability' },
          { id: 'view', label: 'View All Availability' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              color: mainTab === tab.id ? '#fff' : '#9ca3af',
              borderBottom: mainTab === tab.id ? '2px solid #6c63ff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: mainTab === tab.id ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === 'add' && (
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '24px'
          }}>
            {[
              { id: 'candidate', label: 'Candidate' },
              { id: 'interviewer', label: 'Interviewer' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: roleTab === tab.id ? '#6c63ff' : '#1f2937',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: roleTab === tab.id ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #374151'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontWeight: 500
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontWeight: 500
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontWeight: 500
                }}>
                  Available Date
                </label>
                <input
                  type="date"
                  value={form.availableDate}
                  onChange={e => setForm(prev => ({ ...prev, availableDate: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontWeight: 500
                }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontWeight: 500
                }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#4c4685' : '#6c63ff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Adding...' : 'Add Availability'}
            </button>
          </form>
        </div>
      )}

      {mainTab === 'view' && (
        <div>
          {availability.length === 0 ? (
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
                📅
              </div>
              <div style={{ 
                fontSize: '18px', 
                marginBottom: '8px',
                color: '#fff'
              }}>
                No availability yet
              </div>
              <div style={{ 
                fontSize: '14px',
                color: '#9ca3af',
                marginBottom: '24px'
              }}>
                Add your availability to get started
              </div>
              <button
                onClick={() => setMainTab('add')}
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
                Add Availability
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '16px' 
            }}>
              {availability.map(item => (
                <div key={item.id} style={{
                  background: '#1f2937',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: '#fff'
                    }}>
                      {item.personName}
                    </div>
                    <div style={{ 
                      color: '#9ca3af', 
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      {item.personEmail}
                    </div>
                    <div style={{ 
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: item.role === 'candidate' ? '#10b98122' : '#3b82f622',
                        color: item.role === 'candidate' ? '#10b981' : '#3b82f6',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        border: `1px solid ${item.role === 'candidate' ? '#10b98144' : '#3b82f644'}`
                      }}>
                        {item.role}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                        {new Date(item.availableDate).toLocaleDateString()}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '8px',
                      background: '#ef444422',
                      color: '#ef4444',
                      border: '1px solid #ef444444',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      marginLeft: '16px',
                      transition: 'all 0.2s'
                    }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
