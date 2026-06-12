#!/usr/bin/env python3
"""
V-Tours fixes:
1. Revert session from white glass to dark navy blue
2. Fix buy button hiding (position:fixed popup, overflow fix)
3. Embed YouTube 360° video in Blue Lagoon scene
4. Add comprehensive responsive styles
5. Add cart + checkout for in-session shop
"""

import re

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    content = f.read()

count = 0

def sr(content, old, new, desc=""):
    global count
    if old not in content:
        print(f"  WARN: not found – {desc or old[:80]}")
        return content
    content = content.replace(old, new, 1)
    count += 1
    print(f"  OK: {desc}")
    return content

print("=== 1. DARK NAVY BLUE SESSION ===")

# Session container
content = sr(content,
    '.vt-session{background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(245,247,250,.95));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:18px;overflow:hidden;margin-bottom:20px;border:1px solid rgba(0,0,0,.06);box-shadow:0 8px 32px rgba(0,0,0,.08)}',
    '.vt-session{background:linear-gradient(135deg,rgba(13,27,42,.95),rgba(20,45,68,.92));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:18px;overflow:hidden;margin-bottom:20px;border:1px solid rgba(255,255,255,.06);box-shadow:0 8px 32px rgba(0,0,0,.3)}',
    "Session bg → dark navy")

# Session actions bar
content = sr(content,
    '.vt-session-actions{display:flex;gap:8px;padding:10px 16px;background:linear-gradient(135deg,rgba(0,0,0,.04),rgba(0,0,0,.08));justify-content:center}',
    '.vt-session-actions{display:flex;gap:8px;padding:10px 16px;background:linear-gradient(135deg,rgba(0,0,0,.2),rgba(0,0,0,.3));justify-content:center}',
    "Actions bar dark")

# Session action buttons
content = sr(content,
    '.vt-session-action{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.7);border:1px solid rgba(0,0,0,.06);color:rgba(0,0,0,.6);',
    '.vt-session-action{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);',
    "Action btns dark")

# Side panel
content = sr(content,
    '.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.6)}',
    '.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.06);background:rgba(13,27,42,.6)}',
    "Side panel dark")

# Chat title
content = sr(content,
    '.vt-session-chat-title{font-size:10px;color:rgba(0,0,0,.4);',
    '.vt-session-chat-title{font-size:10px;color:rgba(255,255,255,.4);',
    "Chat title dark")

# Chat avatar
content = sr(content,
    '.vt-session-chat-avatar{width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(0,0,0,.5);',
    '.vt-session-chat-avatar{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.6);',
    "Chat avatar dark")

# Chat text
content = sr(content,
    '.vt-session-chat-text{font-size:12px;color:rgba(0,0,0,.65);',
    '.vt-session-chat-text{font-size:12px;color:rgba(255,255,255,.65);',
    "Chat text dark")

# Shop border
content = sr(content,
    '.vt-session-shop{border-top:1px solid rgba(0,0,0,.06);',
    '.vt-session-shop{border-top:1px solid rgba(255,255,255,.06);',
    "Shop border dark")

# Shop title
content = sr(content,
    '.vt-session-shop-title{font-size:10px;color:rgba(0,0,0,.4);',
    '.vt-session-shop-title{font-size:10px;color:rgba(255,255,255,.4);',
    "Shop title dark")

# Shop item border
content = sr(content,
    '.vt-session-shop-item{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.04)}',
    '.vt-session-shop-item{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)}',
    "Shop item border dark")

# Shop item name
content = sr(content,
    '.vt-session-shop-item-name{font-size:11px;color:rgba(0,0,0,.7);',
    '.vt-session-shop-item-name{font-size:11px;color:rgba(255,255,255,.7);',
    "Shop item name dark")

# Shop item price
content = sr(content,
    '.vt-session-shop-item-price{font-size:11px;color:rgba(0,0,0,.45)}',
    '.vt-session-shop-item-price{font-size:11px;color:rgba(255,255,255,.5)}',
    "Shop item price dark")

