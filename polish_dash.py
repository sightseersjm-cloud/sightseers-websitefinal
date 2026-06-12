#!/usr/bin/env python3
"""Polish dashboards: cap chat height, Apple glass UI, smaller popup, compact layout."""

path = 'Design_Reference.html'
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# ═══ 1. SESSION: dark → glossy Apple frosted glass ═══
src = src.replace(
    '.vt-session{background:#1a1a2e;border-radius:14px;overflow:hidden;margin-bottom:20px}',
    '.vt-session{background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(245,247,250,.95));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:18px;overflow:hidden;margin-bottom:20px;border:1px solid rgba(0,0,0,.06);box-shadow:0 8px 32px rgba(0,0,0,.08)}'
)
src = src.replace(
    '.vt-session-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(0,0,0,.3)}',
    '.vt-session-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:linear-gradient(135deg,#1a3a5c,#0d5371);border-radius:12px 12px 0 0}'
)
src = src.replace(
    '.vt-session-bar-btn.leave{background:rgba(239,68,68,.8)}',
    '.vt-session-bar-btn.leave{background:rgba(239,68,68,.85);border-radius:8px}'
)
# Session content grid bg
src = src.replace(
    '.vt-session-content{display:grid;grid-template-columns:1fr 260px;min-height:220px}',
    '.vt-session-content{display:grid;grid-template-columns:1fr 240px;min-height:200px}'
)
# Session side panel
src = src.replace(
    '.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.06)}',
    '.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.6)}'
)
# Chat area
src = src.replace(
    '.vt-session-chat{flex:1;padding:12px;overflow:hidden}',
    '.vt-session-chat{flex:1;padding:12px;overflow:hidden;max-height:180px;display:flex;flex-direction:column}'
)
src = src.replace(
    '.vt-session-chat-title{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}',
    '.vt-session-chat-title{font-size:10px;color:rgba(0,0,0,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}'
)
src = src.replace(
    '.vt-session-chat-avatar{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.6);font-weight:700;flex-shrink:0}',
    '.vt-session-chat-avatar{width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(0,0,0,.5);font-weight:700;flex-shrink:0}'
)
src = src.replace(
    '.vt-session-chat-avatar.guide{background:rgba(239,135,49,.2);color:var(--orange)}',
    '.vt-session-chat-avatar.guide{background:rgba(239,135,49,.15);color:var(--orange)}'
)
src = src.replace(
    '.vt-session-chat-text{font-size:12px;color:rgba(255,255,255,.65);line-height:1.5}',
    '.vt-session-chat-text{font-size:12px;color:rgba(0,0,0,.65);line-height:1.5}'
)
# Shop area
src = src.replace(
    '.vt-session-shop{border-top:1px solid rgba(255,255,255,.06);padding:12px}',
    '.vt-session-shop{border-top:1px solid rgba(0,0,0,.06);padding:10px 12px}'
)
src = src.replace(
    '.vt-session-shop-title{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px}',
    '.vt-session-shop-title{font-size:10px;color:rgba(0,0,0,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px}'
)
src = src.replace(
    '.vt-session-shop-item{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}',
    '.vt-session-shop-item{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.04)}'
)
src = src.replace(
    '.vt-session-shop-item-name{font-size:11px;color:rgba(255,255,255,.7);font-weight:500}',
    '.vt-session-shop-item-name{font-size:11px;color:rgba(0,0,0,.7);font-weight:500}'
)
src = src.replace(
    '.vt-session-shop-item-price{font-size:11px;color:rgba(255,255,255,.5)}',
    '.vt-session-shop-item-price{font-size:11px;color:rgba(0,0,0,.45)}'
)
src = src.replace(
    '.vt-session-shop-add{font-size:9px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.5px;cursor:default;padding:3px 8px;border:1px solid rgba(239,135,49,.3);border-radius:6px}',
    '.vt-session-shop-add{font-size:9px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.5px;cursor:pointer;padding:4px 10px;border:1px solid rgba(239,135,49,.25);border-radius:8px;background:rgba(239,135,49,.06)}'
)
# Action bar
src = src.replace(
    '.vt-session-actions{display:flex;gap:8px;padding:12px 16px;background:rgba(0,0,0,.2);justify-content:center}',
    '.vt-session-actions{display:flex;gap:8px;padding:10px 16px;background:linear-gradient(135deg,rgba(0,0,0,.04),rgba(0,0,0,.08));justify-content:center}'
)
src = src.replace(
    '.vt-session-action{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;cursor:default;transition:background .2s}',
    '.vt-session-action{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.7);border:1px solid rgba(0,0,0,.06);color:rgba(0,0,0,.6);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;transition:all .25s;backdrop-filter:blur(8px)}'
)
# Session video overlay
src = src.replace(
    '.vt-session-video-overlay{position:absolute;bottom:0;left:0;right:0;padding:12px 16px;background:linear-gradient(transparent,rgba(0,0,0,.6));display:flex;align-items:center;justify-content:space-between}',
    '.vt-session-video-overlay{position:absolute;bottom:0;left:0;right:0;padding:10px 16px;background:linear-gradient(transparent,rgba(0,0,0,.5));display:flex;align-items:center;justify-content:space-between}'
)
src = src.replace(
    ".vt-session-location{font-size:10px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1.5px;font-weight:600}",
    ".vt-session-location{font-size:10px;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:1.5px;font-weight:600}"
)
src = src.replace(
    ".vt-session-viewers{font-size:10px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:4px}",
    ".vt-session-viewers{font-size:10px;color:rgba(255,255,255,.75);display:flex;align-items:center;gap:4px}"
)

