const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { 
  sendCandidateEmail,
  sendManagerEmail,
  sendReminderEmail
} = require('./services/emailService');

// Create availability table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personName TEXT NOT NULL,
    personEmail TEXT NOT NULL,
    role TEXT NOT NULL,
    availableDate TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://slotsync-client.onrender.com',
    'https://project-slot-sync-tanishq-sharma.onrender.com'
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTE 1 — Health Check:
app.get('/api', (req, res) => {
  res.json({ 
    message: 'SlotSync API running', 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ROUTE 2 — Receive candidate from Google Form:
app.post('/api/webhooks/screen-candidate', 
  (req, res) => {
  try {
    const {
      candidateName = '',
      candidateEmail = '',
      phone = '',
      position = '',
      experience = '',
      availability = '',
      preferredDate1 = '',
      preferredDate2 = '',
      preferredDate3 = '',
      preferredTime = '',
      interviewMode = '',
      location = '',
      linkedin = '',
      notes = '',
      skills = '',
      score = '',
      submittedAt = new Date().toISOString()
    } = req.body;

    if (!candidateName || !candidateEmail) {
      return res.status(400).json({ 
        error: 'candidateName and candidateEmail required'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO candidates (
        candidateName, candidateEmail, phone,
        position, experience, availability,
        preferredDate1, preferredDate2, preferredDate3,
        preferredTime, interviewMode, location,
        linkedin, notes, skills, score,
        status, submittedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 'pending', ?
      )
    `);

    const result = stmt.run(
      candidateName, candidateEmail, phone,
      position, experience, availability,
      preferredDate1, preferredDate2, preferredDate3,
      preferredTime, interviewMode, location,
      linkedin, notes, skills, score,
      submittedAt
    );

    return res.status(200).json({ 
      success: true, 
      candidateId: result.lastInsertRowid
    });

  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ 
      error: err.message 
    });
  }
});

// ROUTE 3 — Get all candidates:
app.get('/api/candidates', (req, res) => {
  try {
    const candidates = db.prepare(`
      SELECT * FROM candidates 
      ORDER BY submittedAt DESC
    `).all();
    return res.json(candidates);
  } catch (err) {
    console.error('Get candidates error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 4 — Update candidate status:
app.patch('/api/candidates/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending','confirmed','rejected']
        .includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    db.prepare(`
      UPDATE candidates 
      SET status = ? 
      WHERE id = ?
    `).run(status, id);

    const candidate = db.prepare(
      'SELECT * FROM candidates WHERE id = ?'
    ).get(id);

    return res.json({ success: true, candidate });
  } catch (err) {
    console.error('Update status error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 5 — Confirm interview + send emails:
app.post('/api/schedule/confirm', async (req, res) => {
  try {
    const { 
      candidateId, 
      interviewDate, 
      interviewTime, 
      meetingLink 
    } = req.body;

    if (!candidateId || !interviewDate || 
        !interviewTime) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    db.prepare(`
      UPDATE candidates SET
        status = 'confirmed',
        interviewDate = ?,
        interviewTime = ?,
        meetingLink = ?,
        confirmedAt = ?
      WHERE id = ?
    `).run(
      interviewDate, 
      interviewTime, 
      meetingLink,
      new Date().toISOString(),
      candidateId
    );

    const candidate = db.prepare(
      'SELECT * FROM candidates WHERE id = ?'
    ).get(candidateId);

    if (!candidate) {
      return res.status(404).json({ 
        error: 'Candidate not found' 
      });
    }

    await sendCandidateEmail({
      candidateName: candidate.candidateName,
      candidateEmail: candidate.candidateEmail,
      position: candidate.position,
      interviewDate,
      interviewTime,
      interviewMode: candidate.interviewMode,
      meetingLink
    });

    await sendManagerEmail({
      candidateName: candidate.candidateName,
      candidateEmail: candidate.candidateEmail,
      phone: candidate.phone,
      position: candidate.position,
      interviewDate,
      interviewTime,
      interviewMode: candidate.interviewMode,
      meetingLink
    });

    return res.json({ success: true, candidate });

  } catch (err) {
    console.error('Confirm error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 6 — Analytics:
app.get('/api/analytics', (req, res) => {
  try {
    const totalCandidates = db.prepare(
      'SELECT COUNT(*) as count FROM candidates'
    ).get().count;

    const pendingCount = db.prepare(
      `SELECT COUNT(*) as count 
       FROM candidates WHERE status='pending'`
    ).get().count;

    const confirmedCount = db.prepare(
      `SELECT COUNT(*) as count 
       FROM candidates WHERE status='confirmed'`
    ).get().count;

    const rejectedCount = db.prepare(
      `SELECT COUNT(*) as count 
       FROM candidates WHERE status='rejected'`
    ).get().count;

    const totalSessions = db.prepare(
      'SELECT COUNT(*) as count FROM sessions'
    ).get().count || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayInterviews = db.prepare(
      `SELECT COUNT(*) as count 
       FROM candidates 
       WHERE status='confirmed' AND interviewDate = ?`
    ).get(today).count || 0;

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

    const thisWeekInterviews = db.prepare(
      `SELECT COUNT(*) as count 
       FROM candidates 
       WHERE status='confirmed' 
       AND interviewDate >= ? 
       AND interviewDate <= ?`
    ).get(
      thisWeekStart.toISOString().split('T')[0],
      thisWeekEnd.toISOString().split('T')[0]
    ).count || 0;

    const confirmationRate = totalCandidates > 0 
      ? Math.round((confirmedCount / totalCandidates) * 100) 
      : 0;

    const topPositions = db.prepare(`
      SELECT position, COUNT(*) as count 
      FROM candidates 
      WHERE position IS NOT NULL AND position != ''
      GROUP BY position 
      ORDER BY count DESC 
      LIMIT 5
    `).all();

    const recentActivity = db.prepare(`
      SELECT candidateName, status, submittedAt
      FROM candidates 
      ORDER BY submittedAt DESC 
      LIMIT 5
    `).all();

    return res.json({ 
      totalCandidates,
      pendingCount,
      confirmedCount,
      rejectedCount,
      totalSessions,
      todayInterviews,
      thisWeekInterviews,
      confirmationRate,
      topPositions,
      recentActivity
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 7 — Daily reminders 
// (called by Google Apps Script):
app.get('/api/automations/daily-reminders', 
  async (req, res) => {
  try {
    const today = new Date()
      .toISOString().split('T')[0];

    const interviews = db.prepare(`
      SELECT * FROM candidates 
      WHERE status = 'confirmed' 
      AND interviewDate = ?
    `).all(today);

    let sent = 0;
    for (const c of interviews) {
      await sendReminderEmail({
        candidateName: c.candidateName,
        candidateEmail: c.candidateEmail,
        interviewDate: c.interviewDate,
        interviewTime: c.interviewTime,
        meetingLink: c.meetingLink || 
                     'Check your email'
      });
      sent++;
    }

    return res.json({ 
      success: true, 
      remindersSent: sent 
    });
  } catch (err) {
    console.error('Reminder error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 8 — History:
app.get('/api/history', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM candidates 
      WHERE status IN ('confirmed', 'rejected')
      ORDER BY submittedAt DESC
    `).all();
    return res.json(history);
  } catch (err) {
    console.error('History error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 9 — Get all availability:
app.get('/api/availability', (req, res) => {
  try {
    const availability = db.prepare(`
      SELECT * FROM availability 
      ORDER BY availableDate ASC, startTime ASC
    `).all();
    return res.json(availability);
  } catch (err) {
    console.error('Get availability error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 9 — Add availability:
app.post('/api/availability', (req, res) => {
  try {
    const {
      personName,
      personEmail,
      role,
      availableDate,
      startTime,
      endTime
    } = req.body;

    if (!personName || !personEmail || !role || !availableDate || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'All fields are required'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO availability (
        personName, personEmail, role,
        availableDate, startTime, endTime
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      personName, personEmail, role,
      availableDate, startTime, endTime
    );

    return res.status(201).json({ 
      success: true, 
      id: result.lastInsertRowid
    });

  } catch (err) {
    console.error('Add availability error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ROUTE 10 — Delete availability:
app.delete('/api/availability/:id', (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM availability WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error('Delete availability error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GLOBAL ERROR HANDLER 
// (add at very bottom before app.listen):
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`SlotSync running on port ${PORT}`);
});
