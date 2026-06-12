#!/usr/bin/env python3
"""
Make entire dashboard dark navy to match session theme.
All new feature text uses light-on-dark colors.
"""

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    c = f.read()

n = 0
def sr(c, old, new, desc=""):
    global n
    if old not in c:
        print(f"  WARN: {desc}")
        return c
    c = c.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return c

print("=== DASHBOARD → DARK NAVY ===")

# Frame background
c = sr(c,
    '.vt-dash-frame{background:#f0f2f5;border-radius:18px;overflow:hidden;border:1px solid rgba(0,0,0,.08);box-shadow:0 20px 60px rgba(0,0,0,.1)}',
    '.vt-dash-frame{background:#0d1b2a;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.06);box-shadow:0 20px 60px rgba(0,0,0,.3)}',
    "Frame → dark navy")

# Sidebar
c = sr(c,
    '.vt-dash-sidebar{background:#fff;border-right:1px solid rgba(0,0,0,.06);padding:24px 0}',
    '.vt-dash-sidebar{background:rgba(255,255,255,.02);border-right:1px solid rgba(255,255,255,.04);padding:24px 0}',
    "Sidebar → dark")

# Sidebar labels
c = sr(c,
    '.vt-dash-sidebar-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#99a3b0;font-weight:700;padding:0 12px;margin-bottom:8px}',
    '.vt-dash-sidebar-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.3);font-weight:700;padding:0 12px;margin-bottom:8px}',
    "Sidebar labels → light")

# Sidebar links
c = sr(c,
    '.vt-dash-sidebar a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;font-size:13px;color:#617087;font-weight:500;text-decoration:none;transition:background .2s,color .2s;position:relative}',
    '.vt-dash-sidebar a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;font-size:13px;color:rgba(255,255,255,.5);font-weight:500;text-decoration:none;transition:background .2s,color .2s;position:relative}',
    "Sidebar links → light")

# Main area
c = sr(c,
    '.vt-dash-main{padding:24px;overflow-x:auto}',
    '.vt-dash-main{padding:24px;overflow-x:auto;background:#0d1b2a}',
    "Main area → dark")

# Header h2
c = sr(c,
    '.vt-dash-header h2{font-size:20px;font-weight:700;color:var(--navy);margin:0}',
    '.vt-dash-header h2{font-size:20px;font-weight:700;color:#fff;margin:0}',
    "Header h2 → white")

# Header button
c = sr(c,
    ".vt-dash-header-btn{padding:8px 16px;border-radius:10px;border:1px solid rgba(0,0,0,.08);background:#fff;font-size:12px;font-weight:600;color:var(--navy);cursor:default}",
    ".vt-dash-header-btn{padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:12px;font-weight:600;color:rgba(255,255,255,.7);cursor:pointer}",
    "Header btn → dark")

# Stat cards
c = sr(c,
    '.vt-dash-stat{background:#fff;border-radius:14px;padding:18px 16px;border:1px solid rgba(0,0,0,.04)}',
    '.vt-dash-stat{background:rgba(255,255,255,.03);border-radius:14px;padding:18px 16px;border:1px solid rgba(255,255,255,.06)}',
    "Stat card → dark")

c = sr(c,
    ".vt-dash-stat strong{display:block;font-family:'Playfair Display',serif;font-size:26px;color:var(--navy);margin-bottom:2px}",
    ".vt-dash-stat strong{display:block;font-family:'Playfair Display',serif;font-size:26px;color:#fff;margin-bottom:2px}",
    "Stat strong → white")

c = sr(c,
    '.vt-dash-stat span{font-size:11px;color:#99a3b0;font-weight:500}',
    '.vt-dash-stat span{font-size:11px;color:rgba(255,255,255,.45);font-weight:500}',
    "Stat span → light")

# Empty state
c = sr(c,
    '.vt-empty-state{text-align:center;padding:60px 20px;color:#94a3b8}',
    '.vt-empty-state{text-align:center;padding:60px 20px;color:rgba(255,255,255,.4)}',
    "Empty state → dark")

c = sr(c,
    '.vt-empty-state h4{font-size:16px;color:var(--navy);margin-bottom:8px}',
    '.vt-empty-state h4{font-size:16px;color:#fff;margin-bottom:8px}',
    "Empty state h4 → white")

# Live card styles
print("\n=== LIVE CARDS → DARK ===")

# Find live card body/title/guide/price/foot styles
if '.vt-live-card-body{padding:14px}' in c:
    c = sr(c, '.vt-live-card-body{padding:14px}', '.vt-live-card-body{padding:14px;background:rgba(255,255,255,.03)}', "Live card body → dark bg")

