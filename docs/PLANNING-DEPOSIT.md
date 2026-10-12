# US$15 planning deposit ("Build My Custom Trip")

The button **Build My Custom Trip · US$15** appears on the Travel Form page and the Start Planning page.
One click does two things: it sends the guest's trip preferences to the team, then opens secure checkout.

## Flow

1. The page calls `POST /api/planning-request` (`api/_handlers/planning-request.js`) with the guest's name,
   email, phone and a text summary of their preferences.
2. The server saves the request in the `planning-requests` collection (status `awaiting-deposit`) and sends:
   - the team an email: `[PR-XXXXXX] New custom trip request, awaiting US$15 deposit: <name>`
   - the guest a copy with a "Pay the US$15 deposit" button (so a guest who closes checkout can come back)
3. The server returns the Stripe Payment Link with `prefilled_email` and `client_reference_id=PR-XXXXXX`
   added. The page opens it in a new tab.
4. When Stripe sends `checkout.session.completed`, `api/stripe-webhook.js` finds the request by that
   reference, marks it `deposit-paid`, and sends:
   - the team: `[PR-XXXXXX] US$15 deposit PAID, custom trip request: <name>` with the preferences
   - the guest: `We received your US$15 planning deposit: PR-XXXXXX`
   Re-delivered webhook events are ignored once a request is marked paid.

## Payments with no request attached

A US$15 Payment Link payment with no `PR-` reference (an old tab, or a saved link) still gets its own emails:
the team is told "no trip request on file", and the guest is asked to send their preferences.
It is recognised as a Payment Link session for exactly 1500 cents (US$15) in USD with no `metadata.kind`.
These payments no longer get the V-Tours "Booking confirmed" email.

## Configuration

- The Payment Link is `https://buy.stripe.com/cNifZi2n0eIL1yyana5kk06` (override with `STRIPE_PLANNING_LINK`).
  Its price is set in Stripe, not here. To change the amount, create a new Payment Link, set
  `STRIPE_PLANNING_LINK`, and update the `1500` check in `isPlanningDeposit()` in `api/stripe-webhook.js`.
- The Stripe webhook endpoint must receive `checkout.session.completed` for Payment Link payments.
- Needs the existing `RESEND_API_KEY`, `BUSINESS_EMAIL` and blob storage settings.
- Admins can list requests with `GET /api/planning-request`.

## Not changed

Other Payment Link payments (for example the Leaders in Jamaica deposits) still go through the generic
confirmation email in `api/stripe-webhook.js`.
