# Automations (Admin, Automations)

All switches start **off**. They run once a day (the existing 8 am Jamaica daily job, `/api/club-cron`) and never send the same message twice to the same person.

| Switch | What it does |
|---|---|
| Follow up with quiet requests | Emails the Calendly link about a day after a request (and a softer nudge after four days) if no one has spoken to the guest. Stops when they book. |
| Notice Calendly bookings | Marks a request "call booked" when the guest books. Needs `CALENDLY_API_TOKEN` (a personal access token from Calendly, added in Vercel). |
| Payment reminders | Sent invoices: 3 days before due, on the day, 3 and 10 days after, with the PDF. |
| Waiver reminders | Confirmed bookings with no signed waiver (matched by email): 7 and 2 days before. |
| Getting ready email | 3 days before a confirmed trip. |
| After the trip email | 2 days after a confirmed trip ends; optional review link. |
| Morning summary | One email to the team each morning; Mondays add last week's numbers. |

Needs `CRON_SECRET` in Vercel (already used by the Travel Club daily job). The Calendly check was written from Calendly's public API without a live token to test against. Guests who reply STOP are added to the Do not email list by an admin; guests who tell the AI assistant they are not interested are skipped automatically.
