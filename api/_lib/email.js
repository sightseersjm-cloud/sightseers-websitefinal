const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'sightseersjm@gmail.com';
const FROM = process.env.RESEND_FROM || 'Sight Seers Caribbean <onboarding@resend.dev>';
const KEY  = process.env.RESEND_API_KEY || '';

async function sendEmail({ to, subject, html, replyTo, attachments }) {
  if (!KEY) { console.log('EMAIL SKIP: no RESEND_API_KEY'); return; }
  const recipient = to || BUSINESS_EMAIL;
  /* a message to the team always ends with a way into the admin inbox, where the request can be tracked */
  if (!to && typeof html === 'string' && html.indexOf('data-admin-link') === -1) {
    const site = (process.env.SITE_URL || 'https://www.sightseerscaribbean.com').replace(/\/+$/, '');
    html += '<p data-admin-link style="margin:22px 0 0;padding-top:14px;border-top:1px solid #e3ebf2;font-family:sans-serif;font-size:13px;color:#555">Track and manage this request in your admin inbox: <a href="' + site + '/account" style="color:#d96f12;font-weight:bold">sign in and open the Travel Club admin, Inbox tab</a>.</p>';
  }
  try {
    const payload = { from: FROM, to: Array.isArray(recipient) ? recipient : [recipient], subject, html };
    if (replyTo) payload.reply_to = replyTo;
    if (Array.isArray(attachments) && attachments.length) payload.attachments = attachments;
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    console.log('EMAIL RESULT:', resp.status, JSON.stringify(data));
    // Surface delivery failures (e.g. invalid key, unverified sender) instead of
    // silently returning ok — callers can log/track, and it shows up in monitoring.
    if (!resp.ok) return { ok: false, status: resp.status, error: data };
    return { ok: true, id: data && data.id };
  } catch (e) {
    console.error('EMAIL ERROR:', e.message);
    return { ok: false, error: e.message };
  }
}

/* Many separate emails in one call (up to 100 each): every message has its own recipient, so nobody sees anyone else's
   address. Each item is { to, subject, html, replyTo, headers }. Returns how many were accepted. */
async function sendBatch(items) {
  const list = (items || []).filter(m => m && m.to);
  if (!list.length) return { ok: true, sent: 0 };
  if (!KEY) { console.log('EMAIL SKIP (batch): no RESEND_API_KEY'); return { ok: false, sent: 0, error: 'no key' }; }
  let sent = 0, failed = 0;
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100).map(m => {
      const one = { from: FROM, to: [m.to], subject: m.subject, html: m.html };
      if (m.replyTo) one.reply_to = m.replyTo;
      if (m.headers) one.headers = m.headers;
      return one;
    });
    try {
      const resp = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
      const data = await resp.json().catch(() => ({}));
      console.log('EMAIL BATCH RESULT:', resp.status, chunk.length);
      if (resp.ok) sent += chunk.length; else { failed += chunk.length; console.error('EMAIL BATCH ERROR:', JSON.stringify(data).slice(0, 300)); }
    } catch (e) { failed += chunk.length; console.error('EMAIL BATCH ERROR:', e.message); }
  }
  return { ok: failed === 0, sent, failed };
}

module.exports = { sendEmail, sendBatch, BUSINESS_EMAIL };
