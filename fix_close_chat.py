#!/usr/bin/env python3
"""
1. Fix X/expand buttons turning blue on click (browser focus ring)
2. Expand chat area — wider side panel, taller chat
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

# ========== 1. FIX BLUE FOCUS RING ==========
print("=== FIX FOCUS RING ===")

# Add outline:none and proper active/focus styles to all interactive buttons
focus_fix = """.vt-expand-btn:focus,.vt-expand-btn:active,.vt-fs-close:focus,.vt-fs-close:active,.vt-session-expand:focus,.vt-session-expand:active,.vt-topbar-theme-btn:focus,.vt-topbar-theme-btn:active,.vt-lang-btn:focus,.vt-lang-btn:active,.vt-session-bar-btn:focus,.vt-session-bar-btn:active,.vt-session-action:focus,.vt-session-action:active,.vt-session-lang:focus,.vt-session-lang:active{outline:none!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent}
"""

c = sr(c,
    '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */',
    focus_fix + '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */',
    "Remove blue focus ring on all V-Tours buttons")

# Also fix the session expand hover/active to not go blue
c = sr(c,
    '.vt-session-expand:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.08);box-shadow:0 4px 16px rgba(0,0,0,.3)}',
    '.vt-session-expand:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.08);box-shadow:0 4px 16px rgba(0,0,0,.3)}\n.vt-session-expand:active{background:rgba(255,255,255,.3);transform:scale(.95)}',
    "Session expand active state")

# Fix the fs-close hover/active
c = sr(c,
    '.vt-fs-close:hover{background:rgba(255,255,255,.2);transform:scale(1.1)}',
    '.vt-fs-close:hover{background:rgba(255,255,255,.2);transform:scale(1.1)}\n.vt-fs-close:active{background:rgba(255,255,255,.3);transform:scale(.92)}',
    "Close button active state")

# ========== 2. EXPAND CHAT AREA ==========
print("\n=== EXPAND CHAT ===")

# Increase chat max-height from 180px to 280px
c = sr(c,
    '.vt-session-chat{flex:1;padding:12px;overflow:hidden;max-height:180px;display:flex;flex-direction:column}',
    '.vt-session-chat{flex:1;padding:12px;overflow:hidden;max-height:280px;display:flex;flex-direction:column}',
    "Chat max-height 180px → 280px")

# Increase side panel width from 240px to 280px
c = sr(c,
    '.vt-session-content{display:grid;grid-template-columns:1fr 240px;min-height:200px}',
    '.vt-session-content{display:grid;grid-template-columns:1fr 280px;min-height:200px}',
    "Side panel width 240px → 280px")

# In fullscreen, increase side panel to 320px and remove chat max-height
c = sr(c,
    '.vt-session.vt-session-fs .vt-session-content{flex:1!important;min-height:0!important;display:grid!important;grid-template-columns:1fr 280px!important}',
    '.vt-session.vt-session-fs .vt-session-content{flex:1!important;min-height:0!important;display:grid!important;grid-template-columns:1fr 320px!important}\n.vt-session.vt-session-fs .vt-session-chat{max-height:none!important;flex:1!important}',
    "Fullscreen side panel 320px + unlimited chat height")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