# Chat input wrap
content = sr(content,
    '.vt-chat-input-wrap{display:flex;gap:8px;padding:8px 12px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.8);flex-shrink:0}',
    '.vt-chat-input-wrap{display:flex;gap:8px;padding:8px 12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(13,27,42,.8);flex-shrink:0}',
    "Chat input wrap dark")

# Chat input field
content = sr(content,
    '.vt-chat-input{flex:1;border:1px solid rgba(0,0,0,.1);border-radius:20px;padding:8px 16px;font-size:12px;outline:none;font-family:inherit;transition:border-color .2s}',
    '.vt-chat-input{flex:1;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:8px 16px;font-size:12px;outline:none;font-family:inherit;transition:border-color .2s;background:rgba(255,255,255,.05);color:#fff}',
    "Chat input field dark")

# Guide table headers
content = sr(content,
    '.vt-guide-table th{text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#99a3b0;font-weight:700;border-bottom:1px solid rgba(0,0,0,.06)}',
    '.vt-guide-table th{text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.35);font-weight:700;border-bottom:1px solid rgba(255,255,255,.06)}',
    "Guide table th dark")

# Guide table cells
content = sr(content,
    '.vt-guide-table td{padding:12px;border-bottom:1px solid rgba(0,0,0,.03);color:#617087}',
    '.vt-guide-table td{padding:12px;border-bottom:1px solid rgba(255,255,255,.03);color:rgba(255,255,255,.45)}',
    "Guide table td dark")

# Earnings chart
content = sr(content,
    '.vt-earnings-chart{background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.04);',
    '.vt-earnings-chart{background:rgba(255,255,255,.03);border-radius:14px;border:1px solid rgba(255,255,255,.06);',
    "Earnings chart dark")

print("\n=== 2. FIX BUY BUTTON (popup → fixed position) ===")

# Hotspot popup: position:fixed, dark bg, wider, higher z-index
content = sr(content,
    '.vt-hotspot-popup{position:absolute;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:14px 16px;width:200px;box-shadow:0 12px 32px rgba(0,0,0,.15);opacity:0;transform:translateY(6px);pointer-events:none;transition:all .3s cubic-bezier(.25,.46,.45,.94)}',
    '.vt-hotspot-popup{position:fixed;z-index:9999;background:rgba(13,27,42,.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 18px;width:230px;box-shadow:0 16px 48px rgba(0,0,0,.5);opacity:0;transform:translateY(6px);pointer-events:none;transition:all .3s cubic-bezier(.25,.46,.45,.94)}',
    "Popup → fixed, dark, wider")

# Popup text colors for dark bg
content = sr(content,
    '.vt-hotspot-popup h4{color:var(--navy);',
    '.vt-hotspot-popup h4{color:#fff;',
    "Popup h4 white")

content = sr(content,
    '.vt-hotspot-popup p{color:rgba(0,0,0,.5);',
    '.vt-hotspot-popup p{color:rgba(255,255,255,.55);',
    "Popup p light")

content = sr(content,
    '.vt-hotspot-popup-close{position:absolute;top:6px;right:8px;color:rgba(0,0,0,.3);',
    '.vt-hotspot-popup-close{position:absolute;top:6px;right:8px;color:rgba(255,255,255,.4);',
    "Popup close btn light")

# Make buy button more prominent
content = sr(content,
    '.vt-hotspot-popup-buy{width:100%;padding:9px;border-radius:10px;',
    '.vt-hotspot-popup-buy{width:100%;padding:10px;border-radius:10px;',
    "Buy btn bigger padding")

# JS: Switch to getBoundingClientRect for fixed positioning
content = sr(content,
    "var hs=e.target.closest('.vt-hotspot');\n  var hsTop=parseInt(hs.style.top)||40;var hsLeft=parseInt(hs.style.left)||50;\n  popup.style.top=Math.min(hsTop,45)+'%';\n  popup.style.left=Math.min(55,Math.max(5,hsLeft-12))+'%';",
    "var hs=e.target.closest('.vt-hotspot');\n  var rect=hs.getBoundingClientRect();\n  popup.style.top=Math.max(10,Math.min(rect.top-10,window.innerHeight-260))+'px';\n  popup.style.left=Math.max(10,Math.min(rect.right+10,window.innerWidth-250))+'px';",
    "Popup JS → fixed pixel positioning")