# ═══ 2. CHAT INPUT — match light theme ═══
src = src.replace(
    '.vt-chat-input-wrap{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.06);background:#fff}',
    '.vt-chat-input-wrap{display:flex;gap:8px;padding:8px 12px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.8);flex-shrink:0}'
)

# ═══ 3. DASHBOARD BODY — reduce min-height ═══
src = src.replace(
    '.vt-dash-body{display:grid;grid-template-columns:220px 1fr;min-height:560px}',
    '.vt-dash-body{display:grid;grid-template-columns:200px 1fr;min-height:420px}'
)

# ═══ 4. HOTSPOT POPUP — smaller, better positioned ═══
src = src.replace(
    '.vt-hotspot-popup{position:absolute;z-index:20;background:rgba(0,0,0,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px;width:240px;box-shadow:0 20px 48px rgba(0,0,0,.4);opacity:0;transform:translateY(10px);pointer-events:none;transition:all .35s cubic-bezier(.25,.46,.45,.94)}',
    '.vt-hotspot-popup{position:absolute;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:14px 16px;width:200px;box-shadow:0 12px 32px rgba(0,0,0,.15);opacity:0;transform:translateY(6px);pointer-events:none;transition:all .3s cubic-bezier(.25,.46,.45,.94)}'
)
src = src.replace(
    '.vt-hotspot-popup h4{color:#fff;font-size:14px;margin-bottom:4px}',
    '.vt-hotspot-popup h4{color:var(--navy);font-size:13px;font-weight:700;margin-bottom:3px}'
)
src = src.replace(
    '.vt-hotspot-popup p{color:rgba(255,255,255,.6);font-size:11px;line-height:1.5;margin-bottom:12px}',
    '.vt-hotspot-popup p{color:rgba(0,0,0,.5);font-size:10px;line-height:1.4;margin-bottom:8px}'
)
src = src.replace(
    '.vt-hotspot-popup-price{font-size:18px;font-weight:800;color:var(--orange);margin-bottom:12px}',
    '.vt-hotspot-popup-price{font-size:16px;font-weight:800;color:var(--orange);margin-bottom:10px}'
)
src = src.replace(
    '.vt-hotspot-popup-buy{width:100%;padding:10px;border-radius:10px;border:none;background:var(--orange);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .25s;font-family:inherit}',
    '.vt-hotspot-popup-buy{width:100%;padding:9px;border-radius:10px;border:none;background:var(--orange);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .25s;font-family:inherit}'
)
src = src.replace(
    '.vt-hotspot-popup-close{position:absolute;top:8px;right:10px;color:rgba(255,255,255,.4);cursor:pointer;font-size:12px;transition:color .2s}',
    '.vt-hotspot-popup-close{position:absolute;top:6px;right:8px;color:rgba(0,0,0,.3);cursor:pointer;font-size:11px;transition:color .2s}'
)
src = src.replace(
    '.vt-hotspot-popup-close:hover{color:#fff}',
    '.vt-hotspot-popup-close:hover{color:var(--navy)}'
)

