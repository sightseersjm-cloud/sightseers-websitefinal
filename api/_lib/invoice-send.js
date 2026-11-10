/**
 * Sends an invoice: the email body plus the invoice as a PDF attachment, to the customer, with a copy to the team.
 */
const inv = require('./invoice');
const pdf = require('./invoice-pdf');
const { sendEmail, BUSINESS_EMAIL } = require('./email');

async function sendInvoice(invoice, opts) {
  const o = opts || {};
  const buf = await pdf.build(invoice);
  const file = 'Invoice-' + invoice.number + '.pdf';
  const parts = inv.emailParts(invoice, { stripeUrl: o.stripeUrl });
  const attachments = [{ filename: file, content: buf.toString('base64') }];
  const to = invoice.customerEmail;
  const sent = await sendEmail({ to, replyTo: inv.BIZ.email, subject: parts.subject, html: parts.html, text: parts.text, attachments });
  if (sent && sent.ok === false) return { ok: false, error: 'The invoice email did not go through.' };
  /* a copy to the team, so the invoice is on record in the business inbox */
  await sendEmail({ to: BUSINESS_EMAIL, replyTo: inv.BIZ.email, subject: 'Copy: ' + parts.subject + ' (to ' + to + ')', html: parts.html, text: parts.text, attachments });
  return { ok: true, filename: file, bytes: buf.length };
}

module.exports = { sendInvoice };