print("\n=== 3. YOUTUBE 360° EMBED ===")

# Replace kayak scene HTML with YouTube iframe
content = sr(content,
    '''<!-- KAYAK SCENE -->
                        <div class="vt-360-scene" id="vt-scene-kayak">
                          <div class="vt-360-pano">
                            <div class="vt-360-sky"></div>
                            <div class="vt-360-clouds"></div>
                            <div class="vt-360-mountains"></div>
                            <div class="vt-360-trees"></div>
                            <div class="vt-360-water"></div>
                            <div class="vt-360-water-shimmer"></div>
                          </div>
                          <div class="vt-360-kayak">
                            <div class="vt-360-kayak-paddle"></div>
                            <div class="vt-360-kayak-body"></div>
                          </div>
                          <div class="vt-360-ripple"></div>
                          <div class="vt-360-ripple"></div>
                          <div class="vt-360-ripple"></div>

                          <!-- Purchasable Hotspots -->
                          <div class="vt-hotspot" style="top:25%;left:20%" onclick="vtShowHotspot(event,'hs1')">
                            <div class="vt-hotspot-dot"><i class="fas fa-leaf"></i></div>
                            <div class="vt-hotspot-label">Blue Mahoe Seedling<small>USD $35.00</small></div>
                          </div>
                          <div class="vt-hotspot" style="top:55%;left:75%" onclick="vtShowHotspot(event,'hs2')">
                            <div class="vt-hotspot-dot"><i class="fas fa-tshirt"></i></div>
                            <div class="vt-hotspot-label">Portland Parish Tee<small>USD $28.00</small></div>
                          </div>
                          <div class="vt-hotspot" style="top:35%;left:55%" onclick="vtShowHotspot(event,'hs3')">
                            <div class="vt-hotspot-dot"><i class="fas fa-camera"></i></div>
                            <div class="vt-hotspot-label">Photo Print - This Moment<small>USD $15.00</small></div>
                          </div>
                        </div>''',
    '''<!-- BLUE LAGOON - YouTube 360° Live Tour -->
                        <div class="vt-360-scene vt-yt-scene" id="vt-scene-kayak">
                          <iframe id="vt-yt-player" class="vt-yt-iframe" src="https://www.youtube.com/embed/jqq_ZdD5Zwg?autoplay=1&mute=1&loop=1&playlist=jqq_ZdD5Zwg&controls=0&showinfo=0&modestbranding=1&rel=0&enablejsapi=1" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope" allowfullscreen></iframe>
                          <div class="vt-yt-hotspot-layer">
                            <div class="vt-hotspot" style="top:22%;left:15%" onclick="vtShowHotspot(event,'hs1')">
                              <div class="vt-hotspot-dot"><i class="fas fa-leaf"></i></div>
                              <div class="vt-hotspot-label">Blue Mahoe Seedling<small>USD $35.00</small></div>
                            </div>
                            <div class="vt-hotspot" style="top:60%;left:78%" onclick="vtShowHotspot(event,'hs2')">
                              <div class="vt-hotspot-dot"><i class="fas fa-tshirt"></i></div>
                              <div class="vt-hotspot-label">Portland Parish Tee<small>USD $28.00</small></div>
                            </div>
                            <div class="vt-hotspot" style="top:35%;left:50%" onclick="vtShowHotspot(event,'hs3')">
                              <div class="vt-hotspot-dot"><i class="fas fa-camera"></i></div>
                              <div class="vt-hotspot-label">Photo Print - This Moment<small>USD $15.00</small></div>
                            </div>
                          </div>
                        </div>''',
    "Kayak scene → YouTube 360° iframe")

print("\n=== 4. REMOVE OLD RESPONSIVE, ADD NEW CSS ===")

# Remove old minimal media queries
content = sr(content,
    "@media(max-width:900px){.vt-dash-body{grid-template-columns:1fr}.vt-dash-sidebar{display:none}}\n",
    "\n",
    "Remove old 900px query")

