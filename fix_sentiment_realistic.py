#!/usr/bin/env python3
"""
Replace flat Font Awesome icons with native emoji styled with
ultra-realistic 3D glass effects, drop shadows, and animations.
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

# ========== UPGRADE CSS FOR REALISTIC 3D EMOJI ==========
print("=== SENTIMENT CSS UPGRADES ===")

c = sr(c,
    '.vt-sentiment-emojis{display:flex;flex-wrap:wrap;gap:12px;padding:16px 0;justify-content:center}',
    '.vt-sentiment-emojis{display:flex;flex-wrap:wrap;gap:16px;padding:20px 0;justify-content:center;perspective:600px}',
    "Emojis container → perspective")

c = sr(c,
    '.vt-emoji-float{font-size:24px;animation:vtEmojiPop 2s ease infinite}',
    '.vt-emoji-float{font-size:36px;width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:14px;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.1);animation:vtEmojiPop 2.5s ease infinite;cursor:default;transition:transform .2s,box-shadow .2s;position:relative}\n.vt-emoji-float:hover{transform:scale(1.2) translateY(-4px)!important;box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.15);z-index:2}',
    "Emoji float → 3D glass cards")

c = sr(c,
    '@keyframes vtEmojiPop{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.15)}}',
    '@keyframes vtEmojiPop{0%{transform:translateY(0) scale(1) rotateX(0deg)}25%{transform:translateY(-6px) scale(1.08) rotateX(3deg)}50%{transform:translateY(-10px) scale(1.12) rotateX(-2deg)}75%{transform:translateY(-4px) scale(1.05) rotateX(1deg)}100%{transform:translateY(0) scale(1) rotateX(0deg)}}',
    "Emoji animation → 3D float")

# Gift emoji → larger with glass card
c = sr(c,
    '.vt-gift-emoji{font-size:24px}',
    '.vt-gift-emoji{font-size:32px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.15);flex-shrink:0}',
    "Gift emoji → glass card")

# Gift items → slightly bigger
c = sr(c,
    '.vt-gift-item{display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,.02);border-radius:10px;border:1px solid rgba(255,255,255,.04);transition:all .2s}',
    '.vt-gift-item{display:flex;align-items:center;gap:14px;padding:12px 16px;background:rgba(255,255,255,.02);border-radius:12px;border:1px solid rgba(255,255,255,.05);transition:all .25s}',
    "Gift item → refined spacing")

# ========== REPLACE FA ICONS WITH NATIVE EMOJI ==========
print("\n=== SENTIMENT ICONS → NATIVE EMOJI ===")

# Current Mood stat
c = sr(c,
    '<strong style="font-size:28px"><i class="fas fa-smile" style="color:var(--orange)"></i></strong><span>Current Mood</span>',
    '<strong style="font-size:32px;line-height:1">&#128522;</strong><span>Current Mood</span>',
    "Mood stat → native emoji")

# Floating sentiment emojis
c = sr(c,
    '<div class="vt-sentiment-emojis"><span class="vt-emoji-float" style="animation-delay:0s"><i class="fas fa-heart" style="color:#ef4444"></i></span><span class="vt-emoji-float" style="animation-delay:.3s"><i class="fas fa-thumbs-up" style="color:var(--orange)"></i></span><span class="vt-emoji-float" style="animation-delay:.6s"><i class="fas fa-heart" style="color:#ef4444"></i></span><span class="vt-emoji-float" style="animation-delay:.9s"><i class="fas fa-fire" style="color:#f97316"></i></span><span class="vt-emoji-float" style="animation-delay:1.2s"><i class="fas fa-tree" style="color:#22c55e"></i></span><span class="vt-emoji-float" style="animation-delay:1.5s"><i class="fas fa-camera" style="color:#3b82f6"></i></span><span class="vt-emoji-float" style="animation-delay:1.8s"><i class="fas fa-hands" style="color:var(--orange)"></i></span></div>',
    '<div class="vt-sentiment-emojis"><span class="vt-emoji-float" style="animation-delay:0s">&#128525;</span><span class="vt-emoji-float" style="animation-delay:.4s">&#128079;</span><span class="vt-emoji-float" style="animation-delay:.8s">&#10084;&#65039;</span><span class="vt-emoji-float" style="animation-delay:1.2s">&#128293;</span><span class="vt-emoji-float" style="animation-delay:1.6s">&#127796;</span><span class="vt-emoji-float" style="animation-delay:2s">&#128247;</span><span class="vt-emoji-float" style="animation-delay:2.4s">&#128588;</span></div>',
    "Floating emojis → native")

# Top Gift stat
c = sr(c,
    '<strong><i class="fas fa-tree" style="color:#22c55e"></i></strong><span>Top Gift</span><small>Palm Tree ($10)</small>',
    '<strong style="font-size:28px;line-height:1">&#127796;</strong><span>Top Gift</span><small>Palm Tree ($10)</small>',
    "Top Gift → native emoji")

# Gift stream items
c = sr(c,
    '<span class="vt-gift-emoji"><i class="fas fa-tree" style="color:#22c55e"></i></span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Palm Tree',
    '<span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Palm Tree',
    "Gift Palm Tree 1 → native")

c = sr(c,
    '<span class="vt-gift-emoji"><i class="fas fa-star" style="color:#fbbf24"></i></span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Gold Star',
    '<span class="vt-gift-emoji">&#11088;</span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Gold Star',
    "Gift Star → native")

c = sr(c,
    '<span class="vt-gift-emoji"><i class="fas fa-fan" style="color:#a78bfa"></i></span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Conch Shell',
    '<span class="vt-gift-emoji">&#128026;</span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Conch Shell',
    "Gift Shell → native")

c = sr(c,
    '<span class="vt-gift-emoji"><i class="fas fa-tree" style="color:#22c55e"></i></span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Palm Tree',
    '<span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Palm Tree',
    "Gift Palm Tree 2 → native")

c = sr(c,
    '<span class="vt-gift-emoji"><i class="fas fa-gem" style="color:#60a5fa"></i></span><div class="vt-gift-info"><strong>James P.</strong> sent a Diamond',
    '<span class="vt-gift-emoji">&#128142;</span><div class="vt-gift-info"><strong>James P.</strong> sent a Diamond',
    "Gift Diamond → native")

# Social feed stars
c = sr(c,
    '<span class="stars"><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i><i class="fas fa-star" style="color:#fbbf24"></i></span>',
    '<span class="stars" style="letter-spacing:2px">&#11088;&#11088;&#11088;&#11088;&#11088;</span>',
    "Social stars → native")

# ========== LIGHT MODE OVERRIDES ==========
print("\n=== LIGHT MODE EMOJI OVERRIDES ===")

# Add light mode overrides for the emoji glass cards
light_emoji_css = """.vt-dash-light .vt-emoji-float{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.06);box-shadow:0 4px 16px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.8)}
.vt-dash-light .vt-emoji-float:hover{box-shadow:0 8px 28px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.9)}
.vt-dash-light .vt-gift-emoji{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.06);box-shadow:0 2px 10px rgba(0,0,0,.04)}
.vt-dash-light .vt-gift-item{background:rgba(0,0,0,.01);border-color:rgba(0,0,0,.04)}
.vt-dash-light .vt-gift-item:hover{background:rgba(0,0,0,.03)}
.vt-dash-light .vt-sentiment-meter{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.06)}
.vt-dash-light .vt-sentiment-bar{background:rgba(0,0,0,.06)}
.vt-dash-light .vt-sentiment-keywords{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.04)}
"""

c = sr(c,
    '/* ======== V-TOURS RESPONSIVE ======== */',
    light_emoji_css + '/* ======== V-TOURS RESPONSIVE ======== */',
    "Light mode emoji overrides")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
