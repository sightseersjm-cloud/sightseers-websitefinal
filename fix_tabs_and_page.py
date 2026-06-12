#!/usr/bin/env python3
"""
Fix dashboard tabs and other page-level elements that sit on light backgrounds.
The tabs are OUTSIDE the dark dashboard frame, so they need light-friendly colors.
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

print("=== FIX PAGE-LEVEL ELEMENTS ===")

# Dashboard tabs - restore to light-friendly (they sit on #f7fbff page bg)
c = sr(c,
    ".vt-dash-tab{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;transition:all .35s cubic-bezier(.25,.46,.45,.94);border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:rgba(255,255,255,.6);user-select:none}",
    ".vt-dash-tab{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;transition:all .35s cubic-bezier(.25,.46,.45,.94);border:2px solid rgba(0,0,0,.08);background:#fff;color:var(--navy);user-select:none}",
    "Tabs → light bg + dark text")

c = sr(c,
    ".vt-dash-tab:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2);color:#fff}",
    ".vt-dash-tab:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08);color:var(--navy)}",
    "Tabs hover → light shadow")

# Signup section - these also sit on light page backgrounds
# The signup toggle
c = sr(c,
    ".vt-signup-toggle{display:flex;justify-content:center;gap:8px;margin-bottom:32px;background:rgba(255,255,255,.04);",
    ".vt-signup-toggle{display:flex;justify-content:center;gap:8px;margin-bottom:32px;background:#f0f2f5;",
    "Signup toggle → light bg")

c = sr(c,
    ".vt-signup-toggle-btn{flex:1;padding:12px 24px;border-radius:11px;text-align:center;font-size:14px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.25,.46,.45,.94);color:rgba(255,255,255,.5);",
    ".vt-signup-toggle-btn{flex:1;padding:12px 24px;border-radius:11px;text-align:center;font-size:14px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.25,.46,.45,.94);color:#617087;",
    "Signup toggle btn → dark text")

c = sr(c,
    ".vt-signup-toggle-btn:hover{color:#fff}",
    ".vt-signup-toggle-btn:hover{color:var(--navy)}",
    "Signup toggle hover → navy")

c = sr(c,
    ".vt-signup-toggle-btn.active{background:rgba(255,255,255,.08);color:#fff;box-shadow:0 2px 12px rgba(0,0,0,.15)}",
    ".vt-signup-toggle-btn.active{background:#fff;color:var(--navy);box-shadow:0 2px 12px rgba(0,0,0,.08)}",
    "Signup toggle active → white")

c = sr(c,
    ".vt-signup-card{background:rgba(13,27,42,.8);border-radius:24px;border:1px solid rgba(255,255,255,.06);",
    ".vt-signup-card{background:#fff;border-radius:24px;border:1px solid rgba(0,0,0,.06);",
    "Signup card → white bg")

c = sr(c,
    ".vt-signup-field label{display:block;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);",
    ".vt-signup-field label{display:block;font-size:12px;font-weight:700;color:var(--navy);",
    "Signup label → navy")

c = sr(c,
    ".vt-signup-field input,.vt-signup-field textarea{width:100%;padding:14px 18px;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;font-size:14px;font-family:inherit;background:rgba(255,255,255,.04);color:#fff;",
    ".vt-signup-field input,.vt-signup-field textarea{width:100%;padding:14px 18px;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;font-size:14px;font-family:inherit;background:#fafbfc;color:var(--navy);",
    "Signup input → light")

c = sr(c,
    ".vt-signup-field input:focus,.vt-signup-field textarea:focus{border-color:var(--orange);background:rgba(255,255,255,.08);",
    ".vt-signup-field input:focus,.vt-signup-field textarea:focus{border-color:var(--orange);background:#fff;",
    "Signup focus → white")

c = sr(c,
    ".vt-signup-tag{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;font-size:12px;font-weight:600;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(255,255,255,.5);",
    ".vt-signup-tag{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;font-size:12px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#617087;",
    "Signup tag → light")

c = sr(c,
    ".vt-signup-tag:hover{border-color:var(--orange);color:#fff}",
    ".vt-signup-tag:hover{border-color:var(--orange);color:var(--navy)}",
    "Signup tag hover → navy")

c = sr(c,
    ".vt-signup-note{text-align:center;font-size:12px;color:rgba(255,255,255,.4);",
    ".vt-signup-note{text-align:center;font-size:12px;color:#94a3b8;",
    "Signup note → gray")

# Cat cards, steps, rev cards - check if they're on dark or light bg sections
# The V-Tours page uses .vt-sec--alt (#f7fbff light) for dashboard showcase
# But categories/steps/revenue are in OTHER sections - let me check what bg they have
# Categories are in "Tour Categories" section
# Steps are in "How It Works" section
# Revenue is in "Revenue Model" section
# These sections appear to be on dark navy gradient backgrounds already
# So those dark changes are CORRECT - leave them alone

# Rev card text that we changed - verify these are on dark bg
# Looking at the HTML structure, rev-cards are in the Guides/Revenue section
# which has a dark gradient background, so dark text changes are correct

print("\n=== FIX SECTION BACKGROUNDS ===")

# The vt-sec--alt section (dashboard showcase) needs its bg to work for the tabs
# It's already #f7fbff which is fine. The tabs just needed the color fix above.

# Check if the "Coming this Summer" section text is visible
# sec-title uses color:var(--navy) which is fine on light bg

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