content = sr(content,
    "@media(max-width:768px){.vt-session-content{grid-template-columns:1fr}.vt-session-side{display:none}}\n",
    "\n",
    "Remove old 768px query")

print("\n=== 5. INSERT YOUTUBE + CART + RESPONSIVE CSS ===")

new_css = """
/* ======== YOUTUBE 360 EMBED ======== */
.vt-yt-scene{display:flex;align-items:stretch;justify-content:center;background:#000}
.vt-yt-iframe{position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1}
.vt-yt-hotspot-layer{position:absolute;inset:0;z-index:10;pointer-events:none}
.vt-yt-hotspot-layer .vt-hotspot{pointer-events:auto}

/* ======== SESSION CART DRAWER ======== */
.vt-cart-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.vt-cart-badge.show{opacity:1;transform:scale(1)}
.vt-cart-drawer{position:fixed;top:0;right:0;bottom:0;width:340px;max-width:90vw;background:linear-gradient(180deg,#0d1b2a,#132d46);z-index:10002;transform:translateX(100%);transition:transform .35s cubic-bezier(.25,.46,.45,.94);box-shadow:-12px 0 48px rgba(0,0,0,.4);display:flex;flex-direction:column}
.vt-cart-drawer.open{transform:translateX(0)}
.vt-cart-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(255,255,255,.08)}
.vt-cart-drawer-head h3{color:#fff;font-size:16px;font-weight:700;margin:0}
.vt-cart-drawer-head h3 i{color:var(--orange);margin-right:8px}
.vt-cart-close{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.08);color:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;font-size:14px;transition:all .2s}
.vt-cart-close:hover{background:rgba(255,255,255,.15);color:#fff}
.vt-cart-items{flex:1;overflow-y:auto;padding:16px}
.vt-cart-item{display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,.04);border-radius:12px;margin-bottom:8px;border:1px solid rgba(255,255,255,.06)}
.vt-cart-item-info{flex:1}
.vt-cart-item-name{color:#fff;font-size:12px;font-weight:600}
.vt-cart-item-price{color:var(--orange);font-size:12px;font-weight:700;margin-top:2px}
.vt-cart-item-remove{color:rgba(255,255,255,.3);cursor:pointer;font-size:12px;padding:6px;transition:color .2s}
.vt-cart-item-remove:hover{color:#ef4444}
.vt-cart-empty{color:rgba(255,255,255,.3);text-align:center;padding:40px 20px;font-size:13px}
.vt-cart-empty i{font-size:28px;display:block;margin-bottom:12px;color:rgba(255,255,255,.15)}
.vt-cart-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.15)}
.vt-cart-total{display:flex;justify-content:space-between;margin-bottom:14px;color:rgba(255,255,255,.5);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.vt-cart-total span:last-child{color:#fff;font-size:16px;font-weight:800}
.vt-cart-checkout{width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--orange),#ff8d47);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .25s;text-transform:uppercase;letter-spacing:.5px}
.vt-cart-checkout:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,135,49,.4)}
.vt-cart-checkout:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.vt-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:10001;opacity:0;pointer-events:none;transition:opacity .3s}
.vt-cart-overlay.open{opacity:1;pointer-events:auto}

/* ======== V-TOURS RESPONSIVE ======== */
@media(max-width:1024px){
.vt-tabs{gap:0;flex-wrap:wrap}
.vt-tab{flex:1;min-width:140px;font-size:12px;padding:12px 16px}
.vt-dash-stats{grid-template-columns:repeat(2,1fr)}
.vt-live-grid{grid-template-columns:repeat(2,1fr)}
.vt-signup-grid{grid-template-columns:1fr}
}
@media(max-width:900px){
.vt-dash-body{grid-template-columns:1fr}
.vt-dash-sidebar{display:none}
.vt-device-tiers{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:768px){
.vt-session-content{grid-template-columns:1fr}
.vt-session-side{border-left:none;border-top:1px solid rgba(255,255,255,.06)}
.vt-session-actions{flex-wrap:wrap}
.vt-session-video{min-height:220px!important}
.vt-dash-frame.vt-fullscreen{inset:0!important;border-radius:0!important}
.vt-dash-frame.vt-fullscreen .vt-live-grid{grid-template-columns:1fr}
.vt-dash-frame.vt-fullscreen .vt-session-video{min-height:280px!important}
.vt-dash-stats{grid-template-columns:1fr}
.vt-live-grid{grid-template-columns:1fr}
.vt-device-tiers{grid-template-columns:1fr}
.vt-tabs{flex-direction:column}
.vt-tab{text-align:center}
.vt-scene-switcher{flex-wrap:wrap;gap:4px}
.vt-scene-btn{font-size:9px;padding:5px 10px}
.vt-hotspot-dot{width:28px;height:28px;font-size:11px}
.vt-expand-btn{width:28px;height:28px;font-size:11px}
.vt-fs-close{top:12px;right:12px;width:34px;height:34px}
#p-vtours .section-inner{padding:0 12px}
.vt-signup-card{padding:24px 16px}
.vt-pricing-table th,.vt-pricing-table td{padding:10px 8px;font-size:11px}
.vt-cart-drawer{width:100%;max-width:100vw}
}
@media(max-width:480px){
.vt-session-bar{flex-direction:column;gap:6px;text-align:center;padding:8px 12px}
.vt-session-bar-left{font-size:11px;flex-wrap:wrap;justify-content:center}
.vt-session-actions{gap:4px;padding:8px 10px}
.vt-session-action{padding:6px 10px;font-size:8px}
.vt-session-action i{font-size:14px}
.vt-session-video{min-height:180px!important}
.vt-dash-topbar{flex-direction:column;gap:6px;padding:10px 12px}
.vt-dash-header h2{font-size:14px}
.vt-dash-stat{padding:12px}
.vt-dash-stat strong{font-size:18px}
.vt-live-card{padding:14px}
.vt-hotspot-popup{width:180px!important;padding:12px 14px!important}
.vt-hotspot-popup-price{font-size:14px!important}
.vt-hotspot-popup-buy{padding:8px!important;font-size:11px!important}
.vt-scene-switcher{top:8px;left:8px}
.vt-live-indicator{top:8px;right:8px;padding:4px 10px;font-size:9px}
.vt-tab{font-size:11px;padding:10px 12px}
.vt-signup-card h3{font-size:18px}
}

"""

