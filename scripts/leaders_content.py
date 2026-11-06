#!/usr/bin/env python3
"""
Leaders in Jamaica: the page copy, in one place.

  python3 scripts/leaders_content.py page       rewrites the #p-leaders-jamaica page in Design_Reference.html
  python3 scripts/leaders_content.py downloads  writes the sponsor letter (.docx, .pdf) and the programme overview (.pdf)
                                                into public/downloads/

The sponsor letter text lives in docs/leaders-sponsor-letter.txt and is the single source for the on-page letter, the
Word file, the PDF and the copy button, so they can never differ.
"""
import html, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'Design_Reference.html')
LETTER = os.path.join(ROOT, 'docs', 'leaders-sponsor-letter.txt')
OUT = os.path.join(ROOT, 'public', 'downloads')
STRIPE_FEE = 'https://buy.stripe.com/14A8wQf9M6cf910cvi5kk01'  # the existing US$35 payment link already on the page
FILE_BASE = 'Leaders-in-Jamaica-Sponsor-Letter'
OVERVIEW_FILE = 'Leaders-in-Jamaica-Programme-Overview.pdf'

# ---------------------------------------------------------------- copy (as supplied) ----
HERO = dict(
    title='Leaders in Jamaica',
    subtitle='The Student Government Leadership Institute',
    value='Six days. Two student governments. One standard of leadership.',
    support='An annual, cross-border leadership institute that pairs a US student government with its Jamaican counterpart to strengthen governance, sharpen execution and build leaders who deliver measurable results.',
)
OVERVIEW = 'Leaders in Jamaica is the flagship leadership institute of Sight Seers Caribbean Adventures. Each year, a delegation of five student government executives and one advisor from a US university is paired with a counterpart delegation from a Jamaican university. Over six immersive days, the two delegations operate as peers, benchmarking governance practice, codifying policy and process, and building the systems that allow a student government to perform beyond a single term. Every delegate leaves with five ready-to-implement deliverables. The experience is anchored by a campus exchange, a Career Development Day at a Jamaican high school and a Pitch Night where community initiatives compete for funding. Before departure, both delegations convene for the Shore Briefing, a live online orientation. Programme dates will be announced once the pilot year is confirmed.'
# (big figure, label); a tile with no figure shows the whole phrase
FACTS = [
    ('6', 'days, Tuesday to Sunday'),
    ('8', 'applied modules'),
    ('5', 'deliverables per delegate'),
    ('2', 'delegations: 5 executives and 1 advisor from each university'),
    ('', 'Private villa base in Montego Bay'),
    ('', 'Live online Shore Briefing before departure'),
    ('', 'One cohort per year'),
]
SHORE = dict(
    title='Before you travel: The Shore Briefing',
    intro='A live, facilitated online orientation for every delegate and advisor, held approximately two weeks before the programme once all places are confirmed. It sits outside the six days and ensures every participant arrives aligned, prepared and ready to contribute from the first session.',
    items=[
        'Programme orientation: a structured walk-through of the six days, the eight modules and the five deliverables',
        'Operational briefing: travel logistics, arrival procedures, dress code, packing guidance and the code of conduct',
        'Safety and safeguarding briefing, including the Career Development Day protocols',
        'Delegation breakout rooms: US and Jamaican delegates meet their role counterparts in advance, for example treasurer with treasurer, to build rapport before arrival',
        'Pre-work: each student government submits its constitution and one priority challenge to be addressed during the week',
        'Open Q&A for delegates and advisors',
        'Approximately 90 minutes by video conference. Access details are issued with confirmation of full payment',
    ],
)
DAYS = [
    ('Day 1, Tuesday', 'Arrival and onboarding', 'Airport meet and greet, transfer to the villa, opening circle and a welcome dinner with the Jamaican delegation.'),
    ('Day 2, Wednesday', 'The leadership intensive', 'A full day of applied work on governance, policy, process, systems, KPIs and cross-functional collaboration.'),
    ('Day 3, Thursday', 'The campus exchange', 'A structured benchmarking session with the Jamaican student government covering constitutions, committees, funding, records and reporting, together with a dedicated session on budgeting and treasury controls.'),
    ('Day 4, Friday', 'The Career Development Day', 'Delegates lead career and leadership sessions for upper-school students at a high school in western Jamaica.'),
    ('Day 5, Saturday', 'The Negril experience', 'A curated adventure day on the Negril coast, followed by the Leaders Fund Pitch Night at the villa.'),
    ('Day 6, Sunday', 'Synthesis and departure', 'A closing debrief, completion of handover packs and airport transfers.'),
]
MODULES = [
    ('Governance framework', 'a governance map with budget and treasury controls'),
    ('Policy development', 'a drafted, adoption-ready policy'),
    ('Process design', 'documented process maps'),
    ('Systems and infrastructure', 'a structured records system'),
    ('KPI training', 'a performance measurement framework'),
    ('Cross-functional collaboration', 'a stakeholder collaboration plan'),
    ('Game-changing ideas', 'a pitch-ready community initiative'),
    ('Handover and continuity', 'a succession and handover pack'),
]
TAKEHOME = dict(
    intro='Five practical deliverables, built during the week and ready to implement on return:',
    items=['An adoption-ready policy', 'Documented process maps', 'A performance measurement framework', 'A pitch-ready community initiative', 'A succession and handover pack'],
)
CAREER = dict(
    intro="A full day at a high school in western Jamaica, where US and Jamaican student leaders share their experience to help upper-school students chart their next steps.",
    items=[
        'Pathways panel: delegates share their academic journeys, fields of study and career ambitions',
        'Career circles: small-group mentoring by sector, including business, law, health, technology and the creative industries',
        'Professional skills workshop: CV development, interview technique, personal statements and scholarship applications',
        'University insight session: studying in Jamaica and the United States, admissions and funding',
        "Student council masterclass: a leadership workshop for the school's prefects and student council",
        "A contribution of career resources to the school's guidance department",
    ],
)
SAFEGUARDING = [
    "The school principal and the Ministry of Education's regional office approve the programme and the visitor list",
    'Teachers are present at every session, and there is no one-to-one contact with any student',
    "No identifiable images of students without the school's consent, and no posting of students on social media",
    'No exchange of personal phone numbers or social media details with students',
    'Every visitor completes the safeguarding briefing during the Shore Briefing and signs the code of conduct',
]
PITCH = 'On Saturday evening, mixed Jamaican and US teams present community initiatives to a panel. The strongest proposals receive Leaders Fund grants and are delivered within 90 days, turning ideas into measurable community impact.'
WHO = [
    'Each annual cohort pairs one US university with one Jamaican university',
    'Each university sends five student government executives and one advisor, typically the president, vice president, treasurer, secretary and one additional executive',
    'Delegates must hold an elected or appointed executive position in their student government',
    'Advisors are staff members who support the student government, such as the student government advisor or a student life officer',
]
ADVISORS = [
    'Each delegation travels with one advisor from its university. The US advisor is accommodated at the villa with the US delegation; the Jamaican advisor joins each day from their own base',
    'Advisors have full access to every session, including the campus exchange, the Career Development Day and Pitch Night',
    "Sight Seers manages all logistics end to end, so the advisor's role is oversight and support, not coordination",
    'Advisors enrol on the same terms as delegates: a US$35 application fee, a 30% deposit on selection and the balance in full 14 days before the programme. The place may be funded by the advisor or their university',
]
INVEST_ROWS = [
    ('Programme fee', 'US$1,895', True),
]
INVEST_NOTES = [
    'Each of the five delegates and the advisor holds an individual place',
    'Each place may be funded personally, by a sponsor, or by the university or student government',
    'Inclusions: the Shore Briefing, the full six-day programme, all eight modules and materials, shared accommodation at a private villa in Montego Bay, all meals, airport transfers and ground transportation, the campus exchange, the Career Development Day, the Negril experience, Pitch Night, a dedicated Sight Seers host and a 24-hour incident line',
    'Exclusions: airfare to Montego Bay (Sangster International Airport, MBJ), which varies by departure city. Group air quotations and bookings are available on request',
    'Jamaican delegation: places are arranged directly with the Jamaican host university',
]
PAY_ROWS = [
    ('1. Deposit (30%, non-refundable)', 'On selection, to secure the place', 'US$568.50'),
    ('2. Second payment (35%)', 'No later than 60 days before the programme', 'US$663.25'),
    ('3. Third payment (35%)', 'No later than 14 days before the programme', 'US$663.25'),
]
APPFEE_NOTE = 'The US$35 application fee is paid on application. It is separate from, and in addition to, the US$1,895 programme fee, which is paid in the three parts below.'
PAY_NOTES = [
    'Each delegate and the advisor is responsible for their own application fee and programme payments',
    'The programme fee is paid in three parts, and must be paid in full no later than 14 days before the programme begins',
    'A secure payment link for each part is emailed to you once your place is confirmed. Payments are made online by card',
    'Places not paid in full by that date are released, and the deposit is forfeited',
    'A fee waiver can be requested when applying and is confirmed by email. Applicants who do not request one pay the application fee',
]
FUNDING = [
    ('Self-funded', 'settle your own place directly'),
    ('Corporate or community sponsor', 'an employer, family business, church or local business funds your place. A professionally written sponsor letter is provided below'),
    ('Institutional funding', 'your university, a department or your student government funds your place from its own budget'),
    ('Scholarships', 'a limited number of scholarships are available for Jamaican student leaders'),
]
SPONSOR_TITLE = 'Secure a sponsor'
SPONSOR_INTRO = 'Many delegates fund their place through an employer, family business, church or local business. This letter presents your participation as a clear, professional business case. Complete the details in [brackets] and send it to your prospective sponsor.'
CANCEL = [
    'The US$35 application fee is non-refundable',
    'The 30% deposit is non-refundable once a place is secured',
    'If a confirmed delegate is unable to travel, the place may be transferred to another executive of the same student government at no charge, up to 14 days before the programme',
    'Should Sight Seers cancel the programme for any reason, all fees paid, including the application fee, are refunded in full',
    'The programme is confirmed once the full delegation has paid its deposits',
]
TRAVEL = [
    'A passport valid for at least six months beyond the travel dates',
    'US citizens do not require a visa for short stays in Jamaica; other nationals should verify entry requirements',
    'Comprehensive travel insurance covering medical care and trip cancellation is strongly recommended',
    'Each delegate and advisor completes a medical, dietary and emergency contact form before departure',
]
CONDUCT = [
    'Delegates represent their university and student government at all times',
    'Business attire is expected for the campus exchange, the Career Development Day and Pitch Night',
    'No alcohol at any programme activity',
    "Delegates follow the host's direction on safety, curfew and off-site movement",
    'Serious breaches may result in removal from the programme without refund',
]
SAFETY = [
    'Licensed and insured operators only, with certificates on file',
    'Signed waivers for all activities',
    'A dedicated Sight Seers host and a 24-hour incident line throughout the programme',
]
DOWNLOAD_LABEL = 'Programme overview for student governments'
FAQ = [
    ('Who is eligible?', 'Student government executives at a registered university. Each annual cohort pairs one US university with one Jamaican university.'),
    ('How many people can attend from one university?', 'Each university sends five executives and one advisor.'),
    ('What is the investment?', 'US$1,895 per person, plus a US$35 application fee. Airfare is not included.'),
    ('Does each participant pay individually?', 'Yes. Each delegate and the advisor is responsible for their own application fee and programme payments, whether funded personally, by a sponsor or by their university.'),
    ('Is there any preparation before travel?', 'Yes. The Shore Briefing is a live online orientation held about two weeks before the programme, with a full programme walk-through, a safety briefing and breakout rooms to meet the other delegation.'),
    ('What happens on the Career Development Day?', 'Delegates spend the day at a high school in western Jamaica, leading a pathways panel, sector-based career circles, a professional skills workshop, a university insight session and a student council masterclass.'),
    ('Is airfare included?', 'No. Airfare varies by departure city. Group air quotations and bookings are available on request.'),
    ('What is included?', 'The Shore Briefing, the full programme, villa accommodation, all meals, transfers and ground transportation, the campus exchange, the Career Development Day, the Negril experience and Pitch Night.'),
    ('Can our student government fund our places?', 'Yes. Places may be funded by the university, a department, the student government or an external sponsor.'),
    ('Can the application fee be waived?', 'Yes. You can request a fee waiver when you apply, and we will reply by email. If you do not request one, the US$35 application fee is due with your application.'),
    ('When is full payment due?', 'All fees must be paid in full no later than 14 days before the programme begins.'),
    ('How is safety managed?', 'We work only with licensed and insured operators, a dedicated host remains with the group throughout, and a 24-hour incident line is in place.'),
    ('Does the Jamaican delegation stay at the villa?', 'No. The Jamaican delegates and their advisor join each day\'s programme from their own base.'),
]
SEO_TITLE = 'Leaders in Jamaica | Student Government Leadership Institute | Sight Seers Caribbean'
SEO_DESC = 'An annual six-day leadership institute in Montego Bay pairing a US student government with a Jamaican counterpart. Eight applied modules, five deliverables, a campus exchange, a Career Development Day and Pitch Night.'

