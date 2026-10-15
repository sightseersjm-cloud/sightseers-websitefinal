# Travel Club: join an approved trip, or lead one

The Travel Club is two paths on one page.

- **Join a trip.** A traveler browses departures that Sight Seers has approved, reads the package, and asks to join. Sight Seers confirms availability and payment terms by email. Nothing is charged on the website.
- **Lead a trip.** An organizer (a creator, a birthday organizer, an alumni representative, a club, a fitness instructor or another group leader) applies. Sight Seers reviews the application, agrees the package, the dates and the reward in writing, opens a personal trip page, supports the recruitment, manages the bookings and coordinates delivery.

Nobody can publish a trip on their own. A trip exists only when an admin enters it and opens it.

Travel Points, accounts, bookings and the existing account area are unchanged. The Travel Club is added next to them.

## What was added

| Where | What |
| --- | --- |
| `/travel-club` | The program page: two compact path cards, approved departures, how leading a trip works, an apply panel, questions. Also in the main menu, the phone menu, the footer and the home page Travel Club section. The boxes carry no photos; they lean toward the pointer and take an orange edge, like the Flagship cards. |
| Application sheet | "Apply to lead a trip" opens a four step sheet in the style of the Leaders in Jamaica application (frosted sheet on desktop, bottom sheet on phones). See below. |
| `/trip/<slug>` | A personal trip page: title, summary, dates, price as written by an admin, what is included, the organizer (if shown), the request form, a share link. Served by the existing single page app; no new file per trip. |
| Account, **Group trips** tab | The member dashboard. See "The dashboard" below. |
| Admin portal, **Travel Club trips** | Applications, Trips, Requests and Partner links. Needs a real admin sign-in. |
| `api/_handlers/trips.js` | The API, registered as `trips` in `api/[...route].js` (no new serverless function, so the 12 function limit is untouched). |

## The application (four steps)

Every "Apply to lead a trip" button opens the same sheet. Each step is checked before it moves on, Back keeps the answers, and nothing is charged or promoted.

1. **About you.** Full name, email, phone (optional), city and country.
2. **Your community.** Who they lead (creator or influencer, birthday or celebration organizer, alumni or school representative, club or association, fitness instructor or coach, faith or community group, other group leader), the community name, a link (optional), the size of the community, how they reach people (Instagram, TikTok, YouTube, WhatsApp or group chat, email list, events or in person, other; several allowed) and whether they have organized group trips or only events, or none yet.
3. **The trip.** Where they would like to go (Jamaica, Barbados, Saint Lucia, The Bahamas, Belize, the Dominican Republic, Curacao, or not sure yet), the exact number of people they would invite (a whole number from 1 to 1000, typed into a box), the kind of trip (adventure, villa and relaxation, celebration, wellness or fitness, culture and food, group retreat or learning; several allowed) and when.
4. **In your own words.** Why they want to lead a trip (20 to 700 characters), anything else we should know, and consent to be contacted about the application.

All answers are saved with the application and shown to the team in the admin portal. The applicant gets a confirmation reference (TL-...) and an email; the team gets the full answers by email. The older Travel Points sign-up logic is not triggered by it.

## The dashboard (Account, Group trips tab)

What an applicant or organizer sees, top to bottom:

1. **Your trip requests.** Trips they asked to join, each with its reference, party size and status.
2. **Your organizer space.**
   - **Your application** card: community name, reference, date, status, and a four step tracker (Received, In review, Decision, Trip page live). It shows "More info needed" when the team asks a question, and the team's message appears on the card.
   - **The number of people they plan to invite**, large, with a Change button. They can change it themselves any time before the application is declined. The team sees the new number straight away.
   - **What they told us:** who they lead, where they are based, community size, how they reach people, past group trips, destination, kind of trip and timing, with their own words one tap away.
   - **Your trips** (once the team opens a trip): the share link, an **invite goal** bar (people who asked to join, and how many are booked, against the number they said they would invite), counts by status, recruits by first name, and the reward they agreed. The goal comes from the application the trip was drafted from; a trip entered by hand has no goal bar.
3. **Before you go.** Travel insurance and eSIM referral cards (see below). Shown to every signed-in member.

Applicants never see the team's private notes, who reviewed the application, or any traveler's email, phone or message.

## Partner links: travel insurance and eSIM

The two cards under **Before you go** are written by an admin, not by code. In the admin portal, open **Travel Club trips**, then **Partner links**:

- Paste your referral link for each partner. It must start with `https://`. Anything else is refused.
- **eSIM is Saily** by default (`https://saily.com/`, shown with the Saily logo from `public/logos/saily.png`; Saily is also on the Partners page). Paste your own Saily referral link to replace the plain address, or leave the box empty to fall back to https://saily.com/.
- Optionally change the title and the short note on each card. Without them the cards say "Travel insurance: Cover for cancellations, delays and medical care while you travel." and "eSIM: Land connected, without swapping your SIM or paying roaming." These are general descriptions, not claims about any partner.
- Until an insurance link is set, that card says **Link coming soon** and has no button.
- The line under the cards says, by default: "These are referral links. Sight Seers may receive a reward if you sign up through them." Replace it in the **Disclosure** box so it matches your agreement with each partner.
- The links open in a new tab and are marked `rel="sponsored noopener noreferrer"`.

No price, discount or commission is built into the site. The only built-in partner is Saily for eSIM; there is no insurance partner yet.

