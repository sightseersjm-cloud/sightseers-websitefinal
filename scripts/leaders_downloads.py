"""Writes the Leaders in Jamaica downloads. Called by leaders_content.py (python3 scripts/leaders_content.py downloads)."""
import os


def make(c):
    os.makedirs(c.OUT, exist_ok=True)
    letter = c.read_letter()
    blocks = c.letter_blocks(letter)
    _docx(c, blocks)
    _letter_pdf(c, blocks)
    _overview_pdf(c)
    print('downloads written to', c.OUT)


def _docx(c, blocks):
    from docx import Document
    from docx.shared import Pt, Cm
    d = Document()
    for s in d.sections:
        s.left_margin = s.right_margin = Cm(2.4)
        s.top_margin = s.bottom_margin = Cm(2.2)
    st = d.styles['Normal']
    st.font.name = 'Calibri'
    st.font.size = Pt(11)
    st.paragraph_format.space_after = Pt(8)
    for kind, v in blocks:
        if kind == 'p':
            p = d.add_paragraph()
            for i, line in enumerate(v):
                r = p.add_run(line)
                if i < len(v) - 1:
                    r.add_break()
        else:
            for item in v:
                d.add_paragraph(item, style='List Bullet')
    d.core_properties.title = 'Leaders in Jamaica sponsor letter'
    d.core_properties.author = 'Sight Seers Caribbean Adventures'
    d.save(os.path.join(c.OUT, c.FILE_BASE + '.docx'))


def _letter_pdf(c, blocks):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, ListFlowable, ListItem, Spacer
    from xml.sax.saxutils import escape

    body = ParagraphStyle('b', fontName='Helvetica', fontSize=10.5, leading=15, textColor=colors.HexColor('#12293d'), spaceAfter=9)

    def on_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor('#70c257'))
        canvas.rect(0, A4[1] - 0.35 * cm, A4[0], 0.35 * cm, stroke=0, fill=1)
        canvas.restoreState()

    flow = []
    for kind, v in blocks:
        if kind == 'p':
            flow.append(Paragraph('<br/>'.join(escape(x) for x in v), body))
        else:
            flow.append(ListFlowable([ListItem(Paragraph(escape(x), body), leftIndent=14) for x in v],
                                     bulletType='bullet', start='•', leftIndent=14, bulletFontSize=9))
            flow.append(Spacer(1, 4))
    doc = SimpleDocTemplate(os.path.join(c.OUT, c.FILE_BASE + '.pdf'), pagesize=A4, leftMargin=2.4 * cm, rightMargin=2.4 * cm,
                            topMargin=2.2 * cm, bottomMargin=2 * cm, title='Leaders in Jamaica sponsor letter',
                            author='Sight Seers Caribbean Adventures')
    doc.build(flow, onFirstPage=on_page, onLaterPages=on_page)


