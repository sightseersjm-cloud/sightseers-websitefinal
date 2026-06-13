#!/usr/bin/env python3
"""
Comprehensive fix for:
1. Session expand video area blank (wrapper div needs flex layout)
2. Toast z-index behind fullscreen
3. Cart z-index issues in fullscreen
4. Passport light mode: class mismatches + missing overrides
5. h4 inline styles invisible in light mode
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

# ========== 1. FIX SESSION EXPAND VIDEO LAYOUT ==========
print("=== SESSION EXPAND VIDEO FIX ===")

# The wrapper <div> around .vt-session-video and .vt-session-actions
# needs to be a flex column so flex:1 on video works
c = sr(c,
    '.vt-session.vt-session-fs .vt-session-video{min-height:0!important;flex:1!important}',
    '.vt-session.vt-session-fs .vt-session-content>div:first-child{display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden}\n.vt-session.vt-session-fs .vt-session-video{min-height:0!important;flex:1!important}',
    "Session fs wrapper → flex column")

# Also ensure the session has a solid background (not transparent)
c = sr(c,
    '.vt-session.vt-session-fs{position:fixed!important;inset:12px!important;z-index:10001!important;border-radius:20px!important;box-shadow:0 40px 100px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}',
    '.vt-session.vt-session-fs{position:fixed!important;inset:12px!important;z-index:10001!important;border-radius:20px!important;box-shadow:0 40px 100px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:linear-gradient(135deg,rgba(13,27,42,.98),rgba(20,45,68,.97))!important}',
    "Session fs → solid background")

# ========== 2. FIX TOAST Z-INDEX ==========
print("\n=== TOAST Z-INDEX FIX ===")

c = sr(c,
    '.vt-toast{position:fixed;bottom:30px;right:30px;background:var(--navy);color:#fff;padding:14px 24px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;',
    '.vt-toast{position:fixed;bottom:30px;right:30px;background:var(--navy);color:#fff;padding:14px 24px;border-radius:12px;font-size:13px;font-weight:600;z-index:100010;',
    "Toast z-index → 100010 (above fullscreen)")

# ========== 3. FIX CART Z-INDEX ==========
print("\n=== CART Z-INDEX FIX ===")

c = sr(c,
    '.vt-cart-drawer{position:fixed;top:0;right:0;bottom:0;width:340px;max-width:90vw;background:linear-gradient(180deg,#0d1b2a,#132d46);z-index:10002;',
    '.vt-cart-drawer{position:fixed;top:0;right:0;bottom:0;width:340px;max-width:90vw;background:linear-gradient(180deg,#0d1b2a,#132d46);z-index:100008;',
    "Cart drawer z-index → 100008")

c = sr(c,
    '.vt-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:10001;',
    '.vt-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:100007;',
    "Cart overlay z-index → 100007")

# ========== 4. FIX PASSPORT LIGHT MODE ==========
print("\n=== PASSPORT LIGHT MODE FIXES ===")

# Fix class mismatches: .vt-passport-stamp → .vt-stamp, .vt-passport-badge → .vt-badge
# The existing overrides use wrong selectors

# Fix existing .vt-passport-stamp overrides → .vt-stamp
c = sr(c,
    '.vt-dash-light .vt-passport-stamp{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.06)!important}',
    '.vt-dash-light .vt-stamp{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.06)!important}',
    "Fix selector: .vt-passport-stamp → .vt-stamp")

c = sr(c,
    '.vt-dash-light .vt-passport-stamp span{color:#617087!important}',
    '.vt-dash-light .vt-stamp span{color:var(--navy)!important}',
    "Fix selector: .vt-passport-stamp span → .vt-stamp span")

# Fix existing .vt-passport-badge span → .vt-badge span
c = sr(c,
    '.vt-dash-light .vt-passport-badge span{color:#617087!important}',
    '.vt-dash-light .vt-badge span{color:#617087!important}',
    "Fix selector: .vt-passport-badge span → .vt-badge span")

# Add missing passport light overrides
passport_light_extra = """
.vt-dash-light .vt-stamp small{color:#99a3b0!important}
.vt-dash-light .vt-stamp-icon{background:rgba(239,135,49,.1)!important}
.vt-dash-light .vt-stamp-icon.locked{background:rgba(0,0,0,.04)!important;color:#99a3b0!important}
.vt-dash-light .vt-stamp.collected{border-color:rgba(239,135,49,.2)!important}
.vt-dash-light .vt-badge{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-badge.earned{border-color:rgba(239,135,49,.2)!important}
.vt-dash-light .vt-badge i{color:var(--orange)!important}
.vt-dash-light h4[style*="rgba(255,255,255"]{color:var(--navy)!important;opacity:.5}
.vt-dash-light .vt-dash-header h2{color:var(--navy)!important}
.vt-dash-light .vt-dash-header-btn{color:var(--navy)!important;border-color:rgba(0,0,0,.08)!important;background:#fff!important}
.vt-dash-light .vt-dash-header-btn:hover{background:#f0f2f5!important}
"""

c = sr(c,
    '.vt-dash-light .vt-replay-card-meta{color:#99a3b0!important}',
    '.vt-dash-light .vt-replay-card-meta{color:#99a3b0!important}' + passport_light_extra,
    "Add missing passport/badge light overrides")

# ========== 5. FIX LIGHT MODE H4 INLINE STYLES ==========
print("\n=== LIGHT MODE H4 FIX ===")

# The h4 headings in passport have inline style="color:rgba(255,255,255,.5)"
# We can't override inline styles with just CSS class selectors...
# BUT we CAN with !important on a more specific selector
# Already handled above with: .vt-dash-light h4[style*="rgba(255,255,255"]

# Also fix the social feed labels
social_light_extra = """
.vt-dash-light .vt-social-online-label{color:var(--navy)!important}
.vt-dash-light .vt-social-friend-info strong{color:var(--navy)!important}
.vt-dash-light .vt-social-friend-action{color:var(--orange)!important}
.vt-dash-light .vt-social-feed-label{color:var(--navy)!important;opacity:.5}
.vt-dash-light .vt-social-post-body strong{color:var(--navy)!important}
.vt-dash-light .vt-social-post-body em{color:var(--orange)!important}
.vt-dash-light .vt-social-post-time{color:#99a3b0!important}
.vt-dash-light .vt-social-post-text{color:#617087!important}
.vt-dash-light .vt-social-post-btn{color:var(--orange)!important;border-color:rgba(239,135,49,.2)!important}
.vt-dash-light .vt-ai-input-wrap{background:#fff!important;border-color:rgba(0,0,0,.08)!important}
.vt-dash-light .vt-ai-input{color:var(--navy)!important}
.vt-dash-light .vt-ai-send{background:var(--orange)!important;color:#fff!important}
.vt-dash-light .vt-ai-chips{gap:8px}
.vt-dash-light .vt-ai-chip{background:rgba(0,0,0,.04)!important;border-color:rgba(0,0,0,.06)!important;color:var(--navy)!important}
.vt-dash-light .vt-ai-chip:hover{background:rgba(239,135,49,.1)!important;border-color:rgba(239,135,49,.2)!important;color:var(--orange)!important}
"""

c = sr(c,
    '.vt-dash-light .vt-social-post{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.04)!important}',
    '.vt-dash-light .vt-social-post{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.04)!important}' + social_light_extra,
    "Add social/AI concierge light overrides")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