# Live card backgrounds
for old_bg, new_bg, desc in [
    ('.vt-live-card{background:#fff;', '.vt-live-card{background:rgba(255,255,255,.04);', 'Live card bg'),
]:
    c = sr(c, old_bg, new_bg, desc)

# Schedule items
c = sr(c,
    '.vt-schedule-info h5{font-size:13px;font-weight:600;color:var(--navy);margin:0 0 2px}',
    '.vt-schedule-info h5{font-size:13px;font-weight:600;color:#fff;margin:0 0 2px}',
    "Schedule h5 → white")

c = sr(c,
    '.vt-schedule-info p{font-size:11px;color:#99a3b0;margin:0}',
    '.vt-schedule-info p{font-size:11px;color:rgba(255,255,255,.4);margin:0}',
    "Schedule p → light")

c = sr(c,
    '.vt-schedule-day strong{display:block;font-size:13px;font-weight:700;color:var(--navy)}',
    '.vt-schedule-day strong{display:block;font-size:13px;font-weight:700;color:#fff}',
    "Schedule day → white")

c = sr(c,
    '.vt-schedule-day span{font-size:9px;color:#99a3b0;text-transform:uppercase}',
    '.vt-schedule-day span{font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase}',
    "Schedule day small → light")

# Schedule item border
c = sr(c,
    '.vt-schedule-item{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04)}',
    '.vt-schedule-item{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .2s}',
    "Schedule item → dark border")

# Earnings chart h4
c = sr(c,
    '.vt-earnings-chart h4{font-size:14px;font-weight:700;color:var(--navy);margin-bottom:4px}',
    '.vt-earnings-chart h4{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px}',
    "Earnings h4 → white")

# Schedule h4
c = sr(c,
    '.vt-schedule h4{font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px}',
    '.vt-schedule h4{font-size:14px;font-weight:700;color:#fff;margin-bottom:12px}',
    "Schedule heading → white")

# Live card title, guide, price
if '.vt-live-card-title{font-size:14px;font-weight:700;color:var(--navy)' in c:
    c = sr(c, '.vt-live-card-title{font-size:14px;font-weight:700;color:var(--navy);margin-bottom:4px}', '.vt-live-card-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px}', "Card title → white")

if '.vt-live-card-guide{font-size:11px;color:#99a3b0' in c:
    c = sr(c, '.vt-live-card-guide{font-size:11px;color:#99a3b0;margin-bottom:10px}', '.vt-live-card-guide{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:10px}', "Card guide → light")

if '.vt-live-card-price{font-size:15px;font-weight:800;color:var(--navy)' in c:
    c = sr(c, '.vt-live-card-price{font-size:15px;font-weight:800;color:var(--navy)}', '.vt-live-card-price{font-size:15px;font-weight:800;color:#fff}', "Card price → white")

# Live card border
if '.vt-live-card{background:#fff;' in c:
    c = sr(c, '.vt-live-card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid rgba(0,0,0,.04);', '.vt-live-card{background:rgba(255,255,255,.04);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.06);', "Card → dark bg+border")

# Avatar info
if '.vt-dash-avatar-info{font-size:13px;font-weight:600;color:var(--navy)' in c:
    c = sr(c, '.vt-dash-avatar-info{font-size:13px;font-weight:600;color:var(--navy)}', '.vt-dash-avatar-info{font-size:13px;font-weight:600;color:#fff}', "Avatar info → white")

# Guide table td:first-child
c = sr(c,
    '.vt-guide-table td:first-child{font-weight:600;color:var(--navy)}',
    '.vt-guide-table td:first-child{font-weight:600;color:#fff}',
    "Guide table first td → white")

# Concierge input area bg - make it darker
c = sr(c,
    '.vt-ai-input-wrap{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.15)}',
    '.vt-ai-input-wrap{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.2)}',
    "AI input wrap darker")

# Chart note
c = sr(c,
    '.vt-chart-note{font-size:10px;color:#99a3b0;margin-top:24px;text-align:center}',
    '.vt-chart-note{font-size:10px;color:rgba(255,255,255,.35);margin-top:24px;text-align:center}',
    "Chart note → light")

# Chart sub
c = sr(c,
    ".vt-earnings-chart .vt-chart-sub{font-size:11px;color:#99a3b0;margin-bottom:16px}",
    ".vt-earnings-chart .vt-chart-sub{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:16px}",
    "Chart sub → light")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
