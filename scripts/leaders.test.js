// Leaders in Jamaica page: copy rules from the brief, downloads, application form fields.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'Design_Reference.html'), 'utf8');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } };

const a = src.indexOf('<div class="page" id="p-leaders-jamaica">');
const b = src.indexOf('<div class="page" id="p-mba-voyages">', a);
const block = src.slice(a, b);
const text = block.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');

// things that must not appear
['1,326.50', 'early commitment', 'Early commitment', '1,795', '538.50', '1,256.50', '—', '–', 'February', 'Feb ', '2026', '2027', '1,270', '1,195', '1,220', '1,145', '1,170', '1,095', 'oundin', 'Partner with us',
 'rum tasting', '12 to 15', '16 to 25', 'place deposit', 'hildren', 'illa fee', 'illa quotation', 'three class days', 'Wednesday to Sunday', 'program '
].forEach(w => ok(text.indexOf(w) === -1, 'page must not contain "' + w + '"'));
ok(!/\b(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day \d/.test(text), 'no weekday-with-date strings');

// things that must appear (exact copy)
[
 'Six days. Two student governments. One standard of leadership.',
 'The Student Government Leadership Institute',
 'Programme dates will be announced once the pilot year is confirmed.',
 'Before you travel: The Shore Briefing',
 'Approximately 90 minutes by video conference. Access details are issued with confirmation of full payment',
 'Day 3, Thursday', 'The Negril experience', 'The eight modules', 'What every delegate takes home',
 'The Career Development Day', 'Safeguarding', 'Pitch Night and the Leaders Fund', 'Who can apply', 'For advisors',
 'Investment (per person, US delegation)', 'US$1,895', 'US$568.50', 'US$663.25', 'Second payment (35%)', 'Third payment (35%)', 'separate from, and in addition to, the US$1,895 programme fee',
 'Payment schedule (per person)', 'Funding your place', 'Secure a sponsor', 'Cancellations and changes', 'Travel requirements',
 'Professional code of conduct', 'Safety and accountability', 'Frequently asked questions',
 'Programme overview for student governments', 'Download as Word (.docx)', 'Download as PDF', 'Copy letter text', 'Read the full letter'
].forEach(w => ok(text.indexOf(w) !== -1, 'page must contain "' + w + '"'));
ok((text.match(/<details/g) || []).length === 0 && (block.match(/<details class="lj-faq"/g) || []).length === 13, "13 FAQ items");
ok((block.match(/class="lj-card lj-day"/g) || []).length === 6, 'six day cards');
ok((block.match(/class="lj-card lj-mod"/g) || []).length === 8, 'eight module cards');
ok((block.match(/class="lj-stat[ "]/g) || []).length === 7, 'seven stat tiles');
ok(block.indexOf('id="ljSponsor"') > block.indexOf('Funding your place') && block.indexOf('id="ljSponsor"') < block.indexOf('Terms and requirements'), 'sponsor letter sits right after Funding your place');