# ---------------------------------------------------------------- html helpers ----
def e(s):
    return html.escape(s, quote=False)

def ul(items, cls='lj-list'):
    return '<ul class="%s">%s</ul>' % (cls, ''.join('<li>%s</li>' % e(i) for i in items))

def card_list(items):
    return '<div class="lj-card lj-listcard">%s</div>' % ul(items)

def sec(title, body, center=False, tight=True, sid=''):
    return ('  <section class="lj-sec"%s%s><div class="lj-wrap%s">\n    <h2 class="lj-h2">%s</h2>\n%s\n  </div></section>\n' % (
        ' style="padding-top:0"' if tight else '', (' id="%s"' % sid) if sid else '', ' lj-center' if center else '', e(title), body))

def read_letter():
    with open(LETTER, encoding='utf-8') as f:
        return f.read().strip('\n')

def letter_blocks(text):
    """[('p', [lines]) | ('ul', [items])] from the plain letter text."""
    out = []
    for blk in re.split(r'\n\s*\n', text.strip()):
        lines = blk.split('\n')
        head = []
        bullets = []
        for ln in lines:
            if ln.startswith('• '):
                bullets.append(ln[2:])
            else:
                head.append(ln)
        if head:
            out.append(('p', head))
        if bullets:
            out.append(('ul', bullets))
    return out