content = sr(content,
    "body.theme-night .vt-hotspot-popup-close{color:rgba(255,255,255,.4)}\n\n\n  </style>",
    "body.theme-night .vt-hotspot-popup-close{color:rgba(255,255,255,.4)}\n" + new_css + "\n  </style>",
    "Insert YouTube + cart + responsive CSS")

print("\n=== 6. ADD CART HTML + UPDATE SHOP BUTTONS ===")

# Add cart icon to the session actions bar with badge
content = sr(content,
    '<div class="vt-session-action" onclick="vtSessionAction(this,\'shop\')"><i class="fas fa-shopping-bag"></i>Shop Now</div>',
    '<div class="vt-session-action" onclick="vtSessionAction(this,\'shop\')" style="position:relative"><i class="fas fa-shopping-bag"></i>Shop Now<span class="vt-cart-badge" id="vt-cart-badge">0</span></div><div class="vt-session-action" onclick="vtOpenCart()"><i class="fas fa-shopping-cart"></i>Cart</div>',
    "Add cart button to actions")

# Replace the In-Session Shop section to include "Add to Cart" instead of "Add"
content = sr(content,
    """<div class="vt-session-shop">
                        <div class="vt-session-shop-title">In-Session Shop</div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Handwoven Market Basket</div><div class="vt-session-shop-item-price">USD $28.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Handwoven Market Basket')">Add</div></div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Blue Mahoe Botanical Print</div><div class="vt-session-shop-item-price">USD $45.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Blue Mahoe Botanical Print')">Add</div></div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Jamaican Spice Collection</div><div class="vt-session-shop-item-price">USD $22.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Jamaican Spice Collection')">Add</div></div>
                      </div>""",
    """<div class="vt-session-shop">
                        <div class="vt-session-shop-title">In-Session Shop</div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Handwoven Market Basket</div><div class="vt-session-shop-item-price">USD $28.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Handwoven Market Basket',28)">Add</div></div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Blue Mahoe Botanical Print</div><div class="vt-session-shop-item-price">USD $45.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Blue Mahoe Botanical Print',45)">Add</div></div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Jamaican Spice Collection</div><div class="vt-session-shop-item-price">USD $22.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Jamaican Spice Collection',22)">Add</div></div>
                      </div>""",
    "Update shop items with prices")

