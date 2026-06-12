#!/usr/bin/env python3
"""
Fix Guide Portal remaining light colors + replace emoji with Font Awesome icons.
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

def sr_all(c, old, new, desc=""):
    global n
    count = c.count(old)
    if count == 0:
        print(f"  SKIP: {desc}")
        return c
    c = c.replace(old, new)
    n += count
    print(f"  OK: {desc} ({count}x)")
    return c

# ========== DASHBOARD CSS FIXES ==========
print("=== REMAINING DASHBOARD CSS ===")

# Chart bar span labels
c = sr(c,
    ".vt-chart-bar span{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:9px;color:#99a3b0;font-weight:600}",
    ".vt-chart-bar span{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(255,255,255,.4);font-weight:600}",
    "Chart bar labels")

# Dashboard tabs
c = sr(c,
    ".vt-dash-tab{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;transition:all .35s cubic-bezier(.25,.46,.45,.94);border:2px solid rgba(0,0,0,.08);background:#fff;color:var(--navy);user-select:none}",
    ".vt-dash-tab{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;transition:all .35s cubic-bezier(.25,.46,.45,.94);border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:rgba(255,255,255,.6);user-select:none}",
    "Dash tabs")

c = sr(c,
    ".vt-dash-tab:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}",
    ".vt-dash-tab:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2);color:#fff}",
    "Dash tabs hover")

# Guide table row hover (dark version)
c = sr(c,
    ".vt-guide-table tbody tr:hover{background:rgba(239,135,49,.06)}",
    ".vt-guide-table tbody tr:hover{background:rgba(239,135,49,.1)}",
    "Guide table hover stronger")

# Guide table cursor
c = sr(c,
    ".vt-guide-table tr{cursor:pointer;transition:background .2s}",
    ".vt-guide-table tr{cursor:pointer;transition:background .2s;color:rgba(255,255,255,.45)}",
    "Guide table tr color")

# ========== LANDING PAGE SECTIONS (inside V-Tours dark bg) ==========
print("\n=== V-TOURS LANDING PAGE CARDS ===")

# Category cards
c = sr(c,
    ".vt-cat-card{background:#fff;border:1px solid rgba(0,0,0,.06);",
    ".vt-cat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
    "Cat card bg")

c = sr(c,
    ".vt-cat-card:hover{transform:translateY(-8px);box-shadow:0 20px 48px rgba(0,0,0,.1)}",
    ".vt-cat-card:hover{transform:translateY(-8px);box-shadow:0 20px 48px rgba(0,0,0,.3)}",
    "Cat card hover shadow")

c = sr(c,
    ".vt-cat-card h3{font-size:16px;font-weight:700;color:var(--navy);margin-bottom:8px}",
    ".vt-cat-card h3{font-size:16px;font-weight:700;color:#fff;margin-bottom:8px}",
    "Cat card h3")

c = sr(c,
    ".vt-cat-card p{font-size:13px;color:#617087;line-height:1.6}",
    ".vt-cat-card p{font-size:13px;color:rgba(255,255,255,.5);line-height:1.6}",
    "Cat card p")

# Step cards
c = sr(c,
    ".vt-step{position:relative;padding:28px 24px;background:#fff;border:1px solid rgba(0,0,0,.06);",
    ".vt-step{position:relative;padding:28px 24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
    "Step card bg")

c = sr(c,
    ".vt-step:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.08)}",
    ".vt-step:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.25)}",
    "Step hover shadow")

c = sr(c,
    ".vt-step h4{font-size:15px;font-weight:700;color:var(--navy);margin-bottom:8px}",
    ".vt-step h4{font-size:15px;font-weight:700;color:#fff;margin-bottom:8px}",
    "Step h4")

c = sr(c,
    ".vt-step p{font-size:13px;color:#617087;line-height:1.65}",
    ".vt-step p{font-size:13px;color:rgba(255,255,255,.5);line-height:1.65}",
    "Step p")

# Revenue cards
c = sr(c,
    ".vt-rev-card{background:#fff;border:1px solid rgba(0,0,0,.06);",
    ".vt-rev-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);",
    "Rev card bg")

c = sr(c,
    ".vt-rev-card strong{display:block;font-family:'Playfair Display',serif;font-size:20px;color:var(--navy);margin-bottom:4px}",
    ".vt-rev-card strong{display:block;font-family:'Playfair Display',serif;font-size:20px;color:#fff;margin-bottom:4px}",
    "Rev card strong")

c = sr(c,
    ".vt-rev-card span{font-size:12px;color:#617087}",
    ".vt-rev-card span{font-size:12px;color:rgba(255,255,255,.45)}",
    "Rev card span")

# Signup section (base styles - not the body.theme-night overrides)
c = sr(c,
    ".vt-signup-toggle{display:flex;justify-content:center;gap:8px;margin-bottom:32px;background:#f0f2f5;",
    ".vt-signup-toggle{display:flex;justify-content:center;gap:8px;margin-bottom:32px;background:rgba(255,255,255,.04);",
    "Signup toggle bg")

c = sr(c,
    ".vt-signup-toggle-btn{flex:1;padding:12px 24px;border-radius:11px;text-align:center;font-size:14px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.25,.46,.45,.94);color:#617087;",
    ".vt-signup-toggle-btn{flex:1;padding:12px 24px;border-radius:11px;text-align:center;font-size:14px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.25,.46,.45,.94);color:rgba(255,255,255,.5);",
    "Signup toggle btn color")

c = sr(c,
    ".vt-signup-toggle-btn:hover{color:var(--navy)}",
    ".vt-signup-toggle-btn:hover{color:#fff}",
    "Signup toggle hover")

c = sr(c,
    ".vt-signup-toggle-btn.active{background:#fff;color:var(--navy);box-shadow:0 2px 12px rgba(0,0,0,.08)}",
    ".vt-signup-toggle-btn.active{background:rgba(255,255,255,.08);color:#fff;box-shadow:0 2px 12px rgba(0,0,0,.15)}",
    "Signup toggle active")

c = sr(c,
    ".vt-signup-card{background:#fff;border-radius:24px;border:1px solid rgba(0,0,0,.06);",
    ".vt-signup-card{background:rgba(13,27,42,.8);border-radius:24px;border:1px solid rgba(255,255,255,.06);",
    "Signup card bg")

c = sr(c,
    ".vt-signup-field label{display:block;font-size:12px;font-weight:700;color:var(--navy);",
    ".vt-signup-field label{display:block;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);",
    "Signup field label")

c = sr(c,
    ".vt-signup-field input,.vt-signup-field textarea{width:100%;padding:14px 18px;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;font-size:14px;font-family:inherit;background:#fafbfc;",
    ".vt-signup-field input,.vt-signup-field textarea{width:100%;padding:14px 18px;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;font-size:14px;font-family:inherit;background:rgba(255,255,255,.04);color:#fff;",
    "Signup field input")

c = sr(c,
    ".vt-signup-field input:focus,.vt-signup-field textarea:focus{border-color:var(--orange);background:#fff;",
    ".vt-signup-field input:focus,.vt-signup-field textarea:focus{border-color:var(--orange);background:rgba(255,255,255,.08);",
    "Signup field focus")

c = sr(c,
    ".vt-signup-tag{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;font-size:12px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#617087;",
    ".vt-signup-tag{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;font-size:12px;font-weight:600;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(255,255,255,.5);",
    "Signup tag")

c = sr(c,
    ".vt-signup-tag:hover{border-color:var(--orange);color:var(--navy)}",
    ".vt-signup-tag:hover{border-color:var(--orange);color:#fff}",
    "Signup tag hover")

c = sr(c,
    ".vt-signup-note{text-align:center;font-size:12px;color:#94a3b8;",
    ".vt-signup-note{text-align:center;font-size:12px;color:rgba(255,255,255,.4);",
    "Signup note")

# ========== EMOJI REPLACEMENTS ==========
print("\n=== EMOJI → FONT AWESOME ICONS ===")

# Sentiment Current Mood emoji → icon
c = sr(c,
    '<strong style="font-size:28px">&#128522;</strong><span>Current Mood</span>',
    '<strong style="font-size:28px"><i class="fas fa-smile" style="color:var(--orange)"></i></strong><span>Current Mood</span>',
    "Mood emoji → icon")

# Sentiment floating emojis → icons
c = sr(c,
    '<div class="vt-sentiment-emojis"><span class="vt-emoji-float" style="animation-delay:0s">&#128525;</span><span class="vt-emoji-float" style="animation-delay:.3s">&#128079;</span><span class="vt-emoji-float" style="animation-delay:.6s">&#10084;</span><span class="vt-emoji-float" style="animation-delay:.9s">&#128293;</span><span class="vt-emoji-float" style="animation-delay:1.2s">&#127796;</span><span class="vt-emoji-float" style="animation-delay:1.5s">&#128247;</span><span class="vt-emoji-float" style="animation-delay:1.8s">&#128588;</span></div>',
    '<div class="vt-sentiment-emojis"><span class="vt-emoji-float" style="animation-delay:0s"><i class="fas fa-heart" style="color:#ef4444"></i></span><span class="vt-emoji-float" style="animation-delay:.3s"><i class="fas fa-thumbs-up" style="color:var(--orange)"></i></span><span class="vt-emoji-float" style="animation-delay:.6s"><i class="fas fa-heart" style="color:#ef4444"></i></span><span class="vt-emoji-float" style="animation-delay:.9s"><i class="fas fa-fire" style="color:#f97316"></i></span><span class="vt-emoji-float" style="animation-delay:1.2s"><i class="fas fa-tree" style="color:#22c55e"></i></span><span class="vt-emoji-float" style="animation-delay:1.5s"><i class="fas fa-camera" style="color:#3b82f6"></i></span><span class="vt-emoji-float" style="animation-delay:1.8s"><i class="fas fa-hands" style="color:var(--orange)"></i></span></div>',
    "Sentiment emojis → icons")

# Top Gift stat emoji → icon
c = sr(c,
    '<strong>&#127796;</strong><span>Top Gift</span><small>Palm Tree ($10)</small>',
    '<strong><i class="fas fa-tree" style="color:#22c55e"></i></strong><span>Top Gift</span><small>Palm Tree ($10)</small>',
    "Top Gift emoji → icon")

# Gift stream items
c = sr(c,
    '<span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Palm Tree',
    '<span class="vt-gift-emoji"><i class="fas fa-tree" style="color:#22c55e"></i></span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Palm Tree',
    "Gift Palm Tree 1")

c = sr(c,
    '<span class="vt-gift-emoji">&#11088;</span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Gold Star',
    '<span class="vt-gift-emoji"><i class="fas fa-star" style="color:#fbbf24"></i></span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Gold Star',
    "Gift Gold Star")

c = sr(c,
    '<span class="vt-gift-emoji">&#128026;</span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Conch Shell',
    '<span class="vt-gift-emoji"><i class="fas fa-fan" style="color:#a78bfa"></i></span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Conch Shell',
    "Gift Conch Shell")

c = sr(c,
    '<span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Palm Tree',
    '<span class="vt-gift-emoji"><i class="fas fa-tree" style="color:#22c55e"></i></span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Palm Tree',
    "Gift Palm Tree 2")

c = sr(c,
    '<span class="vt-gift-emoji">&#128142;</span><div class="vt-gift-info"><strong>James P.</strong> sent a Diamond',
    '<span class="vt-gift-emoji"><i class="fas fa-gem" style="color:#60a5fa"></i></span><div class="vt-gift-info"><strong>James P.</strong> sent a Diamond',
    "Gift Diamond")

# Star rating in social feed (these are decorative stars, replace with FA stars)
c = sr(c,
    '<span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>',
    '<span class="stars"><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i></span>',
    "Social stars → FA stars")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
