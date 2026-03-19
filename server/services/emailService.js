const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendWithRetry(mailOptions, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      if (i === retries - 1) {
        console.error('Email failed:', err.message);
        return false;
      }
    }
  }
}

async function sendCandidateEmail(data) {
  return sendWithRetry({
    from: process.env.GMAIL_USER,
    to: data.candidateEmail,
    subject: 'Interview Confirmed - SlotSync',
    html: `
      <div style="font-family:Arial,sans-serif;
                  max-width:600px;margin:0 auto;">
        <h2 style="color:#6c63ff;">
          Interview Confirmed!
        </h2>
        <p>Hi ${data.candidateName},</p>
        <p>Your interview has been confirmed.</p>
        <div style="background:#f5f5f5;
                    padding:20px;
                    border-radius:8px;
                    margin:20px 0;">
          <p><b>Position:</b> ${data.position}</p>
          <p><b>Date:</b> ${data.interviewDate}</p>
          <p><b>Time:</b> ${data.interviewTime}</p>
          <p><b>Mode:</b> ${data.interviewMode}</p>
          <p><b>Link:</b> 
            <a href="${data.meetingLink}">
              ${data.meetingLink}
            </a>
          </p>
        </div>
        <p>Be ready 5 mins early.</p>
        <p>Best regards,<br>
           <b>SlotSync Recruitment</b></p>
      </div>
    `
  });
}

async function sendManagerEmail(data) {
  return sendWithRetry({
    from: process.env.GMAIL_USER,
    to: process.env.MANAGER_EMAIL,
    subject: `Confirmed: ${data.candidateName} 
              on ${data.interviewDate}`,
    html: `
      <div style="font-family:Arial,sans-serif;
                  max-width:600px;margin:0 auto;">
        <h2 style="color:#6c63ff;">
          Interview Confirmed
        </h2>
        <div style="background:#f5f5f5;
                    padding:20px;
                    border-radius:8px;">
          <h3>Candidate:</h3>
          <p><b>Name:</b> ${data.candidateName}</p>
          <p><b>Email:</b> ${data.candidateEmail}</p>
          <p><b>Phone:</b> ${data.phone}</p>
          <p><b>Position:</b> ${data.position}</p>
          <h3>Interview:</h3>
          <p><b>Date:</b> ${data.interviewDate}</p>
          <p><b>Time:</b> ${data.interviewTime}</p>
          <p><b>Mode:</b> ${data.interviewMode}</p>
          <p><b>Link:</b> ${data.meetingLink}</p>
        </div>
        <p>- SlotSync System</p>
      </div>
    `
  });
}

async function sendReminderEmail(data) {
  return sendWithRetry({
    from: process.env.GMAIL_USER,
    to: data.candidateEmail,
    subject: `Interview Today at ${data.interviewTime}`,
    html: `
      <div style="font-family:Arial,sans-serif;
                  max-width:600px;margin:0 auto;">
        <h2 style="color:#6c63ff;">
          Interview Reminder
        </h2>
        <p>Hi ${data.candidateName},</p>
        <p>You have an interview <b>TODAY</b>.</p>
        <div style="background:#f5f5f5;
                    padding:20px;
                    border-radius:8px;">
          <p><b>Time:</b> ${data.interviewTime}</p>
          <p><b>Link:</b> 
            <a href="${data.meetingLink}">
              ${data.meetingLink}
            </a>
          </p>
        </div>
        <p>Good luck!</p>
        <p><b>SlotSync Recruitment</b></p>
      </div>
    `
  });
}

module.exports = { 
  sendCandidateEmail, 
  sendManagerEmail,
  sendReminderEmail
};
