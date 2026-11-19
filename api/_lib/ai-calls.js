/**
 * AI calling: who may be called, when, and the link to the voice provider.
 *
 * Rules built in (none of them can be skipped from the admin screen):
 *  - only people who ticked the consent box on a request form, with the time they agreed recorded
 *  - never a number on the do-not-call list; "do not call" said on a call adds the number at once
 *  - calling hours only (Mon to Sat, 9:00 to 17:59 Jamaica time), a daily cap and a limit on tries per person
 *  - off by default: an admin must switch it on, and each call is started by an admin ("Call now")
 *  - the agent says it is an AI at the start of every call (see docs/ai-call-script.md)
 *
 * The voice provider defaults to Vapi. Keys are added in Vercel, never in the code:
 *   VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID, AI_CALL_WEBHOOK_SECRET
 * The request shape below follows Vapi's public call API from memory and has not been run against a live account:
 * check it against the provider's current documentation when the keys go in.
 */
const crypto = require('crypto');

const BIZ_TZ = 'America/Jamaica';
const OUTCOMES = ['interested', 'booked_call', 'call_back_later', 'not_interested', 'do_not_call', 'no_answer', 'voicemail'];
const DEFAULTS = { enabled: false, dailyCap: 20, maxAttempts: 2 };

/* "(876) 465-0630", "+1 876 465 0630", "18764650630" all become +18764650630; anything unclear becomes '' */
function normalizePhone(raw) {
  const s = String(raw == null ? '' : raw).trim();
  const plus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  if (plus) return digits.length >= 8 && digits.length <= 15 ? '+' + digits : '';
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '';
}

/* Mon to Sat, 9:00 to 17:59 in Jamaica time */
function inCallWindow(now) {
  const d = now || new Date();
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: BIZ_TZ, weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(d);
  const wd = (parts.find(p => p.type === 'weekday') || {}).value;
  const hr = parseInt((parts.find(p => p.type === 'hour') || {}).value, 10) % 24;
  return wd !== 'Sun' && hr >= 9 && hr < 18;
}

function dayKey(iso) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BIZ_TZ }).format(new Date(iso));
}

function onDnc(dncList, phone) {
  return (dncList || []).some(x => x.phone === phone);
}

function providerConfigured(env) {
  const e = env || process.env;
  return !!(e.VAPI_API_KEY && e.VAPI_ASSISTANT_ID && e.VAPI_PHONE_NUMBER_ID);
}

/* the checks every call must pass; returns '' when it may go ahead, else the reason in plain words */
function blockReason(lead, ctx) {
  const settings = Object.assign({}, DEFAULTS, ctx.settings || {});
  if (!settings.enabled) return 'AI calling is switched off. Switch it on in the AI calls screen first.';
  if (!lead.consentAt) return 'This person did not agree to be called, so they cannot be called.';
  if (!lead.phone) return 'There is no usable phone number for this person.';
  if (onDnc(ctx.dnc, lead.phone)) return 'This number is on the do-not-call list.';
  if (lead.status === 'calling') return 'A call to this person is already in progress.';
  if ((lead.attempts || 0) >= settings.maxAttempts) return 'This person has already been called ' + settings.maxAttempts + ' times.';
  if (!inCallWindow(ctx.now)) return 'Calls only go out Monday to Saturday, 9:00 am to 6:00 pm Jamaica time.';
  const today = dayKey((ctx.now || new Date()).toISOString());
  const todays = (ctx.calls || []).filter(c => c.lastCallAt && dayKey(c.lastCallAt) === today).length;
  if (todays >= settings.dailyCap) return 'The daily limit of ' + settings.dailyCap + ' calls has been reached.';
  if (!(ctx.configured != null ? ctx.configured : providerConfigured())) return 'The voice provider is not connected yet. Add its keys in Vercel (see docs/ai-call-script.md).';
  return '';
}

/* what the voice agent is told about this person; only what they typed on the form */
function leadVariables(lead) {
  return {
    name: String(lead.name || '').split(/\s+/)[0] || 'there',
    trip: lead.trip || 'your trip',
    dates: lead.dates || '',
    guests: lead.guests ? String(lead.guests) : '',
    budget: lead.budget || '',
    notes: lead.notes || ''
  };
}

async function placeCall(lead, env, fetchFn) {
  const e = env || process.env;
  const f = fetchFn || fetch;
  const r = await f('https://api.vapi.ai/call', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + e.VAPI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assistantId: e.VAPI_ASSISTANT_ID,
      phoneNumberId: e.VAPI_PHONE_NUMBER_ID,
      customer: { number: lead.phone, name: lead.name || undefined },
      assistantOverrides: { variableValues: leadVariables(lead) },
      metadata: { callId: lead.id }
    })
  });
  let data = {};
  try { data = await r.json(); } catch (x) { data = {}; }
  if (!r.ok) throw new Error((data && (data.message || data.error)) || ('The voice provider refused the call (status ' + r.status + ').'));
  return { providerCallId: String(data.id || '') };
}

/* the provider tells us how the call went; accepts our own simple shape or Vapi's end-of-call report */
function readReport(body) {
  const b = body || {};
  const m = b.message || {};
  const call = m.call || b.call || {};
  const analysis = m.analysis || b.analysis || {};
  const structured = analysis.structuredData || b.structuredData || {};
  const id = b.callId || (call.metadata && call.metadata.callId) || (m.metadata && m.metadata.callId) || '';
  let outcome = String(b.outcome || structured.outcome || '').toLowerCase();
  if (OUTCOMES.indexOf(outcome) < 0) outcome = '';
  const ended = String(m.endedReason || b.endedReason || '');
  if (!outcome) {
    if (/voicemail/i.test(ended)) outcome = 'voicemail';
    else if (/no-answer|did-not-answer|busy|customer-did-not/i.test(ended)) outcome = 'no_answer';
  }
  return {
    id: String(id || ''),
    providerCallId: String(call.id || b.providerCallId || ''),
    outcome: outcome,
    summary: String(b.summary || m.summary || analysis.summary || '').slice(0, 2000),
    endedReason: ended.slice(0, 120),
    isReport: !m.type || m.type === 'end-of-call-report'
  };
}

function secretOk(headerValue, secret) {
  if (!secret || !headerValue) return false;
  const a = Buffer.from(String(headerValue)), b = Buffer.from(String(secret));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { BIZ_TZ, OUTCOMES, DEFAULTS, normalizePhone, inCallWindow, dayKey, onDnc, providerConfigured, blockReason, leadVariables, placeCall, readReport, secretOk };
