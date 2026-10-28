# Backup, restore, enquiries export and site check (/manage > Settings > Backup and site check)

Owner only. Every request goes to `/api/backup` (`api/_handlers/backup.js`) and is refused for anyone who is not the owner; the menu item is
hidden from everyone else.

## What a backup holds

The website's content: the six settings the admin writes (`ss_site_settings`, `ss_page_editor_settings`, `ss_stay_page_settings`,
`ss_dynamic_sections_v1`, `ss_text_edits_v1`, `ss_catalog_v1`), a few older settings kept for safekeeping, and, in a downloaded file, the content
collections (`blog-posts`, `sections`, `tours`, `stays`, `gallery`, `image-meta`, `site-history`). It never holds accounts, password hashes,
sign-in codes, customer records or any secret.

- **Save a backup on the website** stores the settings in private storage under `ss-admin/backups/<time>-<kind>.json`. The newest 12 are kept; older
  ones are removed when a new one is saved.
- **Download a backup file** returns the settings and collections as one JSON file (the change history is left out if the file would be over 4 MB).

## Restoring

"Put this back" (a saved backup) or "Put back a backup from a file" restores only the six content settings, and only the ones present in the
backup. Everything is checked before anything is written, with the same rules a normal save uses: catalog states go through
`catalog.cleanState`, added sections through `cleanSections`, wording and photo changes must be text or `https://` / `/` addresses, and any value
beginning with `javascript:`, `vbscript:` or a non-image `data:` is refused. Accounts and collections are never restored.

Before it writes, a restore saves what is live now as a `before-restore` backup, so a restore can be undone by restoring that one.

## Make the site lighter

Visitors download the settings document with every page. When photos are stored inside it as text (`data:image/...`) it grows large (the live
`ss_site_settings` was about 548 KB because the second home hero photo and the About photo were stored this way). "Make the site lighter" moves each
into a public file under `site-images/` and puts its address in the settings instead. Nothing changes on the pages. A `before-lighten` backup is
saved first, and photos over 4 MB or in an unknown form are left as they are.

## Enquiries export

A spreadsheet (CSV, opens in Excel or Sheets) of everything in the Enquiries and bookings inbox: received, type, title, name, email, phone, status,
assigned to, summary, details, private note, last handled. A cell that would start a spreadsheet formula (`=`, `+`, `-`, `@`) is prefixed with `'` so
it cannot run. The file holds customers' details, so the screen reminds the owner to keep it private.

## The site check

The server reports: the size of the settings and the photos stored inside them, changes waiting for approval, backups, and whether each of these
is set up (storage, sign-in secret, email sending, card payments, the cron secret, visitor counting) and whether the old `ADMIN_PASSCODE` setting is
still there. It returns only yes or no, never a value. The browser adds what only it can see: it checks that every photo on the website loads (the
photos in the lists, the home and About photos, photos changed with Edit on the page, and added sections), and which visible items have no photo or
description. It changes nothing.

Tests: `npm run test:backup`.
