#!/usr/bin/env python3
"""
Fix rev-cards, cat-cards, and step cards that sit on LIGHT page backgrounds.
These were incorrectly changed to dark-theme colors but they're outside the dashboard.
"""

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    c = f.read()

n = 0
def sr(c, old, new, desc=""):
    global n
    if old not in c:
        print(f"  SKIP: {desc}")
        return c
    c = c.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return c

print("=== RESTORE PAGE-LEVEL CARDS TO LIGHT THEME ===")

# Revenue cards - on vt-sec--alt (#f7fbff light bg)
c = sr(c,
    ".vt-rev-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
    ".vt-rev-card{background:#fff;border:1px solid rgba(0,0,0,.06);",
    "Rev card → white bg")

c = sr(c,
    ".vt-rev-card strong{display:block;font-family:'Playfair Display',serif;font-size:20px;color:#fff;",
    ".vt-rev-card strong{display:block;font-family:'Playfair Display',serif;font-size:20px;color:var(--navy);",
    "Rev card strong → navy")

c = sr(c,
    ".vt-rev-card span{font-size:12px;color:rgba(255,255,255,.45)}",
    ".vt-rev-card span{font-size:12px;color:#617087}",
    "Rev card span → gray")

# Category cards - check what section they're in
# Let me check: cat-cards are in the "Tour Categories" section
# which also uses vt-sec--alt (light bg)
c = sr(c,
    ".vt-cat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
    ".vt-cat-card{background:#fff;border:1px solid rgba(0,0,0,.06);",
    "Cat card → white bg")

c = sr(c,
    ".vt-cat-card:hover{transform:translateY(-8px);box-shadow:0 20px 48px rgba(0,0,0,.3)}",
    ".vt-cat-card:hover{transform:translateY(-8px);box-shadow:0 20px 48px rgba(0,0,0,.1)}",
    "Cat card hover → light shadow")

c = sr(c,
    ".vt-cat-card h3{font-size:16px;font-weight:700;color:#fff;",
    ".vt-cat-card h3{font-size:16px;font-weight:700;color:var(--navy);",
    "Cat card h3 → navy")

c = sr(c,
    ".vt-cat-card p{font-size:13px;color:rgba(255,255,255,.5);",
    ".vt-cat-card p{font-size:13px;color:#617087;",
    "Cat card p → gray")

# Step cards - in "How It Works" section
c = sr(c,
    ".vt-step{position:relative;padding:28px 24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
    ".vt-step{position:relative;padding:28px 24px;background:#fff;border:1px solid rgba(0,0,0,.06);",
    "Step card → white bg")

c = sr(c,
    ".vt-step:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.25)}",
    ".vt-step:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.08)}",
    "Step hover → light shadow")

c = sr(c,
    ".vt-step h4{font-size:15px;font-weight:700;color:#fff;",
    ".vt-step h4{font-size:15px;font-weight:700;color:var(--navy);",
    "Step h4 → navy")

c = sr(c,
    ".vt-step p{font-size:13px;color:rgba(255,255,255,.5);",
    ".vt-step p{font-size:13px;color:#617087;",
    "Step p → gray")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