def letter_html(text):
    parts = []
    for kind, v in letter_blocks(text):
        if kind == 'p':
            parts.append('<p>%s</p>' % '<br>'.join(e(x) for x in v))
        else:
            parts.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % e(x) for x in v))
    return ''.join(parts)

def build_page():
    letter = read_letter()
    p = []
    # hero
    p.append('''  <section class="lj-hero">
    <div class="lj-hero-in">
      <span class="lj-kicker">A Sight Seers Flagship Programme</span>
      <h1 class="lj-h1">%(title)s<span class="sub">%(subtitle)s</span></h1>
      <p class="lj-value">%(value)s</p>
      <p class="lj-lede">%(support)s</p>
      <div class="lj-cta">
        <a href="#" class="lj-btn primary" onclick="openLeadersApply();return false;">Apply now</a>
        <a href="https://wa.me/18764650630" target="_blank" rel="noopener" class="lj-btn ghost">Talk to the Director</a>
      </div>
    </div>
  </section>
''' % {k: e(v) for k, v in HERO.items()})
    # overview + key facts
    tiles = ''.join(
        ('<div class="lj-stat"><b>%s</b><span>%s</span></div>' % (e(f), e(l))) if f else ('<div class="lj-stat lj-stat-text"><span>%s</span></div>' % e(l))
        for f, l in FACTS)
    p.append('''  <section class="lj-sec"><div class="lj-wrap lj-center">
    <h2 class="lj-h2">Overview</h2>
    <p class="lj-sub">%s</p>
    <div class="lj-stats">%s</div>
  </div></section>
''' % (e(OVERVIEW), tiles))
    # shore briefing
    p.append(sec(SHORE['title'], '    <p class="lj-sub">%s</p>\n    %s' % (e(SHORE['intro']), card_list(SHORE['items']))))
    # six days
    days = ''.join('<div class="lj-card lj-day"><div class="lj-badge">%d</div><div class="d-date">%s</div><h4>%s</h4><p>%s</p></div>' % (i + 1, e(d), e(t), e(x)) for i, (d, t, x) in enumerate(DAYS))
    p.append(sec('The six days', '    <div class="lj-days">%s</div>' % days))
    # modules
    mods = ''.join('<div class="lj-card lj-mod"><h4>%s</h4><div class="lj-del"><i>Deliverable</i><span class="lj-cap">%s</span></div></div>' % (e(n), e(d)) for n, d in MODULES)
    p.append(sec('The eight modules', '    <div class="lj-grid4">%s</div>' % mods))
    # take home
    th = ''.join('<div class="lj-card lj-take"><div class="lj-badge">%d</div><p>%s</p></div>' % (i + 1, e(x)) for i, x in enumerate(TAKEHOME['items']))
    p.append(sec('What every delegate takes home', '    <p class="lj-sub">%s</p>\n    <div class="lj-takes">%s</div>' % (e(TAKEHOME['intro']), th)))
    # career day
    p.append(sec('The Career Development Day', '    <p class="lj-sub">%s</p>\n    %s' % (e(CAREER['intro']), card_list(CAREER['items']))))
    # safeguarding + pitch night
    p.append(sec('Safeguarding', '    %s' % card_list(SAFEGUARDING)))
    p.append(sec('Pitch Night and the Leaders Fund', '    <div class="lj-card lj-wide"><p>%s</p></div>' % e(PITCH)))
    # who can apply, advisors
    p.append(sec('Who can apply', '    %s' % card_list(WHO)))
    p.append(sec('For advisors', '    %s' % card_list(ADVISORS)))
    # investment
    rows = ''.join('<tr%s><td data-label="Rate">%s</td><td data-label="Per person" class="price">%s</td></tr>' % (' class="rec"' if r else '', e(a), e(b)) for a, b, r in INVEST_ROWS)
    p.append(sec('Investment (per person, US delegation)',
        '    <div class="lj-price-card"><div class="lj-table-wrap"><table class="lj-table lj-stack"><thead><tr><th>Rate</th><th>Per person</th></tr></thead><tbody>%s</tbody></table></div></div>\n    <div class="lj-card lj-listcard" style="margin-top:22px">%s</div>' % (rows, ul(INVEST_NOTES))))
    # payment schedule
    rows = ''.join('<tr><td data-label="Step">%s</td><td data-label="Timing">%s</td><td data-label="Amount" class="price">%s</td></tr>' % tuple(e(x) for x in r) for r in PAY_ROWS)
    p.append(sec('Payment schedule (per person)',
        '    <p class="lj-sub" style="margin-bottom:20px">' + e(APPFEE_NOTE) + '</p>\n    <div class="lj-price-card"><div class="lj-table-wrap"><table class="lj-table lj-stack"><thead><tr><th>Step</th><th>Timing</th><th>Amount</th></tr></thead><tbody>%s</tbody></table></div></div>\n    <div class="lj-card lj-listcard" style="margin-top:22px">%s</div>' % (rows, ul(PAY_NOTES))))
    # Stripe: the existing US$35 payment link stays on the page, beside the payment schedule
    p.append('''  <section class="lj-sec" style="padding-top:0"><div class="lj-wrap">
    <div class="lj-price-card lj-paycard">
      <div class="lj-eyebrow">Application fee</div>
      <h3>Pay online, securely</h3>
      <p class="lj-sub lj-paysub">Card payments are processed securely by Stripe. Each applicant pays the US$35 application fee when they apply, or applies for a fee waiver instead.</p>
      <a href="#" class="lj-btn primary" onclick="openLeadersApply();return false;">Apply now</a>
    </div>
  </div></section>
''')
    # funding
    fc = ''.join('<div class="lj-card"><h4>%s</h4><p class="lj-cap">%s</p></div>' % (e(t), e(x)) for t, x in FUNDING)
    p.append(sec('Funding your place', '    <div class="lj-grid4">%s</div>' % fc))
    # sponsor letter
    p.append(('''  <section class="lj-sec" style="padding-top:0" id="ljSponsor"><div class="lj-wrap lj-center">
    <h2 class="lj-h2">%(t)s</h2>
    <p class="lj-sub">%(i)s</p>
    <div class="lj-letter-wrap">
      <div class="lj-letter" id="ljLetter" tabindex="0" role="button" aria-expanded="false" aria-controls="ljLetterBody" aria-label="Sponsor letter preview. Read the full letter">
        <div class="lj-letter-body" id="ljLetterBody">%(l)s</div>
        <div class="lj-letter-fade" aria-hidden="true"></div>
        <span class="lj-letter-prompt" aria-hidden="true"><span class="more">Read the full letter</span><span class="less">Collapse the letter</span></span>
      </div>
      <div class="lj-letter-actions">
        <a class="lj-btn primary" href="/downloads/%(f)s.docx" download="%(f)s.docx">Download as Word (.docx)</a>
        <a class="lj-btn primary" href="/downloads/%(f)s.pdf" download="%(f)s.pdf">Download as PDF</a>
        <button type="button" class="lj-btn ghost-dark" id="ljCopyLetter">Copy letter text</button>
      </div>
      <script type="text/plain" id="ljLetterPlain">%(raw)s</script>
    </div>
  </div></section>
''') % dict(t=e(SPONSOR_TITLE), i=e(SPONSOR_INTRO), l=letter_html(letter), f=FILE_BASE, raw=letter.replace('</', '<\\/')))
    # cancellations, travel, conduct, safety
    quad = ''.join('<div class="lj-card lj-listcard"><h4>%s</h4>%s</div>' % (e(t), ul(items)) for t, items in [
        ('Cancellations and changes', CANCEL), ('Travel requirements', TRAVEL), ('Professional code of conduct', CONDUCT), ('Safety and accountability', SAFETY)])
    p.append(sec('Terms and requirements', '    <div class="lj-grid2 lj-terms">%s</div>' % quad))
    # downloads
    p.append(('''  <section class="lj-sec" style="padding-top:0"><div class="lj-wrap lj-center">
    <h2 class="lj-h2">Downloads</h2>
    <div class="lj-cta"><a class="lj-btn primary" href="/downloads/%s" download="%s">%s (PDF)</a></div>
  </div></section>
''') % (OVERVIEW_FILE, OVERVIEW_FILE, e(DOWNLOAD_LABEL)))
    # FAQ
    faq = ''.join('<details class="lj-faq"><summary>%s</summary><div class="lj-faq-a">%s</div></details>' % (e(q), e(a)) for q, a in FAQ)
    p.append(sec('Frequently asked questions', '    <div class="lj-faq-card">%s</div>' % faq))
    # closing band
    p.append('''  <div class="lj-wrap">
    <div class="lj-band"><div class="lj-band-in">
      <h2>%s</h2>
      <div class="lj-cta">
        <a href="#" class="lj-btn primary" onclick="openLeadersApply();return false;">Apply now</a>
      </div>
    </div></div>
  </div>
''' % e(HERO['value']))
    return ''.join(p)

