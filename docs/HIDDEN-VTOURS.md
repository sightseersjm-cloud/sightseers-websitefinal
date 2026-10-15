# V-Tours is hidden until launch

The 360° V-Tours page is switched off, not deleted. Its page, dashboards, scripts and the static
`/virtual-tours/` landing pages are all still in the repository.

What hiding does:
- The `data-ss-vtours-hidden` attribute on the `<html>` tag in `Design_Reference.html` turns the hiding on.
- It hides the "360° V-Tours" item in the desktop menu, the V-Tours link in the mobile "More" menu,
  and the "V-Tours" and "Virtual Tour Pages" links in the footer (all tagged `data-vtours-link`).
- `nav('vtours')` and `#vtours` open the home page instead, and a visit to `/live-360` shows the home page.
- `vercel.json` has temporary (not permanent) redirects from `/live-360` and `/virtual-tours/...` to `/`.
- `/live-360` and the `/virtual-tours/` pages were removed from `public/sitemap.xml`.
- The V-Tours schema block and the V-Tours wording in the homepage meta tags were removed.

To show V-Tours again:
1. Remove `data-ss-vtours-hidden` from the `<html lang="en" ...>` tag in `Design_Reference.html`.
2. Delete the four `/live-360` and `/virtual-tours` redirects in `vercel.json`.
3. Add `/live-360` and the `/virtual-tours/` URLs back to `public/sitemap.xml` (`node build-tours.js` lists them).
4. Run `node build.js`.
