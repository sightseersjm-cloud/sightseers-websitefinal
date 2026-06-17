const db = require('./_lib/db');
const { requireAuth, requireAdmin, getUser, uid } = require('./_lib/auth');
const { sendEmail } = require('./_lib/email');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Sign in required' });

      const bookings = await db.getCollection('bookings');
      if (user.role === 'admin') return res.status(200).json({ ok: true, bookings });

      const mine = bookings.filter(b => b.userId === user.id || b.email === user.email);
      return res.status(200).json({ ok: true, bookings: mine });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'create' || !action) {
        const user = getUser(req);
        const { name, email, phone, tourId, tourName, date, guests, notes, type, stayId, stayName, checkIn, checkOut } = req.body || {};
        if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

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
          checkIn: checkIn || '',
          checkOut: checkOut || '',
          guests: guests || 1,
          notes: (notes || '').trim(),
          type: type || 'tour',
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        await db.addToCollection('bookings', booking);
        const isStay = booking.type === 'stay';
        await sendEmail({
          subject: `New ${isStay ? 'Stay' : 'Tour'} Booking — ${booking.tourName || booking.stayName || 'Sight Seers'}`,
          html: `
            <h2 style="color:#0d5371">New ${isStay ? 'Stay' : 'Tour'} Booking — Sight Seers Caribbean</h2>
            <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
              <tr><td style="padding:8px;font-weight:bold;width:140px">Name</td><td style="padding:8px">${booking.name}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${booking.email}">${booking.email}</a></td></tr>
              ${booking.phone ? `<tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${booking.phone}</td></tr>` : ''}
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">${isStay ? 'Stay' : 'Tour'}</td><td style="padding:8px">${booking.stayName || booking.tourName || '—'}</td></tr>
              ${isStay ? `
              <tr><td style="padding:8px;font-weight:bold">Check-in</td><td style="padding:8px">${booking.checkIn || '—'}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Check-out</td><td style="padding:8px">${booking.checkOut || '—'}</td></tr>
              ` : `<tr><td style="padding:8px;font-weight:bold">Date</td><td style="padding:8px">${booking.date || '—'}</td></tr>`}
              <tr><td style="padding:8px;font-weight:bold">Guests</td><td style="padding:8px">${booking.guests}</td></tr>
              ${booking.notes ? `<tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold;vertical-align:top">Notes</td><td style="padding:8px">${booking.notes}</td></tr>` : ''}
              <tr><td style="padding:8px;font-weight:bold">Status</td><td style="padding:8px;color:#e67e22;font-weight:bold">Pending — action required</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Received</td><td style="padding:8px">${new Date(booking.createdAt).toLocaleString('en-US',{timeZone:'America/Jamaica'})}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px">This booking was submitted via sightseerscaribbean.com</p>`
        });
        return res.status(201).json({ ok: true, booking });
      }

      if (action === 'update-status') {
        const admin = requireAdmin(req, res);
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
        const admin = requireAdmin(req, res);
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