CSS_ADD = r'''
  /* Leaders in Jamaica: 2027 programme redesign additions */
  #p-leaders-jamaica .lj-value{margin:18px auto 0;max-width:30ch;font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(22px,3.2vw,30px);line-height:1.25;color:#fff}
  #p-leaders-jamaica .lj-hero .lj-lede{margin-top:14px}
  #p-leaders-jamaica .lj-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:34px;text-align:center}
  #p-leaders-jamaica .lj-stats .lj-stat{flex:0 1 calc(25% - 11px);min-width:0}
  #p-leaders-jamaica .lj-stat{background:#fff;border:1px solid var(--lj-line);border-radius:0;padding:22px 16px;box-shadow:var(--lj-shadow);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px}
  #p-leaders-jamaica .lj-stat b{font-family:'Playfair Display',serif;font-size:36px;line-height:1;color:var(--lj-navy)}
  #p-leaders-jamaica .lj-stat span{font-size:13.5px;line-height:1.45;color:var(--lj-mut);font-weight:600}
  #p-leaders-jamaica .lj-stat-text span{font-family:'Playfair Display',serif;font-size:17px;line-height:1.35;color:var(--lj-navy);font-weight:700}
  #p-leaders-jamaica .lj-listcard{padding:10px 26px}
  #p-leaders-jamaica .lj-listcard h4{margin:14px 0 4px}
  #p-leaders-jamaica .lj-wide p{font-size:16px;line-height:1.75;color:var(--lj-ink)}
  #p-leaders-jamaica .lj-days{grid-template-columns:repeat(3,1fr)}
  #p-leaders-jamaica .lj-mod{display:flex;flex-direction:column;gap:10px}
  #p-leaders-jamaica .lj-mod h4{margin:0}
  #p-leaders-jamaica .lj-del{font-size:13.5px;line-height:1.55;color:var(--lj-mut)}
  #p-leaders-jamaica .lj-del i{display:block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--lj-green);margin-bottom:3px}
  #p-leaders-jamaica .lj-cap{display:block}
  #p-leaders-jamaica .lj-cap::first-letter{text-transform:uppercase}
  #p-leaders-jamaica .lj-takes{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
  #p-leaders-jamaica .lj-take{padding:20px 16px}
  #p-leaders-jamaica .lj-take p{margin-top:10px;font-weight:700;color:var(--lj-navy);font-size:14px}
  #p-leaders-jamaica .lj-terms .lj-card{padding-bottom:14px}
  #p-leaders-jamaica .lj-table .price{white-space:nowrap}
  #p-leaders-jamaica .lj-price-card + .lj-card{margin-top:22px}
  #p-leaders-jamaica .lj-paycard{padding:26px 24px;text-align:center}
  #p-leaders-jamaica .lj-paycard h3{font-family:'Playfair Display',serif;color:var(--lj-navy);font-size:clamp(20px,2.6vw,26px);margin:2px 0 6px}
  #p-leaders-jamaica .lj-paycard .lj-paysub{margin:0 auto 18px;text-align:center;max-width:56ch}

  /* Sponsor letter */
  #p-leaders-jamaica .lj-letter-wrap{max-width:760px;margin:0 auto;text-align:left}
  #p-leaders-jamaica .lj-letter{position:relative;background:#fff;border-radius:16px;border-top:3px solid var(--lj-green);box-shadow:0 2px 6px rgba(6,58,99,.06),0 22px 50px rgba(6,58,99,.14);
    padding:34px 40px 22px;cursor:pointer;transition:transform .3s ease,box-shadow .3s ease;transform-origin:center top;outline:none}
  #p-leaders-jamaica .lj-letter:focus-visible{box-shadow:0 0 0 3px rgba(239,135,49,.45),0 22px 50px rgba(6,58,99,.14)}
  #p-leaders-jamaica .lj-letter.is-open{box-shadow:0 4px 10px rgba(6,58,99,.08),0 38px 80px rgba(6,58,99,.24)}
  @media(min-width:701px){#p-leaders-jamaica .lj-letter.is-open{transform:scale(1.015)}}
  #p-leaders-jamaica .lj-letter-body{max-height:300px;overflow:hidden;transition:max-height .3s ease;font-size:14.5px;line-height:1.7;color:var(--lj-ink)}
  #p-leaders-jamaica .lj-letter-body p{margin:0 0 14px}
  #p-leaders-jamaica .lj-letter-body ul{margin:0 0 14px;padding-left:22px}
  #p-leaders-jamaica .lj-letter-body li{margin:0 0 4px}
  #p-leaders-jamaica .lj-letter-fade{position:absolute;left:0;right:0;bottom:0;height:150px;border-radius:0 0 16px 16px;pointer-events:none;transition:opacity .3s ease;
    background:linear-gradient(180deg,rgba(255,255,255,0),#fff 78%)}
  #p-leaders-jamaica .lj-letter.is-open .lj-letter-fade{opacity:0}
  #p-leaders-jamaica .lj-letter-prompt{position:absolute;left:0;right:0;bottom:16px;text-align:center;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:var(--lj-navy)}
  #p-leaders-jamaica .lj-letter-prompt .less,#p-leaders-jamaica .lj-letter.is-open .lj-letter-prompt .more{display:none}
  @media(hover:none){#p-leaders-jamaica .lj-letter.is-open .lj-letter-prompt{position:static;margin-top:6px;display:block}#p-leaders-jamaica .lj-letter.is-open .lj-letter-prompt .less{display:inline}}
  @media(hover:hover){#p-leaders-jamaica .lj-letter.is-open .lj-letter-prompt{display:none}}
  #p-leaders-jamaica .lj-letter-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:26px}
  #p-leaders-jamaica .lj-btn.ghost-dark{background:#fff;border:2px solid var(--lj-navy);color:var(--lj-navy);padding:13px 28px}
  #p-leaders-jamaica .lj-btn.ghost-dark:hover{background:var(--lj-navy);color:#fff;transform:translateY(-2px)}
  #p-leaders-jamaica .lj-btn.ghost-dark.is-done{background:var(--lj-green);border-color:var(--lj-green);color:#fff}

  /* FAQ accordion */
  #p-leaders-jamaica .lj-faq-card{background:#fff;border:1px solid var(--lj-line);border-radius:0;padding:6px 30px;box-shadow:var(--lj-shadow)}
  #p-leaders-jamaica .lj-faq{border-bottom:1px solid var(--lj-line)}
  #p-leaders-jamaica .lj-faq:last-child{border-bottom:0}
  #p-leaders-jamaica .lj-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:19px 0;font-weight:800;color:var(--lj-navy);font-size:15.5px}
  #p-leaders-jamaica .lj-faq summary::-webkit-details-marker{display:none}
  #p-leaders-jamaica .lj-faq summary::after{content:'+';flex:none;width:28px;height:28px;border-radius:0;background:rgba(112,194,87,.16);color:#3f8c2f;font-size:20px;line-height:26px;text-align:center;transition:transform .3s ease}
  #p-leaders-jamaica .lj-faq[open] summary::after{transform:rotate(45deg)}
  #p-leaders-jamaica .lj-faq-a{padding:0 0 20px;color:var(--lj-mut);font-size:15px;line-height:1.7;max-width:75ch}
  #p-leaders-jamaica .lj-faq summary:focus-visible{outline:2px solid var(--lj-orange);outline-offset:2px;border-radius:6px}

  @media(max-width:920px){
    #p-leaders-jamaica .lj-stats .lj-stat{flex-basis:calc(50% - 7px)}
    #p-leaders-jamaica .lj-days{grid-template-columns:1fr 1fr}
    #p-leaders-jamaica .lj-takes{grid-template-columns:1fr 1fr}
  }
  @media(max-width:700px){
    #p-leaders-jamaica .lj-letter{padding:26px 22px 18px}
    #p-leaders-jamaica .lj-faq-card{padding:4px 20px}
    #p-leaders-jamaica .lj-listcard{padding:8px 20px}
    #p-leaders-jamaica .lj-stack thead{display:none}
    #p-leaders-jamaica .lj-stack,#p-leaders-jamaica .lj-stack tbody,#p-leaders-jamaica .lj-stack tr,#p-leaders-jamaica .lj-stack td{display:block;width:100%}
    #p-leaders-jamaica .lj-stack tr{padding:12px 6px;border-bottom:1px solid var(--lj-line)}
    #p-leaders-jamaica .lj-stack tr:last-child{border-bottom:0}
    #p-leaders-jamaica .lj-stack td{border:0;padding:5px 12px;display:flex;justify-content:space-between;gap:16px;text-align:right}
    #p-leaders-jamaica .lj-stack td::before{content:attr(data-label);flex:none;text-align:left;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--lj-mut);padding-top:3px}
  }
  @media(max-width:560px){
    #p-leaders-jamaica .lj-days,#p-leaders-jamaica .lj-takes{grid-template-columns:1fr}
    #p-leaders-jamaica .lj-stats .lj-stat{flex-basis:100%}
    #p-leaders-jamaica .lj-stat b{font-size:30px}
  }
'''

