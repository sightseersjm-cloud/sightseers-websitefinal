const db = require('../_lib/db');
const { requireAdmin, requireAuth, requireEditor, getUser, uid } = require('../_lib/auth');

/* Build a URL-safe slug from a title. */
function slugify(s) {
  return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('post-' + Date.now());
}
/* Turn an approved request into a published post record. */
function postFromRequest(r, editor) {
  return {
    id: uid(),
    title: (r.title || r.topic || 'Untitled').trim(),
    slug: slugify(r.title || r.topic),
    excerpt: (r.excerpt || '').trim(),
    content: r.content || r.outline || '',
    coverImage: r.coverImage || r.image || '',
    author: r.name || r.authorName || 'Guest writer',
    tags: r.tags || [],
    category: (r.category || 'Guest Journal').trim(),
    status: 'published',
    fromRequestId: r.id,
    createdBy: editor.id,
    createdAt: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id, type } = req.query || {};

    if (type === 'requests') {
      const editor = requireEditor(req, res);
      if (!editor) return;
      const requests = await db.getCollection('blog-requests');
      requests.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
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
      const { name, email, title, topic, excerpt, content, coverImage, image, outline, category, sampleUrl } = req.body;
      const postTitle = (title || topic || '').trim();
      const body = (content || outline || '').trim();
      if (!name || !email || !postTitle) return res.status(400).json({ error: 'Name, email and a title are required' });
      if (!body) return res.status(400).json({ error: 'Please include the blog article content' });

      const request = {
        id: uid(),
        userId: user ? user.id : null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        title: postTitle,
        topic: postTitle,
        excerpt: (excerpt || '').trim(),
        content: body,
        coverImage: (coverImage || image || '').trim(),
        category: (category || 'Guest Journal').trim(),
        outline: (outline || '').trim(),
        sampleUrl: (sampleUrl || '').trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await db.addToCollection('blog-requests', request);
      return res.status(201).json({ ok: true, request });
    }

    if (action === 'review-request') {
      const editor = requireEditor(req, res);
      if (!editor) return;

      const { id, status: newStatus, note } = req.body;
      if (!id || !newStatus) return res.status(400).json({ error: 'Request ID and status required' });

      const request = await db.updateInCollection('blog-requests', id, {
        status: newStatus,
        adminNote: note || '',
        reviewedBy: editor.id
      });
      if (!request) return res.status(404).json({ error: 'Request not found' });

      return res.status(200).json({ ok: true, request });
    }

    /* One click: approve a member's request AND publish it as a live post. */
    if (action === 'approve-request') {
      const editor = requireEditor(req, res);
      if (!editor) return;

      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Request ID required' });

      const requests = await db.getCollection('blog-requests');
      const request = requests.find(r => r.id === id);
      if (!request) return res.status(404).json({ error: 'Request not found' });
      if (request.postId) {
        return res.status(200).json({ ok: true, alreadyPublished: true, postId: request.postId });
      }

      const post = postFromRequest(request, editor);
      await db.addToCollection('blog-posts', post);
      await db.updateInCollection('blog-requests', id, {
        status: 'approved',
        reviewedBy: editor.id,
        postId: post.id,
        approvedAt: new Date().toISOString()
      });

      return res.status(201).json({ ok: true, post });
    }

    if (action === 'create') {
      const admin = requireEditor(req, res);
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
      const admin = requireEditor(req, res);
      if (!admin) return;

      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Post ID required' });
      delete updates.action;

      const post = await db.updateInCollection('blog-posts', id, updates);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      return res.status(200).json({ ok: true, post });
    }

    if (action === 'delete') {
      const admin = requireEditor(req, res);
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