# ═══ 5. CHAT MESSAGES — add scroll container, cap height ═══
# The #vt-chat-messages div needs to scroll
# Add CSS for it
chat_scroll_css = "\n#vt-chat-messages{flex:1;overflow-y:auto;min-height:0}\n#vt-chat-messages::-webkit-scrollbar{width:3px}\n#vt-chat-messages::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:3px}\n"
src = src.replace(
    '.vt-chat-input-wrap{',
    chat_scroll_css + '.vt-chat-input-wrap{'
)

# ═══ 6. LIMIT AUTO-CHAT to prevent infinite growth ═══
# In the JS, cap auto chat at ~12 messages max in the auto interval
old_auto = "vtAutoChatInterval=setInterval(function(){"
new_auto = "vtAutoChatInterval=setInterval(function(){var msgs=document.querySelectorAll('#vt-chat-messages .vt-session-chat-msg');if(msgs.length>15){msgs[0].remove()}"
src = src.replace(old_auto, new_auto, 1)

# ═══ 7. Also cap user sent chat ═══
old_send = "box.innerHTML+='<div class=\"vt-session-chat-msg\"><div class=\"vt-session-chat-avatar\" style=\"background:var(--orange)\">Y</div>"
new_send = "var allM=box.querySelectorAll('.vt-session-chat-msg');if(allM.length>15)allM[0].remove();box.innerHTML+='<div class=\"vt-session-chat-msg\"><div class=\"vt-session-chat-avatar\" style=\"background:var(--orange)\">Y</div>"
src = src.replace(old_send, new_send)

# ═══ 8. Night mode overrides for session glassmorphism ═══
night_session = """
body.theme-night .vt-session{background:linear-gradient(135deg,rgba(13,27,42,.95),rgba(20,40,60,.9));border-color:rgba(255,255,255,.06)}
body.theme-night .vt-session-side{background:rgba(13,27,42,.6);border-color:rgba(255,255,255,.06)}
body.theme-night .vt-session-chat-title{color:rgba(255,255,255,.4)}
body.theme-night .vt-session-chat-avatar{background:rgba(255,255,255,.1);color:rgba(255,255,255,.6)}
body.theme-night .vt-session-chat-text{color:rgba(255,255,255,.65)}
body.theme-night .vt-session-shop{border-color:rgba(255,255,255,.06)}
body.theme-night .vt-session-shop-title{color:rgba(255,255,255,.4)}
body.theme-night .vt-session-shop-item{border-color:rgba(255,255,255,.04)}
body.theme-night .vt-session-shop-item-name{color:rgba(255,255,255,.7)}
body.theme-night .vt-session-shop-item-price{color:rgba(255,255,255,.5)}
body.theme-night .vt-session-action{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
body.theme-night .vt-chat-input-wrap{background:rgba(13,27,42,.8);border-color:rgba(255,255,255,.06)}
body.theme-night .vt-hotspot-popup{background:rgba(13,27,42,.92);border-color:rgba(255,255,255,.1)}
body.theme-night .vt-hotspot-popup h4{color:#fff}
body.theme-night .vt-hotspot-popup p{color:rgba(255,255,255,.5)}
body.theme-night .vt-hotspot-popup-close{color:rgba(255,255,255,.4)}
"""
# Insert after the existing night mode dash rules
marker = "body.theme-night .vt-dash-avatar-info{color:#fff}"
src = src.replace(marker, marker + night_session)

# ═══ 9. Fix hotspot popup positioning in JS ═══
old_popup_pos = """  popup.style.top=(parseInt(e.target.closest('.vt-hotspot').style.top)||40)+'%';
  popup.style.left=Math.min(60,Math.max(5,(parseInt(e.target.closest('.vt-hotspot').style.left)||50)-5))+'%';"""
new_popup_pos = """  var hs=e.target.closest('.vt-hotspot');
  var hsTop=parseInt(hs.style.top)||40;var hsLeft=parseInt(hs.style.left)||50;
  popup.style.top=Math.min(hsTop,45)+'%';
  popup.style.left=Math.min(55,Math.max(5,hsLeft-12))+'%';"""
src = src.replace(old_popup_pos, new_popup_pos)

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done: Apple glass UI, capped chat, smaller popup, compact layout')