SCRIPT = r'''
  <script>
  (function(){
    var q=location.search||'';var host=document.getElementById('p-leaders-jamaica');if(!host||!/[?&](paid|pay)=/.test(q))return;
    var m=/[?&]paid=/.test(q)?'Thank you. Your payment was received, and a receipt is on its way to your email.':/pay=done/.test(q)?'That payment has already been made. Thank you.':'We could not open that payment link just now. Please try again in a moment, or email info@sightseerscaribbean.com.';
    var d=document.createElement('div');d.setAttribute('role','status');d.style.cssText='background:#063a63;color:#fff;text-align:center;padding:14px 20px;font-weight:700;font-size:15px';d.textContent=m;host.insertBefore(d,host.firstChild);
  })();
  </script>
  <script>
  (function(){
    var card=document.getElementById('ljLetter');if(!card)return;
    var body=document.getElementById('ljLetterBody'),COLLAPSED=300;
    var canHover=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function set(open){
      card.classList.toggle('is-open',open);card.setAttribute('aria-expanded',open?'true':'false');
      body.style.maxHeight=open?body.scrollHeight+'px':COLLAPSED+'px';
    }
    set(false);
    if(canHover){card.addEventListener('mouseenter',function(){set(true);});card.addEventListener('mouseleave',function(){set(false);});}
    else card.addEventListener('click',function(){set(!card.classList.contains('is-open'));});
    card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();set(!card.classList.contains('is-open'));}});
    window.addEventListener('resize',function(){if(card.classList.contains('is-open'))body.style.maxHeight=body.scrollHeight+'px';});
    var btn=document.getElementById('ljCopyLetter'),plain=document.getElementById('ljLetterPlain'),t=null;
    function done(){var old=btn.getAttribute('data-label')||btn.textContent;btn.setAttribute('data-label',old);btn.textContent='Copied';btn.classList.add('is-done');clearTimeout(t);t=setTimeout(function(){btn.textContent=old;btn.classList.remove('is-done');},2000);}
    function fallback(txt){var ta=document.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(x){}document.body.removeChild(ta);if(ok)done();}
    btn.addEventListener('click',function(){
      var txt=plain.textContent.trim();
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,function(){fallback(txt);});else fallback(txt);
    });
  })();
  </script>
'''

