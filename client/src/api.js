const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export async function scheduleInterview(candidateName, candidateAvailability, interviewers) {
  const res = await fetch(`${BASE}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateName, candidateAvailability, interviewers })
  });
  if (!res.ok) throw new Error('Scheduling failed');
  return res.json();
}

export async function confirmInterview(sessionId, selectedSlot, candidateName, candidateEmail) {
  const res = await fetch(`${BASE}/schedule/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, selectedSlot, candidateName, candidateEmail })
  });
  if (!res.ok) throw new Error('Confirm failed');
  return res.json();
}

export async function getSessions() {
  const res = await fetch(`${BASE}/sessions`);
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${BASE}/sessions/${id}`);
  return res.json();
}

export async function deleteSession(id) {
  await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
}

export async function getAnalytics() {
  const res = await fetch(`${BASE}/analytics`);
  return res.json();
}