## WhatsApp Channel

The Sight Seers WhatsApp Channel (`https://www.whatsapp.com/channel/0029VbCaiVTGehERQ13cpR2v`) is linked in four places, and counted as `whatsapp_channel_click` in analytics:

- the account dashboard, in **Follow the journey**, next to Instagram and TikTok;
- the footer icons on every page;
- the Contact page list;
- the Travel Club page, in the "Do not see the right trip?" panel, as the way to see new departures as they are announced.

To change the address, search `Design_Reference.html` for `0029VbCaiVTGehERQ13cpR2v` and replace it in each place, then run `node build.js`.

## Running it

1. **An application arrives.** The team is emailed and the applicant gets a confirmation. Open the admin portal, **Travel Club trips**, **Applications**.
2. **Decide.** *Ask for more info*, *Approve* or *Decline*. The message you type is emailed to the applicant and shown in their account. Tick **Draft a trip from this application** when approving, and the application becomes a draft trip led by that person.
3. **Finish the trip.** In **Trips**, open the draft and fill in the summary, the dates, what is included, the price as you want it shown, and the seats. (A photo address can be entered and is kept with the trip, but the Travel Club boxes and trip pages are designed to work without one.) Put the **agreed reward** in the private field. Set the status to **Open** when the offer is agreed. A trip cannot open without a summary and dates.
4. **Share.** The trip is now public at `/trip/<slug>` and listed on `/travel-club`. The organizer sees the same link in their account under **Group trips** and can add a tag (for example `instagram`) to see where sign-ups come from.
5. **Follow the requests.** Each request is emailed to the team and appears under **Requests**. Move it through `new`, `contacted`, `confirmed`, `booked`, `cancelled` or `waitlist`. Confirmed and booked travelers come off the seat count automatically.
6. **Close.** Set the trip to **Full** (the page then offers the waitlist) or **Closed** (it leaves the public list and stops taking requests). A trip that has requests cannot be deleted; close it instead.

## What is public and what is private

Public: title, destination, dates, summary, description, what is included, the price text, the payment note, the seat count (only if an admin set seats), and the organizer's name, community and bio (only if the admin chose to show them).

Private to admins: the organizer's email, the reward text and status, internal notes, every traveler's email, phone and message.

Organizers see: their own trips, counts by status, and each recruit's **first name, number of travelers, source tag and status**. Never an email, phone, message or note.

## Rewards

Rewards are not set by the code. There is no default rate and no formula. An admin writes what was agreed for each trip in the private **Agreed reward** field, and a status (`not set`, `agreed`, `earned`, `paid`). The organizer sees that text and status in their account. Trip pages for organizer-led trips say, in plain words, that the organizer receives a reward from Sight Seers for travelers who book.

## Emails

Sent through the existing Resend helper (`RESEND_API_KEY`, `RESEND_FROM`, `BUSINESS_EMAIL`).

| When | To |
| --- | --- |
| A traveler asks to join, or asks to hear when a departure opens | The traveler (confirmation) and the team |
| Someone applies to lead a trip | The applicant (confirmation) and the team |
| An application is approved, declined, or needs more information | The applicant, with your message (can be switched off per decision) |

## Seats, waitlists and duplicates

- Seats are shown only when an admin enters a number above zero. Nothing is invented.
- A request that would take a trip over its seats, or any request to a trip marked Full, is recorded as **waitlist**.
- The same email asking twice for the same trip is told it already asked; no second record is made. The same email with an open application is told so.
- The forms carry a hidden field that only bots fill in, and a per address limit (10 requests per 10 minutes, 10 applications per 30 minutes).

## Deliberately not built

- **Payments for these trips.** Terms are confirmed by email first, then handled the way Sight Seers handles any booking. The older Stripe deposit flow is not used here.
- **Payouts or reward calculations.** Rewards are recorded, not computed.
- **Organizers editing their own page or publishing.** An admin controls every word that is public.
- **Notifying the organizer of each new request.** They see their recruits in their account.
- **Tracking clicks on the partner links.** They are plain links. Use your partner's own dashboard for referral reporting.
- **Trip pages in the sitemap.** `/travel-club` is in it; individual `/trip/<slug>` pages are not, because they are added at runtime.

## Before this goes live

- Read the **Privacy Policy** and make sure it covers collecting names, emails and phone numbers for trip requests and applications (the site already collects similar details for bookings and the contact form).
- Decide the written agreement an organizer signs before a trip opens. The site only records the outcome.
- Set `RESEND_API_KEY` and `BUSINESS_EMAIL` in Vercel if they are not already set, or the confirmation emails will be skipped (the requests are still saved).

## Data

Four JSON documents in the existing Vercel Blob store: `club-trips`, `club-applications`, `club-interests` and `club-settings` (the partner links), under `ss-data/`.

## How it was checked

- `api/_handlers/trips.js`: 106 checks against an in memory store and a recording mailer. Permissions, validation, privacy of the public and organizer views, seats, waitlists, duplicates, the approval flow and email content.
- The whole flow in a browser, against that same handler: the program page, departures, trip pages (including opening an address directly), every form and its error messages, every step of the application sheet (validation, Back, the option boxes, the confirmation, closing it, phones), the organizer and traveler account views, the admin section, no icons or emoji, light and night themes, and widths from 320 to 1280.