// the letter: page, copy source, Word and PDF all carry the same text
const letter = fs.readFileSync(path.join(root, 'docs', 'leaders-sponsor-letter.txt'), 'utf8').trim();
const plain = (block.match(/<script type="text\/plain" id="ljLetterPlain">([\s\S]*?)<\/script>/) || [])[1] || '';
ok(plain.replace(/<\\\//g, '</').trim() === letter, 'copy-button text equals the letter source');
ok(/\[Your full name\]/.test(letter) && /\[Sponsor's name\]/.test(letter) && letter.indexOf('—') === -1, 'letter keeps its [bracketed] fields and has no em dash');
const dl = path.join(root, 'public', 'downloads');
['Leaders-in-Jamaica-Sponsor-Letter.docx', 'Leaders-in-Jamaica-Sponsor-Letter.pdf', 'Leaders-in-Jamaica-Programme-Overview.pdf'].forEach(f => {
  ok(fs.existsSync(path.join(dl, f)) && fs.statSync(path.join(dl, f)).size > 2000, 'download exists: ' + f);
});
ok(fs.readFileSync(path.join(dl, 'Leaders-in-Jamaica-Sponsor-Letter.pdf')).slice(0, 5).toString() === '%PDF-', 'letter pdf is a pdf');
ok(fs.readFileSync(path.join(dl, 'Leaders-in-Jamaica-Sponsor-Letter.docx')).slice(0, 2).toString() === 'PK', 'letter docx is a zip');

// application form
const m0 = src.indexOf('<div id="ljApplyModal"'), m1 = src.indexOf('<script>', m0);
const form = src.slice(m0, m1);
['fullName', 'email', 'phone', 'university', 'studentGov', 'applyingAs', 'position', 'funding', 'goal'].forEach(n => ok(form.indexOf('name="' + n + '"') !== -1, 'form field ' + n));
['cohort', 'delegates', 'earlyRate', 'orgType', 'orgName'].forEach(n => ok(form.indexOf('name="' + n + '"') === -1, 'legacy form field removed: ' + n));
ok(form.indexOf('Thank you for your application. The programme director reviews every submission personally and typically responds within two working days.') !== -1, 'confirmation message');
ok(form.indexOf('US$35') !== -1 && form.indexOf('id="ljaPay"') !== -1, 'US$35 application fee step with a pay button');
ok(!/2027|February|15 October|founding/i.test(form), 'form has no dates or founding wording');

// fee waiver codes: one per applicant, used once, tied to the applicant's email, managed in the admin
ok(src.indexOf('id="manage-codes-script"') !== -1 && src.indexOf("id:'codes',t:'Leaders applications'") !== -1, 'admin has the Leaders applications screen');
const wh = fs.readFileSync(path.join(root, 'api', '_handlers', 'leaders-waiver.js'), 'utf8');
ok(/requirePerm\(req, res, 'inbox'\)/.test(wh) && wh.indexOf("action === 'generate'") !== -1 && wh.indexOf('usedAt') !== -1 && wh.indexOf('mail(c.email) !== mail(email)') !== -1, 'waiver handler: admin only to generate, single use, email bound');
ok(fs.readFileSync(path.join(root, 'api', '[...route].js'), 'utf8').indexOf("'leaders-waiver'") !== -1, 'waiver handler is routed');
ok(wh.indexOf("action === 'app-delete'") !== -1 && src.indexOf('data-wc-delapp') !== -1, 'admin can delete an application');
ok(src.indexOf("action: 'apply'") !== -1 && wh.indexOf("action === 'apply'") !== -1 && wh.indexOf("action === 'fee-choice'") !== -1, 'application is stored and emailed first, the fee choice comes after');
ok(src.indexOf("action: 'fee-choice'") !== -1 && src.indexOf('Your application has been received') !== -1, 'fee screen comes after the application is sent');
ok(wh.indexOf('Unfortunately, we are not able to waive') !== -1 && wh.indexOf("'app-decline'") !== -1, 'declined waiver gets a regret email with the payment link');

// SEO
ok(src.indexOf("'leaders-jamaica':['Leaders in Jamaica | Student Government Leadership Institute | Sight Seers Caribbean','An annual six-day leadership institute in Montego Bay pairing a US student government with a Jamaican counterpart. Eight applied modules, five deliverables, a campus exchange, a Career Development Day and Pitch Night.']") !== -1, 'SEO title and description');
const built = path.join(root, 'public', 'leaders-in-jamaica', 'index.html');
if (fs.existsSync(built)) ok(fs.readFileSync(built, 'utf8').indexOf('Student Government Leadership Institute | Sight Seers Caribbean') !== -1, 'built route page carries the new title');

// nothing outside this page was touched by the page rewrite: every new rule is scoped
const style = (block.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const loose = style.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map(r => r.split('{')[0].trim()).filter(sel => sel && !/^@/.test(sel) && sel.split(',').some(x => x.trim() && x.trim().indexOf('#p-leaders-jamaica') !== 0));
ok(loose.length === 0, 'all Leaders page CSS is scoped to #p-leaders-jamaica (' + loose.slice(0, 2) + ')');

console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
process.exit(fails ? 1 : 0);
