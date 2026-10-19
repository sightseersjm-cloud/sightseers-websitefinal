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
- **eSIM is Saily** by default (`https://go.saily.site/aff_c?offer_id=101&aff_id=14170`, shown with the Saily logo from `public/logos/saily.png`; Saily is also on the Partners page). Paste your own Saily referral link to replace the plain address, or leave the box empty to fall back to https://saily.com/.
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
- **Reward calculations or sending money.** A payout log exists (below), but it only records what you paid outside the site. Nothing is computed and no money moves.
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


## Update: account on apply, departures schedule, separate admin

- **Applying creates an account.** Step 1 of the application asks signed-out applicants to choose a password. When the full application is submitted, an account is created for that email (if there is none) and the applicant is signed in and taken to Account > Group trips, where the application shows as pending. An email address that already has an account keeps its own password and is not signed in by the application. An incomplete application creates nothing. (An API caller that sends no password gets an account with an unknown password and an email telling them to use Forgot password.)
- **Forgot password** works for every account: Sign in > Forgot password > enter the email > a 6-digit code is emailed (valid 30 minutes) > choose a new password.
- **You are told about every application.** You get an email, and the next time you open your account or the Travel Club admin you get a popup per new application with a "Review application" button.
- **Travel Club admin** is its own page (sign in with the owner email and password through the regular Sign in button; the website admin keeps its passcode). Tabs: Overview, Applications, Accounts, Trips, Requests, Partner links. **Accounts** lists every account with name, email, phone, source, join date, Travel Club status and trips led or joined, with search and a CSV download. Passwords are never shown.
- **Approved departures** is a schedule panel on the Travel Club page: one row per open trip (date, title, leader, places left or waitlist) with live totals. When no trip is open it says the next departures are being announced and offers the notify form.
- **Start Planning and the Travel Form are one page.** `/contact` redirects to `/booking`.
- Night mode was removed.


## Update: invite kit, automatic emails, trip updates, passport checklist, reward log

All owner controls are in the **master admin** (Travel Club admin). New tabs: **Rewards**, **Destinations**, **Updates**, **Automatic emails**.

### Invite kit (leader dashboard)
Every live trip card has an **Invite kit**: a ready message (trip title, dates, place and the trip link, editable), **Copy message**, **Share on WhatsApp**, a **QR code** with **Download QR code**, and **Download share card** (a 1080 x 1350 PNG with the logo, the trip and the QR). It builds itself from the trip, so the leader sets nothing up. Adding a source tag ("instagram") updates the link in the message and the QR together. The QR library is the MIT-licensed `qrcode-generator`, served from `/vendor/qrcode.js` and loaded only when a kit is opened. Draft trips have no kit.

### Automatic emails (master admin > Automatic emails)
| Email | When | Default |
| --- | --- | --- |
| **Waitlist promotion** | A place opens (a cancellation, a deleted request, more seats, a trip reopened): the person who waited longest moves up to "new" and is emailed. People who asked earlier and are still waiting for confirmation keep their place first. | **On** |
| **Countdown reminders** | Confirmed and booked travelers, once at 14 days and once at 3 days before departure, with trip details and the group chat link. Needs a real **start date** on the trip (trips drafted from an application only have text dates until you set one under Trips). | **Off** |
| **Monday leader digest** | Each Monday, every leader of a live trip: new people this week, total joined, progress to their invite goal, places left, days to departure, and a nudge to use the invite kit. | **Off** |

- A daily job (`vercel.json` cron, 13:00 UTC = 8am Jamaica) calls `/api/club-cron`, which only runs with the `CRON_SECRET` bearer key (set in Vercel, never in the repo). Without the key it refuses everything.
- **Preview what would send today** lists every email and recipient and changes nothing (it shows everything as if all three switches were on). **Run today's emails now** runs the job on demand, following the switches.
- Every send is marked first (per traveler per milestone, per trip per week), so retries and repeat runs never double-send.

### Trip updates and advisories (master admin > Updates)
- A leader (or you) posts an update on **one trip**. Everyone who joined sees it under their request on their dashboard and gets an email (optional per post). Waitlisted and cancelled people get nothing. You get a copy of every leader post. Leaders can delete their own posts, you can delete any. Posting is limited to 12 an hour per person.
- An **advisory** is the same message sent to every upcoming trip set to one **country** (matched to the country on each trip, ignoring case and accents), one email per person even if they are on several of those trips, leaders included. **Preview who would get it** lists the trips and people first; Send is a second, deliberate step and only sends exactly what was previewed.
- Updates belong to a trip, never to a country; the country only decides which trips an advisory reaches. Deleting a trip removes its updates.

