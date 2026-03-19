const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(
  path.join(__dirname, 'slotsync.db')
);

// Insert mock candidates
const candidates = [
  {
    candidateName: 'Rahul Kumar',
    candidateEmail: 'rahul.kumar@gmail.com',
    phone: '9876543210',
    position: 'Software Engineer',
    experience: '2-4 years',
    availability: '2026-03-25',
    preferredDate1: '2026-03-25',
    preferredDate2: '2026-03-26',
    preferredTime: 'Morning (9 AM - 12 PM)',
    interviewMode: 'Online (Google Meet)',
    location: 'Delhi',
    skills: 'React, Node.js, Python',
    score: '85',
    status: 'pending',
    submittedAt: new Date(
      Date.now() - 2 * 60 * 60 * 1000
    ).toISOString()
  },
  {
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.sharma@gmail.com',
    phone: '9871234567',
    position: 'Frontend Developer',
    experience: '1-2 years',
    availability: '2026-03-24',
    preferredDate1: '2026-03-24',
    preferredDate2: '2026-03-27',
    preferredTime: 'Afternoon (12 PM - 4 PM)',
    interviewMode: 'Online (Zoom)',
    location: 'Mumbai',
    skills: 'React, CSS, JavaScript',
    score: '78',
    status: 'confirmed',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    interviewDate: '2026-03-24',
    interviewTime: '14:00',
    confirmedAt: new Date(
      Date.now() - 1 * 60 * 60 * 1000
    ).toISOString(),
    submittedAt: new Date(
      Date.now() - 5 * 60 * 60 * 1000
    ).toISOString()
  },
  {
    candidateName: 'Arjun Mehta',
    candidateEmail: 'arjun.mehta@gmail.com',
    phone: '9845678901',
    position: 'Backend Developer',
    experience: '4-6 years',
    availability: '2026-03-26',
    preferredDate1: '2026-03-26',
    preferredDate2: '2026-03-28',
    preferredTime: 'Morning (9 AM - 12 PM)',
    interviewMode: 'In-Person',
    location: 'Bangalore',
    skills: 'Node.js, Python, AWS',
    score: '92',
    status: 'pending',
    submittedAt: new Date(
      Date.now() - 3 * 60 * 60 * 1000
    ).toISOString()
  },
  {
    candidateName: 'Sneha Patel',
    candidateEmail: 'sneha.patel@gmail.com',
    phone: '9823456789',
    position: 'Full Stack Developer',
    experience: '2-4 years',
    availability: '2026-03-27',
    preferredDate1: '2026-03-27',
    preferredDate2: '2026-03-28',
    preferredTime: 'Evening (4 PM - 7 PM)',
    interviewMode: 'Online (Google Meet)',
    location: 'Pune',
    skills: 'React, Node.js, MongoDB',
    score: '88',
    status: 'rejected',
    submittedAt: new Date(
      Date.now() - 8 * 60 * 60 * 1000
    ).toISOString()
  },
  {
    candidateName: 'Vikram Singh',
    candidateEmail: 'vikram.singh@gmail.com',
    phone: '9812345678',
    position: 'UI/UX Designer',
    experience: '1-2 years',
    availability: '2026-03-25',
    preferredDate1: '2026-03-25',
    preferredDate2: '2026-03-26',
    preferredTime: 'Morning (9 AM - 12 PM)',
    interviewMode: 'Online (Zoom)',
    location: 'Hyderabad',
    skills: 'Figma, Adobe XD, CSS',
    score: '75',
    status: 'pending',
    submittedAt: new Date(
      Date.now() - 1 * 24 * 60 * 60 * 1000
    ).toISOString()
  },
  {
    candidateName: 'Anita Reddy',
    candidateEmail: 'anita.reddy@gmail.com',
    phone: '9834567890',
    position: 'Data Analyst',
    experience: '2-4 years',
    availability: '2026-03-26',
    preferredDate1: '2026-03-26',
    preferredDate2: '2026-03-29',
    preferredTime: 'Afternoon (12 PM - 4 PM)',
    interviewMode: 'Online (Google Meet)',
    location: 'Chennai',
    skills: 'Python, SQL, Tableau',
    score: '82',
    status: 'confirmed',
    meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
    interviewDate: '2026-03-26',
    interviewTime: '13:00',
    confirmedAt: new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString(),
    submittedAt: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000
    ).toISOString()
  }
];

// Insert availability data
const availability = [
  {
    personName: 'Interviewer 1 - Tanishq',
    personEmail: 'waterting@gmail.com',
    role: 'interviewer',
    availableDate: '2026-03-25',
    startTime: '09:00',
    endTime: '12:00'
  },
  {
    personName: 'Interviewer 1 - Tanishq',
    personEmail: 'waterting@gmail.com',
    role: 'interviewer',
    availableDate: '2026-03-26',
    startTime: '13:00',
    endTime: '17:00'
  },
  {
    personName: 'Interviewer 2 - HR Team',
    personEmail: 'hr@company.com',
    role: 'interviewer',
    availableDate: '2026-03-25',
    startTime: '10:00',
    endTime: '15:00'
  },
  {
    personName: 'Rahul Kumar',
    personEmail: 'rahul.kumar@gmail.com',
    role: 'candidate',
    availableDate: '2026-03-25',
    startTime: '09:00',
    endTime: '12:00'
  },
  {
    personName: 'Arjun Mehta',
    personEmail: 'arjun.mehta@gmail.com',
    role: 'candidate',
    availableDate: '2026-03-26',
    startTime: '13:00',
    endTime: '17:00'
  }
];

// Clear existing data and insert fresh
try {
  db.prepare('DELETE FROM candidates').run();
  db.prepare('DELETE FROM availability').run();
  db.prepare('DELETE FROM sessions').run();
} catch(e) {}

const insertCandidate = db.prepare(`
  INSERT INTO candidates (
    candidateName, candidateEmail, phone,
    position, experience, availability,
    preferredDate1, preferredDate2,
    preferredTime, interviewMode, location,
    skills, score, status, meetingLink,
    interviewDate, interviewTime,
    confirmedAt, submittedAt
  ) VALUES (
    @candidateName, @candidateEmail, @phone,
    @position, @experience, @availability,
    @preferredDate1, @preferredDate2,
    @preferredTime, @interviewMode, @location,
    @skills, @score, @status, @meetingLink,
    @interviewDate, @interviewTime,
    @confirmedAt, @submittedAt
  )
`);

candidates.forEach(c => {
  insertCandidate.run({
    meetingLink: null,
    interviewDate: null,
    interviewTime: null,
    confirmedAt: null,
    ...c
  });
});

const insertAvailability = db.prepare(`
  INSERT INTO availability (
    personName, personEmail, role,
    availableDate, startTime, endTime
  ) VALUES (
    @personName, @personEmail, @role,
    @availableDate, @startTime, @endTime
  )
`);

availability.forEach(a => {
  insertAvailability.run(a);
});

console.log('Mock data inserted successfully!');
console.log(`${candidates.length} candidates added`);
console.log(`${availability.length} availability slots added`);

db.close();
