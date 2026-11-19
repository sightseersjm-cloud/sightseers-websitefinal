const db = require('../_lib/db');
const crypto = require('crypto');
const { requireAuth, requireAdmin, getUser, uid, escapeHtml, requirePerm, can, hashPassword, validatePassword, createToken } = require('../_lib/auth');
const { sendEmail } = require('../_lib/email');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Sign in required' });

      const bookings = await db.getCollection('bookings');
      if (await can(user, 'inbox')) return res.status(200).json({ ok: true, bookings });

      const mine = bookings.filter(b => b.userId === user.id || b.email === user.email);
      return res.status(200).json({ ok: true, bookings: mine });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'create' || !action) {
        let user = getUser(req);
        const { name, email, phone, tourId, tourName, date, endDate, guests, notes, type, stayId, stayName, checkIn, checkOut, callConsent } = req.body || {};
        if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

        /* a guest who is not signed in gets a Sight Seers account for their email (as trip requests do), so the booking is on their profile */
        const bookingEmail = String(email).trim().toLowerCase();
        let session = null;
        if (!user) {
          try {
            const users = await db.getCollection('users');
            const found = users.find(u => String(u.email || '').toLowerCase() === bookingEmail);
            if (found) user = found;
            else {
              const pw = typeof req.body.password === 'string' ? req.body.password : '';
              if (pw) { const pwErr = validatePassword(pw); if (pwErr) return res.status(400).json({ error: pwErr }); }
              const acct = { id: uid(), name: String(name).trim(), email: bookingEmail, passwordHash: hashPassword(pw || (crypto.randomBytes(18).toString('hex') + 'Aa1')), phone: (phone || '').trim(), style: 'Adventure', role: 'guest', provider: pw ? 'booking' : 'booking-link', createdAt: new Date().toISOString() };
              await db.addToCollection('users', acct);
              user = acct;
              await sendEmail({
                subject: 'Your Sight Seers account is ready',
                html: `<p>Hi ${escapeHtml(String(name).trim().split(/\s+/)[0] || 'there')},</p><p>We opened a Sight Seers account for you with this email address, so your booking request is on your profile.</p>` + (pw ? '<p>Your password is the one you chose.</p>' : `<p><b>To sign in, set your password first:</b> open the sign-in page, choose <b>Forgot password</b>, and enter <b>${escapeHtml(bookingEmail)}</b>.</p>`),
                to: bookingEmail
              }).catch(() => {});
              if (pw) { const tokenStr = createToken({ id: acct.id, email: acct.email, name: acct.name, role: acct.role }); if (tokenStr) { const { passwordHash, ...safeUser } = acct; session = { token: tokenStr, user: safeUser }; } }
            }
          } catch (e) { console.error('booking account', e && e.message); }
        }

        const booking = {
          id: uid(),
          userId: user ? user.id : null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: (phone || '').trim(),
          tourId: tourId || null,
          tourName: (tourName || '').trim(),
          stayId: stayId || null,
          stayName: (stayName || '').trim(),
          date: date || '',
          endDate: endDate || '',
          /* only an explicit tick counts; the time it was given is kept with the booking */
          callConsent: callConsent === true,
          callConsentAt: callConsent === true ? new Date().toISOString() : '',
          checkIn: checkIn || '',
          checkOut: checkOut || '',
          guests: guests || 1,
          notes: (notes || '').trim(),
          type: type || 'tour',
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        await db.addToCollection('bookings', booking);
        if (booking.callConsent) { try { await require('./ai-calls').enqueueFromBooking(booking); } catch (e) { console.error('ai call queue', e && e.message); } }
        const isStay = booking.type === 'stay';
        await sendEmail({
          subject: `New ${isStay ? 'Stay' : 'Tour'} Booking: ${escapeHtml(booking.tourName || booking.stayName || 'Sight Seers')}`,
          html: `
            <h2 style="color:#0d5371">New ${isStay ? 'Stay' : 'Tour'} Booking: Sight Seers Caribbean</h2>
            <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Name</td><td style="padding:8px">${escapeHtml(booking.name)}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${escapeHtml(booking.email)}</td></tr>
              ${booking.phone ? `<tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${escapeHtml(booking.phone)}</td></tr>` : ''}
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">${isStay ? 'Stay' : 'Tour'}</td><td style="padding:8px">${escapeHtml(booking.stayName || booking.tourName || 'Not provided')}</td></tr>
              ${isStay ? `
              <tr><td style="padding:8px;font-weight:bold">Check-in</td><td style="padding:8px">${escapeHtml(booking.checkIn || 'Not provided')}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Check-out</td><td style="padding:8px">${escapeHtml(booking.checkOut || 'Not provided')}</td></tr>
              ` : `<tr><td style="padding:8px;font-weight:bold">Start date</td><td style="padding:8px">${escapeHtml(booking.date || 'Not provided')}</td></tr><tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">End date</td><td style="padding:8px">${escapeHtml(booking.endDate || 'Not provided')}</td></tr>`}
              <tr><td style="padding:8px;font-weight:bold">Guests</td><td style="padding:8px">${escapeHtml(booking.guests)}</td></tr>
              ${booking.notes ? `<tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold;vertical-align:top">Notes</td><td style="padding:8px">${escapeHtml(booking.notes)}</td></tr>` : ''}
              <tr><td style="padding:8px;font-weight:bold">Status</td><td style="padding:8px;color:#e67e22;font-weight:bold">Pending, action required</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Received</td><td style="padding:8px">${new Date(booking.createdAt).toLocaleString('en-US',{timeZone:'America/Jamaica'})}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px">This booking was submitted via sightseerscaribbean.com</p>`
        });
        return res.status(201).json(Object.assign({ ok: true, booking, account: user && booking.userId ? 'linked' : 'none' }, session ? { token: session.token, user: session.user } : {}));
      }

      if (action === 'update-status') {
        const admin = await requirePerm(req, res, 'inbox');
        if (!admin) return;

        const { id, status: newStatus, adminNote } = req.body;
        if (!id || !newStatus) return res.status(400).json({ error: 'Booking ID and status required' });

        const updates = { status: newStatus };
        if (adminNote) updates.adminNote = adminNote;
        updates.updatedBy = admin.id;

        const booking = await db.updateInCollection('bookings', id, updates);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        return res.status(200).json({ ok: true, booking });
      }

      if (action === 'delete') {
        const admin = await requirePerm(req, res, 'inbox');
        if (!admin) return;

        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Booking ID required' });

        const removed = await db.removeFromCollection('bookings', id);
        if (!removed) return res.status(404).json({ error: 'Booking not found' });

        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Bookings error:', err && err.message, err && err.stack);
    return res.status(500).json({ error: err && err.message ? err.message : 'Something went wrong. Please try again.' });
  }
};