### Passport country and the before-you-go checklist
- **Optional** fields on the Profile and on the join form: the **country on your passport** and the **month it expires**. Never a passport number (the server stores only these two). Signed-in people have them pre-filled.
- Each active request (not waitlisted or cancelled) on the traveler's dashboard has a **Before you go** checklist with saved ticks: check your passport, read the entry rules for the destination, travel insurance and eSIM (your partner links), join the group chat. If no passport country is known it offers a one-field form.
- The passport check uses only dates we hold: expired before the trip ends, within six months of the trip, or fine. It never invents a country's validity rule. A Jamaican passport that needs renewing gets a link to Passport Renewal.
- **Entry rules come only from what you approve** (Destinations tab). Seven destinations were drafted from official government and tourism pages on 2026-10-15 (Jamaica, Belize, The Bahamas, Saint Lucia, Dominican Republic, Barbados, Curaçao) for United States, Canadian, British and Jamaican passports, in `api/_data/club-entry-drafts.json`. **On 2026-10-16 the owner approved every entry that has a summary and an official link: 26 of the 27 passport entries and all seven general cards.** The one still a draft is the Dominican Republic entry for Jamaican passports, which has no content (the research found no answer) and cannot be approved while it is empty. Entries the research was unsure of keep a review note in the Destinations tab (medium or low confidence, temporary rules such as the Dominican Republic exception to 31 December 2026, the current health notice in the Bahamas, and places where official pages disagree on length of stay); the traveler-facing text already says where a stay length could not be confirmed, and every card tells travelers to confirm on the official page. A second verification pass against the official pages was started but did not run (usage limit); it can be re-run, and any entry can be unapproved or edited in the master admin at any time. You cannot approve an entry without a summary and at least one official https link. Your edits and approvals are stored in `club-destinations` and override the drafts field by field; "Reset to the research draft" undoes them.
- A passport nobody has prepared (for example Nigeria) gets an honest "we have not prepared entry details for ... yet" message, never a guess. The Destinations tab lists which passports travelers have told us about and whether anything is approved for them, so you know what to research next.
- A trip finds its destination by the **country** set on the trip.

### Reward log (master admin > Rewards)
Record each reward paid to a leader: amount and currency (USD, JMD, CAD, GBP, EUR), how it was paid, a reference, the date, a note, whether to email the leader, and whether to mark the trip's reward as paid. The leader sees what you record under "Your reward" on their trip card. Records are kept if the trip is later deleted. **This only records payments made outside the site; it moves no money.**

### Still on hold: deposits
No deposit or payment collection for Travel Club trips has been built. It waits for the Stripe connector to be authorized and for refund and cancellation terms to be written.

### Data added
`club-updates`, `club-destinations`, `club-payouts`, and the `automation` document in `club-settings`.

### Update: applying with an account, leader trip details, sign-in page
- **Applying with an account you already have.** Signed in, the application sheet says "Applying with your account" with your name and email (locked) and creates no new account; the password box is gone (it used to be hidden in the page but still drawn, because a style rule overrode the hidden attribute). Signed out with an existing account, "Sign in instead" signs you in on the sheet. A brand new visitor still creates an account as before.
- **Leaders write their trip details.** The trip card in the leader's dashboard has a **Trip details for travelers** box (summary, what the trip involves, what is included). It shows on the public trip page the moment it is saved, credited "Written by ...", as plain text (never markup). Caps: summary 300, details 6000, 14 included lines of 140. An open trip needs a real summary. Dates, price, places, country and reward stay with Sight Seers. The owner is emailed about a leader's edit at most once an hour per trip, every edit is logged, the Trips tab notes "details edited by the leader", and the owner can edit anything there. A trip page with nothing written says "Trip details coming soon".
- **Departures board** line: "Group trips led by people from our community. Click View trip to join a trip."
- **Sign-in page**: the left card is a white card with the same green-to-orange top line as the sign-in card, white step cards with an orange accent, an orange button, and both cards the same height.


### Update: profile photos and the leader's intro
- **Profile photo for every account.** Profile > Photo: choose a JPEG, PNG or WebP picture. The browser crops it to a square (480 px) before upload; the server checks the file's real type from its first bytes (no SVG) and refuses anything over 700 KB. It is stored in Vercel Blob under a random file name, so the address never contains the account id. Replacing or removing a photo deletes the old file. The admin passcode session cannot set one.
- **Where photos show.** Next to your name at the top of the account page, on the leader's "Led by" card on the public trip page (the leader's initial when there is no photo), and beside each traveler in the list on the leader's dashboard (nothing when there is no photo).
- **About you.** An optional intro on the Profile (up to 700 characters, plain text). A trip leader's intro shows on the public trip page in the "Led by" card, so guests can read who is leading before they join. It falls back to the intro written when the trip was set up, if any.
- Data added: `bio` and `avatarUrl` on the user record.
