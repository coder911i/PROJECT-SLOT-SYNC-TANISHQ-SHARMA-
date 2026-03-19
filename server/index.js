require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const db = require('./db');
const { findBestSlots } = require('./scheduler');
const { screenCandidate } = require('./screener');

const app = express();

// CORS for both dev and production
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true); // Allow all for now during testing
  }
}));

app.use(express.json());

// ─────────────────────────────────────────
// ROUTE 1: Schedule Interview
// POST /api/schedule
// ─────────────────────────────────────────
app.post('/api/schedule', async (req, res) => {
  try {
    const { candidateName, candidateAvailability, interviewers } = req.body;
    if (!candidateAvailability || !interviewers?.length) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    const sessionId = uuidv4();
    await db.prepare(`INSERT INTO sessions (id, candidate_name, candidate_availability, status) VALUES (?,?,?,'processing')`)
      .run(sessionId, candidateName || 'Candidate', candidateAvailability);
    
    for (const iv of interviewers) {
      await db.prepare(`INSERT INTO interviewers (id, session_id, name, availability) VALUES (?,?,?,?)`)
        .run(uuidv4(), sessionId, iv.name, iv.availability);
    }
    
    const result = findBestSlots(candidateAvailability, interviewers);
    
    await db.prepare(`INSERT INTO results (id, session_id, slots_json, conflicts_json) VALUES (?,?,?,?)`)
      .run(uuidv4(), sessionId, JSON.stringify(result.slots), JSON.stringify(result.conflictReport));
    await db.prepare(`UPDATE sessions SET status='completed' WHERE id=?`).run(sessionId);
    
    res.json({ sessionId, result });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// ROUTE 2: Confirm Interview
// POST /api/schedule/confirm
// ─────────────────────────────────────────
app.post('/api/schedule/confirm', async (req, res) => {
  try {
    const { sessionId, selectedSlot, candidateEmail, candidateName } = req.body;
    
    const interviewers = await db.prepare(`SELECT * FROM interviewers WHERE session_id=?`).all(sessionId);
    const interviewId = uuidv4();
    
    await db.prepare(`
      INSERT INTO confirmed_interviews
      (id, session_id, candidate_name, candidate_email, day_name, date_label, start_time, end_time, interviewers_json)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(interviewId, sessionId, candidateName, candidateEmail,
      selectedSlot.dayName, selectedSlot.dateLabel,
      selectedSlot.startTime, selectedSlot.endTime,
      JSON.stringify(interviewers));
    
    await db.prepare(`UPDATE sessions SET status='confirmed' WHERE id=?`).run(sessionId);

    const zapierPayload = {
      interviewId, candidateName, candidateEmail, slot: selectedSlot,
      interviewers: interviewers.map(i => ({ name: i.name })),
      candidateEmailSubject: `Interview Confirmed — ${selectedSlot.dateLabel} at ${selectedSlot.startTime}`,
      candidateEmailBody: `Hi ${candidateName},\n\nYour interview is confirmed!\n\n📅 ${selectedSlot.dateLabel}\n⏰ ${selectedSlot.startTime} – ${selectedSlot.endTime}\n👥 Panel: ${interviewers.map(i => i.name).join(', ')}\n\nBe ready 5 minutes early.\n\n— SlotSync`,
      managerEmailSubject: `Interview Scheduled: ${candidateName} — ${selectedSlot.dateLabel}`,
      managerEmailBody: `Interview auto-scheduled by SlotSync.\n\nCandidate: ${candidateName} (${candidateEmail})\nDate: ${selectedSlot.dateLabel}\nTime: ${selectedSlot.startTime} – ${selectedSlot.endTime}\nPanel: ${interviewers.map(i => i.name).join(', ')}\n\nNo action required.\n\n— SlotSync` 
    };

    if (process.env.ZAPIER_INTERVIEW_CONFIRMED_WEBHOOK) {
      fetch(process.env.ZAPIER_INTERVIEW_CONFIRMED_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zapierPayload)
      }).catch(err => console.error('Zapier error:', err));
    }

    res.json({ success: true, interviewId });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// ROUTE 3: Get All Sessions
// GET /api/sessions
// ─────────────────────────────────────────
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await db.prepare(`
      SELECT s.id, s.candidate_name, s.status, s.created_at,
             r.slots_json, r.conflicts_json
      FROM sessions s
      LEFT JOIN results r ON r.session_id = s.id
      ORDER BY s.created_at DESC LIMIT 50
    `).all();
    
    const formatted = await Promise.all(sessions.map(async s => {
      const interviewers = await db.prepare(`SELECT name, availability FROM interviewers WHERE session_id=?`).all(s.id);
      return {
        ...s,
        slots: s.slots_json ? JSON.parse(s.slots_json) : [],
        conflictReport: s.conflicts_json ? JSON.parse(s.conflicts_json) : null,
        interviewers
      };
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// ROUTE 4: Get One Session
// GET /api/sessions/:id
// ─────────────────────────────────────────
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await db.prepare(`SELECT * FROM sessions WHERE id=?`).get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    
    const result = await db.prepare(`SELECT * FROM results WHERE session_id=?`).get(req.params.id);
    const interviewers = await db.prepare(`SELECT * FROM interviewers WHERE session_id=?`).all(req.params.id);
    
    res.json({
      ...session,
      slots: result ? JSON.parse(result.slots_json) : [],
      conflictReport: result ? JSON.parse(result.conflicts_json) : null,
      interviewers
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// ROUTE 5: Delete Session
// DELETE /api/sessions/:id
// ─────────────────────────────────────────
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await db.prepare(`DELETE FROM results WHERE session_id=?`).run(req.params.id);
    await db.prepare(`DELETE FROM interviewers WHERE session_id=?`).run(req.params.id);
    await db.prepare(`DELETE FROM sessions WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// ROUTE 6: Analytics
// GET /api/analytics
// ─────────────────────────────────────────
app.get('/api/analytics', async (req, res) => {
  try {
    const totalSessions = (await db.prepare(`SELECT COUNT(*) as c FROM sessions`).get()).c;
    const completedSessions = (await db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE status='completed' OR status='confirmed'`).get()).c;
    const confirmedSessions = (await db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE status='confirmed'`).get()).c;
    const totalCandidates = (await db.prepare(`SELECT COUNT(*) as c FROM candidates`).get()).c;
    const allResults = await db.prepare(`SELECT slots_json FROM results`).all();
    
    let totalSlots = 0, perfectMatches = 0, participationSum = 0, participationCount = 0;
    allResults.forEach(r => {
      const slots = JSON.parse(r.slots_json);
      totalSlots += slots.length;
      slots.forEach(s => {
        participationSum += s.participationPercent;
        participationCount++;
        if (s.participationPercent === 100) perfectMatches++;
      });
    });
    
    res.json({
      totalSessions, completedSessions, confirmedSessions,
      totalCandidates, totalSlots, perfectMatches,
      avgParticipation: participationCount > 0 ? Math.round(participationSum / participationCount) : 0
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// AUTOMATION 1: Screen Candidate Webhook
// POST /api/webhooks/screen-candidate
// Called by Zapier when candidate fills form
// ─────────────────────────────────────────
app.post('/api/webhooks/screen-candidate', async (req, res) => {
  try {
    const { candidateName, candidateEmail, availability, role, experience, skills } = req.body;
    if (!candidateName || !candidateEmail || !availability) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    const screening = screenCandidate({ candidateName, candidateEmail, role, experience, skills, availability });
    const candidateId = uuidv4();
    
    await db.prepare(`
      INSERT INTO candidates (id, name, email, role, experience, skills, availability, screening_score, screening_status, screening_summary)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(candidateId, candidateName, candidateEmail, role, experience, skills,
      availability, screening.score, screening.status, screening.summary);
    
    res.json({
      candidateId, candidateName, candidateEmail, role,
      screening,
      emailSubject: `[SlotSync] Candidate Screened: ${candidateName} — ${screening.status}`,
      emailBody: screening.emailBody
    });
  } catch (err) {
    console.error('Screen candidate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// AUTOMATION 2: Daily Reminders
// GET /api/automations/daily-reminders
// Called by Zapier every morning at 8 AM
// ─────────────────────────────────────────
app.get('/api/automations/daily-reminders', async (req, res) => {
  try {
    const today = new Date();
    const todayLabel = today.toLocaleDateString('en-GB', {
      weekday: 'short', day: '2-digit', month: 'short'
    });
    
    const todayInterviews = await db.prepare(`
      SELECT * FROM confirmed_interviews WHERE date_label=? AND status='scheduled'
    `).all(todayLabel);
    
    if (!todayInterviews.length) {
      return res.json({ hasInterviews: false, interviews: [] });
    }
    
    const reminders = todayInterviews.map(iv => {
      const interviewers = JSON.parse(iv.interviewers_json);
      return {
        interviewId: iv.id,
        candidateName: iv.candidate_name,
        candidateEmail: iv.candidate_email,
        dateLabel: iv.date_label,
        startTime: iv.start_time,
        endTime: iv.end_time,
        interviewers,
        candidateReminderSubject: `Reminder: Your interview is today at ${iv.start_time}`,
        candidateReminderBody: `Hi ${iv.candidate_name},\n\nYour interview is TODAY!\n\n⏰ ${iv.start_time} – ${iv.end_time}\n👥 Panel: ${interviewers.map(i => i.name).join(', ')}\n\nGood luck!\n\n— SlotSync`,
        interviewerReminderSubject: `Interview Today: ${iv.candidate_name} at ${iv.start_time}`,
        interviewerReminderBody: `You have an interview today.\n\n👤 Candidate: ${iv.candidate_name}\n⏰ ${iv.start_time} – ${iv.end_time}\n\nBe prepared and on time.\n\n— SlotSync` 
      };
    });
    
    res.json({ hasInterviews: true, count: reminders.length, date: todayLabel, interviews: reminders });
  } catch (err) {
    console.error('Daily reminders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SlotSync API running on port ${PORT}`));
