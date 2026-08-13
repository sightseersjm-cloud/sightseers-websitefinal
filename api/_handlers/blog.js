const db = require('../_lib/db');
const { requireAdmin, requireAuth, getUser, uid } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id, type } = req.query || {};

    if (type === 'requests') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const requests = await db.getCollection('blog-requests');
      return res.status(200).json({ ok: true, requests });
    }

    const posts = await db.getCollection('blog-posts');
    if (id) {
      const post = posts.find(p => p.id === id);
      return post ? res.status(200).json({ ok: true, post }) : res.status(404).json({ error: 'Post not found' });
    }
    const published = posts.filter(p => p.status === 'published');
    return res.status(200).json({ ok: true, posts: published });
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'submit-request') {
      const user = getUser(req);
      const { name, email, topic, outline, sampleUrl } = req.body;
      if (!name || !email || !topic) return res.status(400).json({ error: 'Name, email and topic required' });

      const request = {
        id: uid(),
        userId: user ? user.id : null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        topic: topic.trim(),
        outline: (outline || '').trim(),
        sampleUrl: (sampleUrl || '').trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('blog-requests', request);
      return res.status(201).json({ ok: true, request });
    }

    if (action === 'review-request') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id, status: newStatus, note } = req.body;
      if (!id || !newStatus) return res.status(400).json({ error: 'Request ID and status required' });

      const request = await db.updateInCollection('blog-requests', id, {
        status: newStatus,
        adminNote: note || '',
        reviewedBy: admin.id
      });
      if (!request) return res.status(404).json({ error: 'Request not found' });

      return res.status(200).json({ ok: true, request });
    }

    if (action === 'create') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { title, slug, excerpt, content, coverImage, author, tags, category } = req.body;
      if (!title) return res.status(400).json({ error: 'Title required' });

      const post = {
        id: uid(),
        title: title.trim(),
        slug: slug || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        excerpt: (excerpt || '').trim(),
        content: content || '',
        coverImage: coverImage || '',
        author: author || admin.name,
        tags: tags || [],
        category: (category || 'travel').trim(),
        status: 'published',
        createdBy: admin.id,
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('blog-posts', post);
      return res.status(201).json({ ok: true, post });
    }

    if (action === 'update') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Post ID required' });
      delete updates.action;

      const post = await db.updateInCollection('blog-posts', id, updates);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      return res.status(200).json({ ok: true, post });
    }

    if (action === 'delete') {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Post ID required' });

      const removed = await db.removeFromCollection('blog-posts', id);
      if (!removed) return res.status(404).json({ error: 'Post not found' });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
