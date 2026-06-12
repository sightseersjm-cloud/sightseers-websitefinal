#!/usr/bin/env python3
"""Fix remaining light-theme items that dark_dashboard.py missed."""

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    c = f.read()

n = 0
def sr(c, old, new, desc=""):
    global n
    if old not in c:
        print(f"  SKIP: {desc} (already done or not found)")
        return c
    c = c.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return c

print("=== REMAINING DARK FIXES ===")

# Avatar info - has line-height:1.3
c = sr(c,
    '.vt-dash-avatar-info{font-size:13px;font-weight:600;color:var(--navy);line-height:1.3}',
    '.vt-dash-avatar-info{font-size:13px;font-weight:600;color:#fff;line-height:1.3}',
    "Avatar info → white")

# Avatar info span
c = sr(c,
    '.vt-dash-avatar-info span{display:block;font-size:10px;color:#99a3b0;font-weight:500}',
    '.vt-dash-avatar-info span{display:block;font-size:10px;color:rgba(255,255,255,.4);font-weight:500}',
    "Avatar info span → light")

# Avatar border
c = sr(c,
    '.vt-dash-avatar{display:flex;align-items:center;gap:10px;padding:16px;border-top:1px solid rgba(0,0,0,.06);margin-top:auto}',
    '.vt-dash-avatar{display:flex;align-items:center;gap:10px;padding:16px;border-top:1px solid rgba(255,255,255,.06);margin-top:auto}',
    "Avatar border → dark")

# Live header h3
c = sr(c,
    '.vt-live-header h3{font-size:15px;font-weight:700;color:var(--navy);margin:0}',
    '.vt-live-header h3{font-size:15px;font-weight:700;color:#fff;margin:0}',
    "Live header h3 → white")

# Live card border fix (already has dark bg from first script but border is still light)
c = sr(c,
    '.vt-live-card{background:rgba(255,255,255,.04);border-radius:14px;overflow:hidden;border:1px solid rgba(0,0,0,.04);',
    '.vt-live-card{background:rgba(255,255,255,.04);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.06);',
    "Live card border → dark")

# Live card body padding
c = sr(c,
    '.vt-live-card-body{padding:12px 14px}',
    '.vt-live-card-body{padding:12px 14px;background:rgba(255,255,255,.03)}',
    "Live card body → subtle bg")

# Live card title
c = sr(c,
    '.vt-live-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px}',
    '.vt-live-card-title{font-size:13px;font-weight:700;color:#fff;margin-bottom:4px}',
    "Card title → white")

# Live card guide
c = sr(c,
    '.vt-live-card-guide{font-size:11px;color:#617087;margin-bottom:8px}',
    '.vt-live-card-guide{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px}',
    "Card guide → light")

# Live card price
c = sr(c,
    '.vt-live-card-price{font-size:14px;font-weight:700;color:var(--navy)}',
    '.vt-live-card-price{font-size:14px;font-weight:700;color:#fff}',
    "Card price → white")

# Stat small color
c = sr(c,
    '.vt-dash-stat small{display:block;font-size:10px;color:#617087;margin-top:2px}',
    '.vt-dash-stat small{display:block;font-size:10px;color:rgba(255,255,255,.35);margin-top:2px}',
    "Stat small → light")

# Sidebar active state
c = sr(c,
    '.vt-dash-sidebar a:hover{background:rgba(0,0,0,.03);color:var(--navy)}',
    '.vt-dash-sidebar a:hover{background:rgba(255,255,255,.05);color:#fff}',
    "Sidebar hover → dark")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} additional changes.")
