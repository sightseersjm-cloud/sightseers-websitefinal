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
    """The programme overview, branded like the tent rental agreement PDF: glossy header band with the logo, green and orange
    accent bars, section headings with a green tab, shaded rows, and a navy footer band with the page numbers."""
    import io
    from PIL import Image
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, Flowable, KeepTogether, NextPageTemplate
    from xml.sax.saxutils import escape

    W, PH = letter
    M, BANDH, FOOTH = 48, 132, 30
    navy, green2, orange = colors.Color(6/255, 58/255, 99/255), colors.Color(112/255, 194/255, 87/255), colors.Color(239/255, 135/255, 49/255)
    ink, mut = colors.Color(23/255, 42/255, 52/255), colors.Color(91/255, 107/255, 118/255)
    hair, soft = colors.Color(224/255, 231/255, 227/255), colors.Color(244/255, 249/255, 246/255)

    # the logo, downscaled the way the tent agreement does it so the file stays small
    logo_path = os.path.join(c.ROOT, 'public', 'assets', 'inline', '1ba92aa926.png')
    im = Image.open(logo_path).convert('RGBA')
    ar = im.size[0] / im.size[1]
    im = im.resize((440, round(440 / ar)))
    buf = io.BytesIO(); im.save(buf, 'PNG'); buf.seek(0)
    from reportlab.lib.utils import ImageReader
    logo = ImageReader(buf)

    def bar(cv, y):
        cv.setFillColor(green2); cv.rect(0, y, W * 0.62, 4, stroke=0, fill=1)
        cv.setFillColor(orange); cv.rect(W * 0.62, y, W * 0.38, 4, stroke=0, fill=1)

    def first_page(cv, doc):
        cv.saveState()
        cv.setFillColor(soft); cv.rect(0, PH - BANDH, W, BANDH, stroke=0, fill=1)
        p = cv.beginPath(); p.rect(0, PH - BANDH, W, BANDH); cv.clipPath(p, stroke=0, fill=0)
        cv.setFillColor(green2); cv.setFillAlpha(0.16); cv.circle(W - 70, PH - 26, 96, stroke=0, fill=1)
        cv.setFillColor(orange); cv.setFillAlpha(0.12); cv.circle(64, PH - (BANDH - 4), 74, stroke=0, fill=1)
        cv.setFillColor(colors.white); cv.setFillAlpha(0.55); cv.rect(0, PH - 46, W, 46, stroke=0, fill=1)
        cv.restoreState(); cv.saveState()
        lw = 158; lh = lw / ar
        cv.drawImage(logo, M, PH - 30 - lh, width=lw, height=lh, mask='auto')
        cv.setFillColor(orange); cv.setFont('Helvetica-Bold', 9); cv.drawRightString(W - M, PH - 60, 'A SIGHT SEERS FLAGSHIP PROGRAMME')
        cv.setFillColor(navy); cv.setFont('Helvetica-Bold', 18); cv.drawRightString(W - M, PH - 84, c.HERO['title'])
        cv.setFillColor(mut); cv.setFont('Helvetica', 9); cv.drawRightString(W - M, PH - 100, c.HERO['subtitle'])
        bar(cv, PH - BANDH)
        cv.restoreState()

    def later_page(cv, doc):
        cv.saveState(); bar(cv, PH - 4); cv.restoreState()

    class Numbered(rl_canvas.Canvas):
        def __init__(self, *a, **k):
            rl_canvas.Canvas.__init__(self, *a, **k); self._saved = []
        def showPage(self):
            self._saved.append(dict(self.__dict__)); self._startPage()
        def save(self):
            n = len(self._saved)
            for st in self._saved:
                self.__dict__.update(st); self._footer(n); rl_canvas.Canvas.showPage(self)
            rl_canvas.Canvas.save(self)
        def _footer(self, n):
            self.saveState()
            self.setFillColor(navy); self.rect(0, 0, W, FOOTH, stroke=0, fill=1)
            self.setFillColor(green2); self.rect(0, FOOTH - 2, W * 0.62, 2, stroke=0, fill=1)
            self.setFillColor(orange); self.rect(W * 0.62, FOOTH - 2, W * 0.38, 2, stroke=0, fill=1)
            self.setFillColor(colors.white); self.setFont('Helvetica', 8)
            self.drawString(M, 11, 'Sight Seers Caribbean Adventures   |   +1 (876) 465-0630   |   info@sightseerscaribbean.com')
            self.drawRightString(W - M, 11, 'Page %d of %d' % (self._pageNumber, n))
            self.restoreState()

    body = ParagraphStyle('body', fontName='Helvetica', fontSize=9.6, leading=13.4, textColor=ink, spaceAfter=3)
    lead = ParagraphStyle('lead', parent=body, fontName='Helvetica-Bold', fontSize=13.5, leading=18, textColor=navy, spaceAfter=6)
    cell = ParagraphStyle('cell', parent=body, fontSize=9.2, leading=12.4, spaceAfter=0)
    cellb = ParagraphStyle('cellb', parent=cell, fontName='Helvetica-Bold', textColor=mut)
    cellp = ParagraphStyle('cellp', parent=cell, fontName='Helvetica-Bold', textColor=navy)

    class Heading(Flowable):
        def __init__(self, text): Flowable.__init__(self); self.text = text; self.height = 38; self.width = W - 2 * M
        def wrap(self, aw, ah): return aw, self.height
        def draw(self):
            cv = self.canv
            cv.setFillColor(green2); cv.rect(0, 12, 4, 15, stroke=0, fill=1)
            cv.setFillColor(navy); cv.setFont('Helvetica-Bold', 12.5); cv.drawString(12, 15, self.text)
            cv.setStrokeColor(hair); cv.setLineWidth(0.8); cv.line(0, 6, self.width, 6)

    class Bullet(Flowable):
        def __init__(self, text):
            Flowable.__init__(self); self.p = Paragraph(escape(text), body); self.w = W - 2 * M - 14
        def wrap(self, aw, ah):
            _, h = self.p.wrap(self.w, ah); self.h = h; return aw, h + 2
        def draw(self):
            cv = self.canv
            cv.setFillColor(orange); cv.circle(3, self.h - 6, 2, stroke=0, fill=1)
            self.p.drawOn(cv, 14, 2)

    def h2(t): return Heading(t)
    def para(t, st=body): return Paragraph(escape(t), st)
    def bullets(items): return [Bullet(i) for i in items]

    def rows(data, widths, head=None, price_cols=()):
        out = []
        if head: out.append([Paragraph(escape(h), cellb) for h in head])
        for r in data:
            out.append([Paragraph(escape(x), cellp if i in price_cols else (cellb if i == 0 else cell)) for i, x in enumerate(r)])
        t = Table(out, colWidths=widths, repeatRows=1 if head else 0)
        st = [('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
              ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6)]
        start = 1 if head else 0
        for i in range(start, len(out)):
            if (i - start) % 2 == 0: st.append(('BACKGROUND', (0, i), (-1, i), soft))
        if head: st.append(('LINEBELOW', (0, 0), (-1, 0), 0.8, hair))
        t.setStyle(TableStyle(st))
        return t

    CW = W - 2 * M
    f = []
    f.append(para(c.HERO['value'], lead))
    f.append(para(c.HERO['support']))
    f.append(h2('Overview')); f.append(para(c.OVERVIEW))
    f.append(h2('Key facts')); f += bullets([(a + ' ' + l) if a else l for a, l in c.FACTS])
    f.append(h2(c.SHORE['title'])); f.append(para(c.SHORE['intro'])); f += bullets(c.SHORE['items'])
    f.append(h2('The six days'))
    f.append(rows(c.DAYS, [100, 120, CW - 220], ['Day', 'Focus', 'What happens']))
    f.append(h2('The eight modules'))
    f.append(rows([(n, x[0].upper() + x[1:]) for n, x in c.MODULES], [170, CW - 170], ['Module', 'Deliverable']))
    f.append(h2('What every delegate takes home')); f.append(para(c.TAKEHOME['intro'])); f += bullets(c.TAKEHOME['items'])
    f.append(h2('The Career Development Day')); f.append(para(c.CAREER['intro'])); f += bullets(c.CAREER['items'])
    f.append(h2('Safeguarding')); f += bullets(c.SAFEGUARDING)
    f.append(h2('Pitch Night and the Leaders Fund')); f.append(para(c.PITCH))
    f.append(h2('Who can apply')); f += bullets(c.WHO)
    f.append(h2('For advisors')); f += bullets(c.ADVISORS)
    f.append(KeepTogether([h2('Investment (per person, US delegation)'), rows([(a, x) for a, x, _ in c.INVEST_ROWS], [CW - 110, 110], ['Rate', 'Per person'], price_cols=(1,)), Spacer(1, 6)] ))
    f += bullets(c.INVEST_NOTES)
    f.append(KeepTogether([h2('Payment schedule (per person)'), para(c.APPFEE_NOTE), rows(c.PAY_ROWS, [170, CW - 290, 120], ['Step', 'Timing', 'Amount'], price_cols=(2,)), Spacer(1, 6)]))
    f += bullets(c.PAY_NOTES)
    f.append(h2('Funding your place')); f += bullets(['%s: %s' % (t, x) for t, x in c.FUNDING])
    f.append(h2('Cancellations and changes')); f += bullets(c.CANCEL)
    f.append(h2('Travel requirements')); f += bullets(c.TRAVEL)
    f.append(h2('Professional code of conduct')); f += bullets(c.CONDUCT)
    f.append(h2('Safety and accountability')); f += bullets(c.SAFETY)
    f.append(KeepTogether([h2('Contact and how to apply'),
        rows([('Business', 'Sight Seers Caribbean Adventures'), ('Phone', '+1 (876) 465-0630'), ('Email', 'info@sightseerscaribbean.com'),
              ('Apply', 'sightseerscaribbean.com/leaders-in-jamaica')], [110, CW - 110])]))

    # a heading never sits alone at the bottom of a page: keep it with whatever follows it
    grouped, i = [], 0
    while i < len(f):
        if isinstance(f[i], Heading) and i + 1 < len(f):
            grouped.append(KeepTogether([f[i], f[i + 1]])); i += 2
        else:
            grouped.append(f[i]); i += 1
    f = grouped

    doc = BaseDocTemplate(os.path.join(c.OUT, c.OVERVIEW_FILE), pagesize=letter, title=c.DOWNLOAD_LABEL, author='Sight Seers Caribbean Adventures',
                          leftMargin=M, rightMargin=M, topMargin=48, bottomMargin=FOOTH + 16)
    first = Frame(M, FOOTH + 16, CW, PH - (BANDH + 26) - (FOOTH + 16), id='first', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    later = Frame(M, FOOTH + 16, CW, PH - 48 - (FOOTH + 16), id='later', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='first', frames=[first], onPage=first_page, autoNextPageTemplate='later'),
                          PageTemplate(id='later', frames=[later], onPage=later_page)])
    doc.build(f, canvasmaker=Numbered)
