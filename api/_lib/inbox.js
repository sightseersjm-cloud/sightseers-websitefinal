/**
 * api/_lib/inbox.js
 * One inbox for every request that comes in through the website forms. The forms keep saving to their own
 * collections (and still email the team); this reads them all into one list the website manager can work through,
 * with a status and a private note kept on each record (inboxStatus / inboxNote).
 * Travel Club applications and join requests have their own admin tabs and are not repeated here.
 */
const STATUSES = ['new', 'in_progress', 'done'];

function s(v, n) { return String(v == null ? '' : v).trim().slice(0, n || 400); }
function line(parts) { return parts.filter(Boolean).join(' · '); }
function dateOnly(v) { return s(v, 10); }

/* each source: the collection, and how a record reads as an inbox item */
const SOURCES = {
  bookings: {
    collection: 'bookings',
    done: ['confirmed', 'completed', 'cancelled'],
    map: r => ({
      type: r.type === 'stay' ? 'Stay booking' : 'Tour booking',
      title: r.tourName || r.stayName || 'Booking request',
      name: r.name, email: r.email, phone: r.phone,
      summary: line([r.type === 'stay' ? line([r.checkIn && 'In ' + r.checkIn, r.checkOut && 'Out ' + r.checkOut]) : (r.date && dateOnly(r.date)), r.guests && r.guests + ' guest' + (Number(r.guests) === 1 ? '' : 's')]),
      details: r.notes
    })
  },
  contact: {
    collection: 'contact-messages',
    done: ['replied', 'closed', 'done'],
    map: r => {
      const subj = s(r.subject, 160);
      const type = /tent rental/i.test(subj) ? 'Tent rental' : /travel form/i.test(subj) ? 'Travel form enquiry' : 'Contact message';
      return { type, title: subj || 'Message', name: r.name, email: r.email, phone: r.phone, summary: s(r.message, 120).replace(/\s+/g, ' '), details: r.message };
    }
  },
  planning: {
    collection: 'planning-requests',
    done: ['paid', 'deposit-paid', 'done'],
    map: r => ({ type: 'Planning request', title: 'Planning request ' + (r.ref || ''), name: r.name, email: r.email, phone: r.phone, summary: s(r.summary, 120).replace(/\s+/g, ' '), details: r.summary })
  },
  passport: {
    collection: 'passport-requests',
    done: ['done', 'completed'],
    map: r => ({ type: 'Passport renewal', title: 'Passport renewal request', name: r.name, email: r.email, phone: r.phone, summary: r.ia ? 'IA No. ' + r.ia : '', details: line([r.address ? 'Address: ' + r.address : '', r.shipAddress ? 'Ship passport to: ' + (r.shipSame ? 'the home address' : r.shipAddress) : '', 'Biography page: ' + (r.bioFile || ''), 'Photo: ' + (r.photoFile || '')].concat((r.contacts || []).map((c, n) => 'Emergency contact ' + (n + 1) + ': ' + [c.name, c.relationship, c.phone, c.email, c.address].filter(Boolean).join(', ')))) })
  },
  waitlist: {
    collection: 'vtours-waitlist',
    done: ['approved', 'declined', 'done'],
    map: r => ({ type: 'V-Tours waitlist', title: 'V-Tours waitlist', name: line([r.firstName, r.lastName]).replace(' · ', ' '), email: r.email, phone: '', summary: line([r.type, r.location]), details: r.bio })
  },
  groupTrips: {
    collection: 'group-trips',
    done: ['paid', 'done'],
    map: r => ({ type: 'Group trip deposit', title: line([r.country, r.guests && r.guests + ' guests']) || 'Group trip', name: r.contact && r.contact.name, email: r.contact && r.contact.email, phone: r.contact && r.contact.phone, summary: line([r.audience, (r.items || []).length + ' experiences']), details: (r.items || []).join(', ') })
  },
  consults: {
    collection: 'trip-consultations',
    done: ['done', 'closed'],
    map: r => ({ type: 'Consultation request', title: 'Consultation request', name: r.contact && r.contact.name, email: r.contact && r.contact.email, phone: r.contact && r.contact.phone, summary: line([r.consult && r.consult.channel, r.consult && r.consult.when]), details: r.consult && r.consult.notes })
  },
  preferences: {
    collection: 'trip-preferences',
    done: ['done'],
    map: r => ({ type: 'Group trip preferences', title: line([r.country, r.guests && r.guests + ' guests']) || 'Saved preferences', name: r.contact && r.contact.name, email: r.contact && r.contact.email, phone: r.contact && r.contact.phone, summary: line([r.audience, (r.items || []).length + ' experiences']), details: (r.items || []).join(', ') })
  }
};

function toItem(key, r) {
  const src = SOURCES[key], m = src.map(r) || {};
  const own = STATUSES.indexOf(r.inboxStatus) > -1 ? r.inboxStatus : (src.done.indexOf(r.status) > -1 ? 'done' : 'new');
  return {
    key: key + ':' + r.id, source: key, id: r.id, ref: r.ref || '', type: m.type, title: s(m.title, 160), name: s(m.name, 120), email: s(m.email, 160), phone: s(m.phone, 60),
    summary: s(m.summary, 160), details: s(m.details, 3000), status: own, note: s(r.inboxNote, 1000), createdAt: r.createdAt || '', handledAt: r.inboxAt || '',
    assignee: r.inboxAssignee && r.inboxAssignee.id ? { id: String(r.inboxAssignee.id), name: s(r.inboxAssignee.name, 120) } : null,
    thread: Array.isArray(r.inboxThread) ? r.inboxThread.slice(-60) : []
  };
}

async function collect(db) {
  const keys = Object.keys(SOURCES);
  const lists = await Promise.all(keys.map(k => db.getCollection(SOURCES[k].collection).catch(() => [])));
  const items = [];
  keys.forEach((k, i) => (lists[i] || []).forEach(r => { if (r && r.id) items.push(toItem(k, r)); }));
  items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return items;
}

function counts(items) {
  const c = { total: items.length, new: 0, in_progress: 0, done: 0, byType: {} };
  items.forEach(i => { c[i.status]++; if (i.status !== 'done') c.byType[i.type] = (c.byType[i.type] || 0) + 1; });
  return c;
}

module.exports = { SOURCES, STATUSES, collect, counts, toItem };
