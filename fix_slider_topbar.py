#!/usr/bin/env python3
"""
1. Fix pricing slider styling in light mode (track too dark)
2. Fix topbar buttons invisible in light mode (dark on dark topbar)
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

# ========== 1. FIX PRICING SLIDER ==========
print("=== FIX PRICING SLIDER ===")

# Replace minimal slider CSS with full cross-browser styling
c = sr(c,
    '.vt-pricing-slider{flex:1;margin:0 12px;accent-color:var(--orange)}',
    """.vt-pricing-slider{flex:1;margin:0 12px;accent-color:var(--orange);-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:rgba(255,255,255,.12);outline:none;cursor:pointer}
.vt-pricing-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--orange);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;transition:transform .15s}
.vt-pricing-slider::-webkit-slider-thumb:hover{transform:scale(1.15)}
.vt-pricing-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--orange);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer}
.vt-pricing-slider::-webkit-slider-runnable-track{border-radius:3px}
.vt-dash-light .vt-pricing-slider{background:rgba(0,0,0,.08)}
.vt-dash-light .vt-pricing-slider::-webkit-slider-thumb{border-color:rgba(0,0,0,.08);box-shadow:0 2px 8px rgba(0,0,0,.15)}""",
    "Full slider styling with thumb + track")

# ========== 2. FIX TOPBAR BUTTONS IN LIGHT MODE ==========
print("\n=== FIX TOPBAR BUTTONS IN LIGHT MODE ===")

# The topbar stays dark (navy) in light mode, so buttons inside should stay LIGHT
# Current overrides make them dark-on-dark which is invisible
c = sr(c,
    '.vt-dash-light .vt-topbar-theme-btn{background:rgba(0,0,0,.06);color:var(--navy)}',
    '.vt-dash-light .vt-topbar-theme-btn{background:rgba(255,255,255,.12);color:rgba(255,255,255,.8)}',
    "Fix theme btn: keep light on dark topbar")

c = sr(c,
    '.vt-dash-light .vt-topbar-theme-btn:hover{background:rgba(0,0,0,.1)}',
    '.vt-dash-light .vt-topbar-theme-btn:hover{background:rgba(255,255,255,.2);color:#fff}',
    "Fix theme btn hover in light mode")

c = sr(c,
    '.vt-dash-light .vt-lang-btn{background:rgba(0,0,0,.06);color:var(--navy)}',
    '.vt-dash-light .vt-lang-btn{background:rgba(255,255,255,.12);color:rgba(255,255,255,.8)}',
    "Fix lang btn: keep light on dark topbar")

c = sr(c,
    '.vt-dash-light .vt-lang-btn:hover{background:rgba(0,0,0,.1)}',
    '.vt-dash-light .vt-lang-btn:hover{background:rgba(255,255,255,.2);color:#fff}',
    "Fix lang btn hover in light mode")

# Also fix the toggle slider in light mode - make sure it looks right
# The dark track color in light mode needs fixing
c = sr(c,
    '.vt-dash-light .vt-toggle-slider{background:rgba(0,0,0,.12)!important}',
    '.vt-dash-light .vt-toggle-slider{background:rgba(0,0,0,.15)!important}',
    "Toggle slider track in light mode")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
