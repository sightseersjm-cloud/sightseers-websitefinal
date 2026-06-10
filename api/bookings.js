const db = require('./_lib/db');
const { requireAuth, requireAdmin, getUser, uid } = require('./_lib/auth');

module.exports = async function handler(req, res) {
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
    const { action } = req.body;

    if (action === 'create') {
      const user = getUser(req);
      const { name, email, phone, tourId, tourName, date, guests, notes, type, stayId, stayName, checkIn, checkOut } = req.body;
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
};
