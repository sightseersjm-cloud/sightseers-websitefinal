/**
 * api/_lib/club-payouts.js
 * A simple log of the rewards Sight Seers has paid to Travel Club leaders ('club-payouts').
 * The owner records each payment in the master admin (what, how, when, a reference); the leader sees their own on their trip card.
 * This only RECORDS payments made outside the site. Nothing here moves money.
 */

const db = require('./db');
const trip = require('./trip');
const { uid } = require('./auth');
const { sendEmail, BUSINESS_EMAIL } = require('./email');
const { helpers } = require('./club-auto');
const { button, first, safe, log, SITE } = helpers;

const PAYOUTS = 'club-payouts';
const TRIPS = 'club-trips';
const CURRENCIES = ['USD', 'JMD', 'CAD', 'GBP', 'EUR'];

function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200); }

async function add(admin, input) {
  const trips = await db.getCollection(TRIPS), t = trips.find(x => x.id === str(input.tripId, 80));
  if (!t) return { error: 'Choose the trip this reward is for.' };
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!isFinite(amount) || amount <= 0 || amount > 1000000) return { error: 'Enter the amount paid as a number above zero.' };
  const currency = CURRENCIES.indexOf(input.currency) > -1 ? input.currency : 'USD';
  const method = str(input.method, 60);
  if (!method) return { error: 'Say how it was paid, for example bank transfer or cash.' };
  const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(str(input.paidOn, 10)) ? str(input.paidOn, 10) : new Date().toISOString().slice(0, 10);
  const rec = { id: uid(), tripId: t.id, tripTitle: t.title, leaderName: t.organizerName || '', leaderEmail: t.organizerEmail || '', amount, currency, method, reference: str(input.reference, 80), paidOn, note: str(input.note, 300), createdAt: new Date().toISOString(), createdBy: admin.email || admin.id };
  await db.addToCollection(PAYOUTS, rec);
  if (input.markPaid) await db.updateInCollection(TRIPS, t.id, { rewardStatus: 'paid' });
  await log('payout', 'Reward paid for ' + t.title + ': ' + amount.toFixed(2) + ' ' + currency + ' by ' + method, t.id);
  let emailed = false;
  if (input.notify !== false && t.organizerEmail) {
    emailed = await safe('payout', sendEmail({ to: t.organizerEmail, replyTo: BUSINESS_EMAIL, subject: 'Your Travel Club reward has been paid: ' + t.title, html: trip.shell('Your reward has been paid',
      `<p>Hi ${trip.esc(first(t.organizerName))},</p><p>Thank you for leading <b>${trip.esc(t.title)}</b>. Your reward has been paid.</p>${trip.detailTable([['Amount', amount.toFixed(2) + ' ' + currency], ['Paid on', paidOn], ['Method', method], ['Reference', rec.reference], ['Note', rec.note]])}${button(SITE + '/account', 'Open my dashboard')}`, ' ') }));
  }
  return { payout: rec, emailed };
}
async function remove(admin, id) {
  const p = (await db.getCollection(PAYOUTS)).find(x => x.id === str(id, 80));
  if (!p) return { error: 'We could not find that payout.' };
  await db.removeFromCollection(PAYOUTS, p.id);
  await log('payout', 'Payout record removed for ' + p.tripTitle + ': ' + p.amount.toFixed(2) + ' ' + p.currency, p.tripId);
  return { ok: true };
}
function publicPayout(p) { return { id: p.id, amount: p.amount, currency: p.currency, method: p.method, reference: p.reference, paidOn: p.paidOn, note: p.note }; }

module.exports = { add, remove, publicPayout, PAYOUTS, CURRENCIES };