# Add cart drawer HTML before the closing </div> of the session
content = sr(content,
    """                    </div>
                  </div>
                </div>
              </div>

              <!-- VIEW: Browse Tours -->""",
    """                    </div>
                  </div>
                </div>
              </div>

              <!-- CART DRAWER -->
              <div class="vt-cart-overlay" id="vt-cart-overlay" onclick="vtCloseCart()"></div>
              <div class="vt-cart-drawer" id="vt-cart-drawer">
                <div class="vt-cart-drawer-head">
                  <h3><i class="fas fa-shopping-cart"></i>Your Cart</h3>
                  <button class="vt-cart-close" onclick="vtCloseCart()"><i class="fas fa-times"></i></button>
                </div>
                <div class="vt-cart-items" id="vt-cart-items">
                  <div class="vt-cart-empty" id="vt-cart-empty"><i class="fas fa-shopping-basket"></i>Your cart is empty.<br>Add items from the shop or click hotspots in the tour!</div>
                </div>
                <div class="vt-cart-footer">
                  <div class="vt-cart-total"><span>Total</span><span id="vt-cart-total">USD $0.00</span></div>
                  <button class="vt-cart-checkout" id="vt-cart-checkout-btn" onclick="vtCheckout()" disabled>Checkout</button>
                </div>
              </div>

              <!-- VIEW: Browse Tours -->""",
    "Add cart drawer HTML")

print("\n=== 7. UPDATE JS: CART SYSTEM ===")

# Replace the old vtAddToCart function and vtBuyHotspot with cart-aware versions
content = sr(content,
    """function vtAddToCart(el,name){
  el.textContent='Added';el.classList.add('added');
  var c=document.getElementById('vt-exp-items');if(c){c.textContent=parseInt(c.textContent)+1}
  vtToast('<i class="fas fa-check-circle"></i> '+name+' added to cart');
  setTimeout(function(){el.textContent='Add';el.classList.remove('added')},2500);
}""",
    """var vtCart=[];
function vtAddToCart(el,name,price){
  price=price||0;
  vtCart.push({name:name,price:price,id:'cart-'+Date.now()+Math.random()});
  el.textContent='Added!';el.classList.add('added');
  var c=document.getElementById('vt-exp-items');if(c){c.textContent=parseInt(c.textContent)+1}
  vtUpdateCartBadge();
  vtToast('<i class="fas fa-check-circle"></i> '+name+' added to cart');
  setTimeout(function(){el.textContent='Add';el.classList.remove('added')},2000);
}
function vtUpdateCartBadge(){
  var badge=document.getElementById('vt-cart-badge');
  if(badge){badge.textContent=vtCart.length;if(vtCart.length>0)badge.classList.add('show');else badge.classList.remove('show')}
}
function vtOpenCart(){
  vtRenderCart();
  document.getElementById('vt-cart-drawer').classList.add('open');
  document.getElementById('vt-cart-overlay').classList.add('open');
}
function vtCloseCart(){
  document.getElementById('vt-cart-drawer').classList.remove('open');
  document.getElementById('vt-cart-overlay').classList.remove('open');
}
function vtRenderCart(){
  var container=document.getElementById('vt-cart-items');
  var empty=document.getElementById('vt-cart-empty');
  var total=0;
  if(vtCart.length===0){
    container.innerHTML='<div class="vt-cart-empty" id="vt-cart-empty"><i class="fas fa-shopping-basket"></i>Your cart is empty.<br>Add items from the shop or click hotspots in the tour!</div>';
    document.getElementById('vt-cart-total').textContent='USD $0.00';
    document.getElementById('vt-cart-checkout-btn').disabled=true;
    return;
  }
  var html='';
  vtCart.forEach(function(item,i){
    total+=item.price;
    html+='<div class="vt-cart-item"><div class="vt-cart-item-info"><div class="vt-cart-item-name">'+item.name+'</div><div class="vt-cart-item-price">USD $'+item.price.toFixed(2)+'</div></div><div class="vt-cart-item-remove" onclick="vtRemoveFromCart('+i+')"><i class="fas fa-trash-alt"></i></div></div>';
  });
  container.innerHTML=html;
  document.getElementById('vt-cart-total').textContent='USD $'+total.toFixed(2);
  document.getElementById('vt-cart-checkout-btn').disabled=false;
}
function vtRemoveFromCart(idx){
  var item=vtCart[idx];
  vtCart.splice(idx,1);
  vtUpdateCartBadge();
  vtRenderCart();
  vtToast('<i class="fas fa-trash-alt"></i> '+item.name+' removed from cart');
}
function vtCheckout(){
  if(vtCart.length===0)return;
  var total=0;vtCart.forEach(function(i){total+=i.price});
  var btn=document.getElementById('vt-cart-checkout-btn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled=true;
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle"></i> Order Confirmed!';
    btn.style.background='#22c55e';
    vtToast('<i class="fas fa-check-circle"></i> Order placed! USD $'+total.toFixed(2)+' total. Confirmation email sent.');
    setTimeout(function(){
      vtCart=[];vtUpdateCartBadge();vtRenderCart();
      btn.innerHTML='Checkout';btn.style.background='';btn.disabled=true;
      vtCloseCart();
    },3000);
  },2000);
}""",
    "Full cart system JS")

