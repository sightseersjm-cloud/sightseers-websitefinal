# Participant waiver (/waiver)

**What it does:** a guest opens `/waiver`, fills in their details and medical answers, reads the waiver, and signs on screen. The browser builds a signed PDF. The server (`api/_handlers/waiver.js`, route `/api/waiver`) emails that PDF to the guest **and** to the team, and adds a short record to the Inbox. Medical answers stay in the PDF only. The Inbox record shows only a "medical flag" (yes or no).

**Links you can share:** `/waiver` (general), `/waiver?event=summit&ref=SS-2026-014` (Summit Challenge with the booking reference filled in). Put the second kind in proposals, booking emails and QR codes. Everyone from one company uses the same reference, so their waivers group together.

**Changing the wording:** edit `api/_data/waiver.json` (clauses, medical questions, the list of activities, the photo clause), then run `npm run build`. The page, the PDF and the server all read that one file. Add a new activity by adding an entry to `events` (the `activities` text fills clause 1). `npm run test:waiver` checks that the page matches the file.

**Counting signatures:** the signed-in team can call `GET /api/waiver?ref=SS-2026-014` to see who has signed for a booking.

**Status of the wording:** it was drafted by Claude from the Summit Challenge proposal. It has **not** been reviewed by a lawyer. Questions the owner needs to settle (taken out of the guest-facing text):

- What this does not cover: Lawyer to confirm the correct wording for Jamaican law.
- Emergency treatment: Confirm whether the venue or event insurance covers participants.
- Insurance: Confirm what, if any, cover Sight Seers or the venue holds.
- My details: Confirm retention period and privacy wording.
- Governing law: Lawyer to confirm.
- Understanding: Confirm whether under-18s may take part and how a parent or guardian signs.

Set `"showNotice": true` in `waiver.json` to show a "wording under review" notice on the page.
