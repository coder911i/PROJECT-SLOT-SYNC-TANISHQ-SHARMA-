const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'slotsync.db'));

// Create candidates table with all required columns
db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateName TEXT NOT NULL,
    candidateEmail TEXT NOT NULL,
    phone TEXT,
    position TEXT,
    experience TEXT,
    availability TEXT,
    preferredDate1 TEXT,
    preferredDate2 TEXT,
    preferredDate3 TEXT,
    preferredTime TEXT,
    interviewMode TEXT,
    location TEXT,
    linkedin TEXT,
    notes TEXT,
    skills TEXT,
    score TEXT,
    status TEXT DEFAULT 'pending',
    meetingLink TEXT,
    interviewDate TEXT,
    interviewTime TEXT,
    submittedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    confirmedAt TEXT
  )
`);

// Helper to add columns safely if table exists
const addColumnIfNotExists = (col, type) => {
  try {
    db.exec(`ALTER TABLE candidates ADD COLUMN ${col} ${type}`);
  } catch(e) {
    // Column already exists
  }
};

// Add new columns to existing table
addColumnIfNotExists('meetingLink', 'TEXT');
addColumnIfNotExists('interviewDate', 'TEXT');
addColumnIfNotExists('interviewTime', 'TEXT');
addColumnIfNotExists('confirmedAt', 'TEXT');
addColumnIfNotExists('skills', 'TEXT');
addColumnIfNotExists('score', 'TEXT');

module.exports = db;