def _overview_pdf(c):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, ListFlowable, ListItem, Spacer, Table, TableStyle, KeepTogether
    from xml.sax.saxutils import escape

    navy, green, mut, ink = colors.HexColor('#063a63'), colors.HexColor('#70c257'), colors.HexColor('#5c6f82'), colors.HexColor('#12293d')
    h1 = ParagraphStyle('h1', fontName='Times-Bold', fontSize=26, leading=30, textColor=navy, spaceAfter=4)
    sub = ParagraphStyle('sub', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=green, spaceAfter=10)
    val = ParagraphStyle('val', fontName='Times-Bold', fontSize=15, leading=19, textColor=navy, spaceAfter=6)
    h2 = ParagraphStyle('h2', fontName='Times-Bold', fontSize=15, leading=19, textColor=navy, spaceBefore=14, spaceAfter=6)
    b = ParagraphStyle('b', fontName='Helvetica', fontSize=9.6, leading=14, textColor=ink, spaceAfter=6)
    cell = ParagraphStyle('c', parent=b, fontSize=9, leading=12, spaceAfter=0)
    cellb = ParagraphStyle('cb', parent=cell, fontName='Helvetica-Bold', textColor=navy)

    def bullets(items):
        return ListFlowable([ListItem(Paragraph(escape(x), b), leftIndent=12) for x in items], bulletType='bullet', start='•', leftIndent=12, bulletFontSize=8)

    def table(rows, widths, head):
        data = [[Paragraph(escape(h), cellb) for h in head]] + [[Paragraph(escape(x), cell) for x in r] for r in rows]
        t = Table(data, colWidths=widths, repeatRows=1)
        t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eef4f8')), ('LINEBELOW', (0, 0), (-1, -1), 0.4, colors.HexColor('#cfdbe6')),
                               ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
        return t

    def on_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(green)
        canvas.rect(0, A4[1] - 0.35 * cm, A4[0], 0.35 * cm, stroke=0, fill=1)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(mut)
        canvas.drawString(2.2 * cm, 1.1 * cm, 'Sight Seers Caribbean Adventures  |  sightseerscaribbean.com/leaders-in-jamaica')
        canvas.drawRightString(A4[0] - 2.2 * cm, 1.1 * cm, 'Page %d' % doc.page)
        canvas.restoreState()

    f = []
    f.append(Paragraph(escape(c.HERO['title']), h1))
    f.append(Paragraph(escape(c.HERO['subtitle']), sub))
    f.append(Paragraph(escape(c.HERO['value']), val))
    f.append(Paragraph(escape(c.HERO['support']), b))
    f.append(Paragraph('Overview', h2))
    f.append(Paragraph(escape(c.OVERVIEW), b))
    f.append(Paragraph('Key facts', h2))
    f.append(bullets([(a + ' ' + l) if a else l for a, l in c.FACTS]))
    f.append(Paragraph(escape(c.SHORE['title']), h2))
    f.append(Paragraph(escape(c.SHORE['intro']), b))
    f.append(bullets(c.SHORE['items']))
    f.append(Paragraph('The six days', h2))
    f.append(table([(d, t, x) for d, t, x in c.DAYS], [3.2 * cm, 4 * cm, 9.4 * cm], ['Day', 'Focus', 'What happens']))
    f.append(Paragraph('The eight modules', h2))
    f.append(table([(n, x[0].upper() + x[1:]) for n, x in c.MODULES], [6 * cm, 10.6 * cm], ['Module', 'Deliverable']))
    f.append(Paragraph('What every delegate takes home', h2))
    f.append(Paragraph(escape(c.TAKEHOME['intro']), b))
    f.append(bullets(c.TAKEHOME['items']))
    f.append(Paragraph('The Career Development Day', h2))
    f.append(Paragraph(escape(c.CAREER['intro']), b))
    f.append(bullets(c.CAREER['items']))
    f.append(Paragraph('Safeguarding', h2))
    f.append(bullets(c.SAFEGUARDING))
    f.append(Paragraph('Pitch Night and the Leaders Fund', h2))
    f.append(Paragraph(escape(c.PITCH), b))
    f.append(Paragraph('Who can apply', h2))
    f.append(bullets(c.WHO))
    f.append(Paragraph('For advisors', h2))
    f.append(bullets(c.ADVISORS))
    f.append(KeepTogether([Paragraph('Investment (per person, US delegation)', h2),
                           table([(a, x) for a, x, _ in c.INVEST_ROWS], [12.6 * cm, 4 * cm], ['Rate', 'Per person']), Spacer(1, 6), bullets(c.INVEST_NOTES)]))
    f.append(KeepTogether([Paragraph('Payment schedule (per person)', h2),
                           table(c.PAY_ROWS, [4.6 * cm, 5.4 * cm, 3.4 * cm, 3.2 * cm], ['Step', 'Timing', 'Early commitment', 'Standard']), Spacer(1, 6), bullets(c.PAY_NOTES)]))
    f.append(Paragraph('Funding your place', h2))
    f.append(bullets(['%s: %s' % (t, x) for t, x in c.FUNDING]))
    f.append(Paragraph('Cancellations and changes', h2))
    f.append(bullets(c.CANCEL))
    f.append(Paragraph('Travel requirements', h2))
    f.append(bullets(c.TRAVEL))
    f.append(Paragraph('Professional code of conduct', h2))
    f.append(bullets(c.CONDUCT))
    f.append(Paragraph('Safety and accountability', h2))
    f.append(bullets(c.SAFETY))
    doc = SimpleDocTemplate(os.path.join(c.OUT, c.OVERVIEW_FILE), pagesize=A4, leftMargin=2.2 * cm, rightMargin=2.2 * cm, topMargin=2 * cm,
                            bottomMargin=2 * cm, title=c.DOWNLOAD_LABEL, author='Sight Seers Caribbean Adventures')
    doc.build(f, onFirstPage=on_page, onLaterPages=on_page)
