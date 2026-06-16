const TO   = process.env.NOTIFY_EMAIL   || 'info.dabconsulting@gmail.com';
const FROM = process.env.NOTIFY_FROM    || 'Sight Seers Caribbean <onboarding@resend.dev>';
const KEY  = process.env.RESEND_API_KEY || '';

async function sendEmail({ subject, html }) {
  if (!KEY) return; // silent no-op until API key is configured
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM, to: [TO], subject, html })
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
}

module.exports = { sendEmail };
