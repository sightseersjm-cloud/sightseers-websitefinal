const TO   = 'sightseersjm@gmail.com';
const FROM = 'Sight Seers Caribbean <onboarding@resend.dev>';
const KEY  = process.env.RESEND_API_KEY || '';

async function sendEmail({ subject, html }) {
  if (!KEY) { console.log('EMAIL SKIP: no RESEND_API_KEY'); return; }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM, to: [TO], subject, html })
    });
    const data = await resp.json();
    console.log('EMAIL RESULT:', resp.status, JSON.stringify(data));
  } catch (e) {
    console.error('EMAIL ERROR:', e.message);
  }
}

module.exports = { sendEmail };
