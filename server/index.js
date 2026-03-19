require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('./db');
const { findBestSlots } = require('./scheduler');
const { screenCandidate } = require('./screener');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://slotsync-client.onrender.com',
    'https://slotsync-api.onrender.com',
    /\.onrender\.com$/,
    /\.vercel\.app$/
  ]
}));
app.use(express.json());

// ─────────────────────────────────────
// NODEMAILER SETUP (Automation 3)
// ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Helper to fire a webhook non-blocking
function fireWebhook(url, payload) {
  if (!url) return;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => console.error(`Webhook failed (${url}):`, err.message));
}

// ─────────────────────────────────────
// ROUTE 1: POST /api/schedule
// ─────────────────────────────────────
app.post('/api/schedule', (req, res) => {
  const { candidateName, candidateAvailability, interviewers } = req.body;

  if (!candidateAvailability || !interviewers || !interviewers.length) {
    return res.status(400).json({ error: 'Missing candidateAvailability or interviewers' });
  }

  const sessionId = uuidv4();

  db.prepare(`
    INSERT INTO sessions (id, candidate_name, candidate_availability, status)
    VALUES (?, ?, ?, 'processing')
  `).run(sessionId, candidateName || 'Candidate', candidateAvailability);

  interviewers.forEach(iv => {
    db.prepare(`
      INSERT INTO interviewers (id, session_id, name, availability)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), sessionId, iv.name, iv.availability);
  });

  const result = findBestSlots(candidateAvailability, interviewers);

  db.prepare(`
    INSERT INTO results (id, session_id, slots_json, conflicts_json)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), sessionId, JSON.stringify(result.slots), JSON.stringify(result.conflictReport));

  db.prepare(`UPDATE sessions SET status = 'completed' WHERE id = ?`).run(sessionId);

  res.json({ sessionId, result });
});

// ─────────────────────────────────────
// ROUTE 2: POST /api/schedule/confirm
// ─────────────────────────────────────
app.post('/api/schedule/confirm', (req, res) => {
  const { sessionId, selectedSlot, candidateName, candidateEmail } = req.body;

  if (!sessionId || !selectedSlot || !candidateName || !candidateEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const interviewers = db.prepare(`SELECT * FROM interviewers WHERE session_id = ?`).all(sessionId);
  const panelNames = interviewers.map(i => i.name).join(', ');
  const interviewId = uuidv4();

  db.prepare(`
    INSERT INTO confirmed_interviews
    (id, session_id, candidate_name, candidate_email, day_name, date_label, start_time, end_time, interviewers_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
  `).run(
    interviewId, sessionId, candidateName, candidateEmail,
    selectedSlot.dayName, selectedSlot.dateLabel,
    selectedSlot.startTime, selectedSlot.endTime,
    JSON.stringify(interviewers)
  );

  db.prepare(`UPDATE sessions SET status = 'confirmed' WHERE id = ?`).run(sessionId);

  // Zap 2A — candidate email
  fireWebhook(process.env.ZAPIER_CONFIRMED_CANDIDATE, {
    candidateEmail,
    subject: `Your interview is confirmed — ${selectedSlot.dateLabel} at ${selectedSlot.startTime}`,
    body: `Hi ${candidateName},\n\nYour interview has been confirmed!\n\n📅 Date: ${selectedSlot.dateLabel}\n⏰ Time: ${selectedSlot.startTime} – ${selectedSlot.endTime}\n👥 Panel: ${panelNames}\n\nBe ready 5 minutes early.\n\n— SlotSync` 
  });

  // Zap 2B — manager email
  fireWebhook(process.env.ZAPIER_CONFIRMED_MANAGER, {
    subject: `Interview Scheduled: ${candidateName} — ${selectedSlot.dateLabel}`,
    body: `Interview auto-scheduled by SlotSync.\n\nCandidate: ${candidateName} (${candidateEmail})\nDate: ${selectedSlot.dateLabel}\nTime: ${selectedSlot.startTime} – ${selectedSlot.endTime}\nPanel: ${panelNames}\n\nNo action required.\n\n— SlotSync` 
  });

  res.json({ success: true, interviewId });
});

// ─────────────────────────────────────
// ROUTE 3: GET /api/sessions
// ─────────────────────────────────────
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await db.prepare(`
      SELECT s.id, s.candidate_name, s.status, s.created_at,
             r.slots_json, r.conflicts_json
      FROM sessions s
      LEFT JOIN results r ON r.session_id = s.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all();

    const formatted = await Promise.all(sessions.map(async s => {
      const interviewers = await db.prepare(`SELECT name, availability FROM interviewers WHERE session_id = ?`).all(s.id);
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

// ─────────────────────────────────────
// ROUTE 4: GET /api/sessions/:id
// ─────────────────────────────────────
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const result = await db.prepare(`SELECT * FROM results WHERE session_id = ?`).get(req.params.id);
    const interviewers = await db.prepare(`SELECT * FROM interviewers WHERE session_id = ?`).all(req.params.id);

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

// ─────────────────────────────────────
// ROUTE 5: DELETE /api/sessions/:id
// ─────────────────────────────────────
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await db.prepare(`DELETE FROM results WHERE session_id = ?`).run(req.params.id);
    await db.prepare(`DELETE FROM interviewers WHERE session_id = ?`).run(req.params.id);
    await db.prepare(`DELETE FROM sessions WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// ROUTE 6: GET /api/analytics
// ─────────────────────────────────────
app.get('/api/analytics', async (req, res) => {
  try {
    const totalSessions = (await db.prepare(`SELECT COUNT(*) as c FROM sessions`).get()).c;
    const completedSessions = (await db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE status = 'completed' OR status = 'confirmed'`).get()).c;
    const confirmedSessions = (await db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE status = 'confirmed'`).get()).c;
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
      totalSessions,
      completedSessions,
      confirmedSessions,
      totalCandidates,
      totalSlots,
      perfectMatches,
      avgParticipation: participationCount > 0 ? Math.round(participationSum / participationCount) : 0
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// AUTOMATION 1: POST /api/webhooks/screen-candidate
// Called by Zap 1A (Google Forms trigger)
// Fires Zap 1B (screening email to manager)
// ─────────────────────────────────────
app.post('/api/webhooks/screen-candidate', async (req, res) => {
  try {
    const { candidateName, candidateEmail, availability, role, experience, skills } = req.body;

    if (!candidateName || !candidateEmail || !availability) {
      return res.status(400).json({ error: 'Missing candidateName, candidateEmail, or availability' });
    }

    const screening = screenCandidate({
      candidateName,
      candidateEmail,
      role: role || 'Not specified',
      experience: experience || '0',
      skills: skills || '',
      availability
    });

    const candidateId = uuidv4();

    await db.prepare(`
      INSERT INTO candidates
      (id, name, email, role, experience, skills, availability, screening_score, screening_status, screening_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateId, candidateName, candidateEmail,
      role, experience, skills, availability,
      screening.score, screening.status, screening.summary
    );

    // Fire Zap 1B — sends email to manager
    fireWebhook(process.env.ZAPIER_SCREENING_EMAIL_WEBHOOK, {
      emailSubject: `[SlotSync] Candidate Screened: ${candidateName} — ${screening.status}`,
      emailBody: screening.emailBody,
      managerEmail: process.env.MANAGER_EMAIL || 'manager@yourcompany.com'
    });

    res.json({
      candidateId,
      candidateName,
      candidateEmail,
      role,
      screening,
      emailSubject: `[SlotSync] Candidate Screened: ${candidateName} — ${screening.status}`,
      emailBody: screening.emailBody
    });
  } catch (err) {
    console.error('Screen candidate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// AUTOMATION 3: GET /api/automations/daily-reminders
// Still available as endpoint for manual testing
// Actual sending handled by node-cron below
// ─────────────────────────────────────
app.get('/api/automations/daily-reminders', async (req, res) => {
  try {
    const today = new Date();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const todayLabel = `${days[today.getDay()]}, ${String(today.getDate()).padStart(2,'0')} ${months[today.getMonth()]}`;

    const todayInterviews = await db.prepare(`
      SELECT * FROM confirmed_interviews
      WHERE date_label = ? AND status = 'scheduled'
    `).all(todayLabel);

    if (!todayInterviews.length) {
      return res.json({ hasInterviews: false, count: 0, date: todayLabel, interviews: [] });
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
        panelNames: interviewers.map(i => i.name).join(', '),
        interviewers
      };
    });

    res.json({ hasInterviews: true, count: reminders.length, date: todayLabel, interviews: reminders });
  } catch (err) {
    console.error('Daily reminders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// AUTOMATION 3: DAILY CRON JOB
// Runs every day at 8:00 AM server time
// Sends reminder emails via nodemailer
// No Zapier needed
// ─────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily reminder cron job...');

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('Gmail credentials not set — skipping reminders');
    return;
  }

  const today = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const todayLabel = `${days[today.getDay()]}, ${String(today.getDate()).padStart(2,'0')} ${months[today.getMonth()]}`;

  const interviews = db.prepare(`
    SELECT * FROM confirmed_interviews
    WHERE date_label = ? AND status = 'scheduled'
  `).all(todayLabel);

  if (!interviews.length) {
    console.log(`No interviews today (${todayLabel})`);
    return;
  }

  console.log(`Sending reminders for ${interviews.length} interviews on ${todayLabel}`);

  for (const iv of interviews) {
    const interviewers = JSON.parse(iv.interviewers_json);
    const panelNames = interviewers.map(i => i.name).join(', ');

    try {
      // Email candidate
      await transporter.sendMail({
        from: `SlotSync <${process.env.GMAIL_USER}>`,
        to: iv.candidate_email,
        subject: `Reminder: Your interview is today at ${iv.start_time}`,
        text: `Hi ${iv.candidate_name},\n\nYour interview is TODAY!\n\n⏰ Time: ${iv.start_time} – ${iv.end_time}\n👥 Panel: ${panelNames}\n\nGood luck! Be ready 5 minutes early.\n\n— SlotSync` 
      });
      console.log(`Reminder sent to candidate: ${iv.candidate_email}`);
    } catch (err) {
      console.error(`Failed to send reminder to ${iv.candidate_email}:`, err.message);
    }
  }
});

// ─────────────────────────────────────
// START SERVER
// ─────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SlotSync API running on port ${PORT}`);
  console.log(`Daily reminder cron scheduled for 8:00 AM`);
});
