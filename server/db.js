const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'slotsync.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, candidate_name TEXT, candidate_availability TEXT, status TEXT DEFAULT 'pending', created_at INTEGER DEFAULT (strftime('%s','now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS interviewers (id TEXT PRIMARY KEY, session_id TEXT, name TEXT, availability TEXT, FOREIGN KEY (session_id) REFERENCES sessions(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, session_id TEXT UNIQUE, slots_json TEXT, conflicts_json TEXT, created_at INTEGER DEFAULT (strftime('%s','now')), FOREIGN KEY (session_id) REFERENCES sessions(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, experience TEXT, skills TEXT, availability TEXT, screening_score INTEGER, screening_status TEXT, screening_summary TEXT, created_at INTEGER DEFAULT (strftime('%s','now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS confirmed_interviews (id TEXT PRIMARY KEY, session_id TEXT, candidate_name TEXT, candidate_email TEXT, day_name TEXT, date_label TEXT, start_time TEXT, end_time TEXT, interviewers_json TEXT, status TEXT DEFAULT 'scheduled', created_at INTEGER DEFAULT (strftime('%s','now')))`);
});

// Helper methods for sqlite3
const dbWrapper = {
  prepare(sql) {
    return {
      run(...params) {
        return new Promise((resolve, reject) => {
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
          });
        });
      },
      get(...params) {
        return new Promise((resolve, reject) => {
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all(...params) {
        return new Promise((resolve, reject) => {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      }
    };
  }
};

module.exports = dbWrapper;
