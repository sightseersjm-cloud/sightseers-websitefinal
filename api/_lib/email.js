const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'sightseersjm@gmail.com';
const FROM = process.env.RESEND_FROM || 'Sight Seers Caribbean <onboarding@resend.dev>';
const KEY  = process.env.RESEND_API_KEY || '';

async function sendEmail({ to, subject, html }) {
  if (!KEY) { console.log('EMAIL SKIP: no RESEND_API_KEY'); return; }
  const recipient = to || BUSINESS_EMAIL;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM, to: Array.isArray(recipient) ? recipient : [recipient], subject, html })
    });
    const data = await resp.json();
    console.log('EMAIL RESULT:', resp.status, JSON.stringify(data));
  } catch (e) {
    console.error('EMAIL ERROR:', e.message);
  }
}

module.exports = { sendEmail, BUSINESS_EMAIL };