# ---------------------------------------------------------------- page patch ----
def patch_page():
    s = open(SRC, encoding='utf-8').read()
    a = s.index('<div class="page" id="p-leaders-jamaica">')
    b = s.index('<div class="page" id="p-mba-voyages">', a)
    block = s[a:b]
    st0 = block.index('  <style>')
    st1 = block.index('  </style>')
    style = block[st0:st1]
    # drop any earlier copy of the additions so the script can be re-run
    style = style.split('\n  /* Leaders in Jamaica: 2027 programme redesign additions */')[0]
    # hero lede block no longer needs the fact tiles or the days grid of five
    style = style.replace('#p-leaders-jamaica .lj-days{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}',
                          '#p-leaders-jamaica .lj-days{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}')
    style = style.replace('@media(max-width:920px){#p-leaders-jamaica .lj-grid4,#p-leaders-jamaica .lj-days{grid-template-columns:1fr 1fr}',
                          '@media(max-width:920px){#p-leaders-jamaica .lj-grid4{grid-template-columns:1fr 1fr}')
    style = style.replace('@media(max-width:560px){#p-leaders-jamaica .lj-grid2,#p-leaders-jamaica .lj-grid4,#p-leaders-jamaica .lj-days{grid-template-columns:1fr}',
                          '@media(max-width:560px){#p-leaders-jamaica .lj-grid2,#p-leaders-jamaica .lj-grid4{grid-template-columns:1fr}')
    # keep whatever followed the old page div (the section comment) untouched
    tail_start = block.rindex('</div>') + len('</div>')
    tail = block[tail_start:].lstrip('\n')
    s = s[:a] + '<div class="page" id="p-leaders-jamaica">\n' + style.rstrip('\n') + '\n' + CSS_ADD + '  </style>\n\n' + build_page() + SCRIPT + '</div>\n\n' + tail + s[b:]
    # SEO
    m = re.search(r"  'leaders-jamaica':\['[^\n]*\n", s[s.index('var SS_META'):])
    start = s.index('var SS_META') + m.start()
    end = s.index('var SS_META') + m.end()
    s = s[:start] + "  'leaders-jamaica':['%s','%s'],\n" % (SEO_TITLE.replace("'", "\\'"), SEO_DESC.replace("'", "\\'")) + s[end:]
    open(SRC, 'w', encoding='utf-8').write(s)
    print('page rewritten')

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'page':
        patch_page()
    elif cmd == 'downloads':
        from leaders_downloads import make
        make(sys.modules[__name__])
    else:
        print(__doc__)
