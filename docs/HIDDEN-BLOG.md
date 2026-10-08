# Blog is hidden for now

The Blog page is switched off, not deleted. Its page, articles and admin tools are all still in `Design_Reference.html`.

What hiding does:
- The `data-ss-blog-hidden` attribute on the `<html>` tag in `Design_Reference.html` turns the hiding on.
- It hides the Blog link in the desktop About menu, the mobile menu and the footer ("Travel Blog"), and the "Read the Full Article" button in the Seven Shores
  section on the home page (all tagged `data-blog-link`).
- `nav('blog')`, `#blog` and `openBlog()` do nothing while the attribute is on; a visit to `/blog` shows the home page.
- `vercel.json` has a temporary (not permanent) redirect from `/blog` to `/`, and `/blog` is removed from `public/sitemap.xml`.

To show the Blog again:
1. Remove `data-ss-blog-hidden` from the `<html lang="en" ...>` tag in `Design_Reference.html`.
2. Delete the two `/blog` redirects in `vercel.json`.
3. Add the `/blog` entry back to `public/sitemap.xml` (https://www.sightseerscaribbean.com/blog, weekly, priority 0.75).
4. Run `node build.js`.

The blog request form (the "write for us" page and its admin list) was left as it was.