# Update vtBuyHotspot to also add to cart
content = sr(content,
    """function vtBuyHotspot(){
  if(!vtCurrentHotspot)return;
  var d=vtHotspotData[vtCurrentHotspot];
  var btn=document.querySelector('.vt-hotspot-popup-buy');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...';
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle"></i> Purchased!';btn.classList.add('bought');
    var c=document.getElementById('vt-exp-items');if(c)c.textContent=parseInt(c.textContent)+1;
    vtToast('<i class="fas fa-check-circle"></i> '+d.name+' purchased! Ships to your address.');
    var box=document.getElementById('vt-chat-messages');
    if(box){box.innerHTML+='<div class="vt-session-chat-msg"><div class="vt-session-chat-avatar guide">M</div><div class="vt-session-chat-text">Someone just bought the '+d.name+'! Great choice.</div></div>';box.scrollTop=box.scrollHeight}
    setTimeout(function(){vtCloseHotspot()},1500);
  },1200);
}""",
    """function vtBuyHotspot(){
  if(!vtCurrentHotspot)return;
  var d=vtHotspotData[vtCurrentHotspot];
  var btn=document.querySelector('.vt-hotspot-popup-buy');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding to cart...';
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle"></i> Added to Cart!';btn.classList.add('bought');
    vtCart.push({name:d.name,price:d.priceNum,id:'hs-'+vtCurrentHotspot+'-'+Date.now()});
    vtUpdateCartBadge();
    var c=document.getElementById('vt-exp-items');if(c)c.textContent=parseInt(c.textContent)+1;
    vtToast('<i class="fas fa-cart-plus"></i> '+d.name+' added to cart! USD $'+d.priceNum.toFixed(2));
    var box=document.getElementById('vt-chat-messages');
    if(box){var msgs=box.querySelectorAll('.vt-session-chat-msg');if(msgs.length>=15)msgs[0].remove();box.innerHTML+='<div class="vt-session-chat-msg"><div class="vt-session-chat-avatar guide">M</div><div class="vt-session-chat-text">'+d.name+' added to cart! Great choice.</div></div>';box.scrollTop=box.scrollHeight}
    setTimeout(function(){vtCloseHotspot()},1500);
  },1000);
}""",
    "vtBuyHotspot → add to cart")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nDone! {count} changes applied.")
