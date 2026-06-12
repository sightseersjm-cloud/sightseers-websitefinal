#!/usr/bin/env python3
"""
Clean up V-Tours session:
1. Crop YouTube iframe to hide controls/branding
2. Remove overlays blocking 360° interaction
3. Add session-level fullscreen expand
4. Reduce visual clutter - cleaner minimal layout
"""

import re

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    content = f.read()

n = 0

def sr(content, old, new, desc=""):
    global n
    if old not in content:
        print(f"  WARN not found: {desc}")
        return content
    content = content.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return content

# ================================================================
# 1. CROP YOUTUBE IFRAME - hide controls, title bar, branding
# ================================================================
print("=== 1. CROP YOUTUBE + CLEAN PARAMS ===")

# Update iframe CSS to extend beyond container (gets clipped by overflow:hidden on scene)
content = sr(content,
    '.vt-yt-iframe{position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1}',
    '.vt-yt-iframe{position:absolute;top:-60px;left:-2px;width:calc(100% + 4px);height:calc(100% + 120px);border:none;z-index:1}',
    "Iframe crop top/bottom to hide YouTube UI")

# Update iframe URL - add params to suppress UI, enable 360° interaction
content = sr(content,
    'src="https://www.youtube.com/embed/jqq_ZdD5Zwg?autoplay=1&mute=1&loop=1&playlist=jqq_ZdD5Zwg&controls=0&showinfo=0&modestbranding=1&rel=0&enablejsapi=1"',
    'src="https://www.youtube.com/embed/jqq_ZdD5Zwg?autoplay=1&mute=1&loop=1&playlist=jqq_ZdD5Zwg&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1"',
    "Better YouTube params to suppress UI")

# ================================================================
# 2. CLEAR OVERLAYS BLOCKING 360° INTERACTION
# ================================================================
print("\n=== 2. FIX 360° INTERACTION ===")

# Video overlay (location + viewers at bottom) - make it not block interaction
content = sr(content,
    '.vt-session-video-overlay{position:absolute;bottom:0;left:0;right:0;padding:10px 16px;background:linear-gradient(transparent,rgba(0,0,0,.5));display:flex;align-items:center;justify-content:space-between}',
    '.vt-session-video-overlay{position:absolute;bottom:0;left:0;right:0;padding:10px 16px;background:linear-gradient(transparent,rgba(0,0,0,.5));display:flex;align-items:center;justify-content:space-between;pointer-events:none;z-index:12}',
    "Video overlay pointer-events:none")

# Live indicator - should not block
content = sr(content,
    '.vt-live-indicator{position:absolute;top:12px;right:12px;z-index:15;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px}',
    '.vt-live-indicator{position:absolute;top:12px;right:12px;z-index:15;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;pointer-events:none}',
    "Live indicator pointer-events:none")

# Remove cursor:grab from video since YouTube handles 360° drag
content = sr(content,
    '.vt-session-video{min-height:260px!important;overflow:hidden;position:relative;cursor:grab}',
    '.vt-session-video{min-height:260px!important;overflow:hidden;position:relative}',
    "Remove cursor:grab from video")

content = sr(content,
    '.vt-session-video:active{cursor:grabbing}',
    '',
    "Remove cursor:grabbing")

# ================================================================
# 3. REDUCE VISUAL CLUTTER
# ================================================================
print("\n=== 3. MINIMIZE CLUTTER ===")

# Make scene switcher more compact and less overlapping
content = sr(content,
    '.vt-scene-switcher{position:absolute;top:12px;left:12px;z-index:15;display:flex;gap:6px}',
    '.vt-scene-switcher{position:absolute;top:10px;left:10px;z-index:15;display:flex;gap:4px}',
    "Compact scene switcher")

content = sr(content,
    '.vt-scene-btn{padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;color:rgba(255,255,255,.7);background:rgba(0,0,0,.4);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .25s;text-transform:uppercase;letter-spacing:.5px}',
    '.vt-scene-btn{padding:5px 10px;border-radius:14px;font-size:9px;font-weight:700;color:rgba(255,255,255,.7);background:rgba(0,0,0,.5);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08);cursor:pointer;transition:all .25s;text-transform:uppercase;letter-spacing:.3px}',
    "Smaller scene buttons")

# Make hotspot dots smaller and less dominant
content = sr(content,
    '.vt-hotspot-dot{width:36px;height:36px;border-radius:50%;background:rgba(239,135,49,.85);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;',
    '.vt-hotspot-dot{width:30px;height:30px;border-radius:50%;background:rgba(239,135,49,.8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;',
    "Smaller hotspot dots")

# Remove the drag hint since YouTube handles 360° natively
content = sr(content,
    '<!-- Drag Hint -->\n                        <div class="vt-drag-hint show" id="vt-drag-hint"><i class="fas fa-arrows-alt-h"></i> Drag to look around in 360&deg;</div>',
    '',
    "Remove drag hint (YouTube handles 360°)")

# Remove the bottom video overlay text (location + viewers) - redundant with session bar
content = sr(content,
    """                        <!-- Overlay -->
                        <div class="vt-session-video-overlay">
                          <div class="vt-session-location" id="vt-session-loc">Port Antonio &bull; Portland &bull; Jamaica</div>
                          <div class="vt-session-viewers"><i class="fas fa-eye"></i> <span id="vt-viewer-count">247</span> watching</div>
                        </div>""",
    """                        <!-- Minimal Overlay -->
                        <div class="vt-session-video-overlay">
                          <div class="vt-session-location" id="vt-session-loc">Port Antonio &bull; Portland &bull; Jamaica</div>
                          <div class="vt-session-viewers"><i class="fas fa-eye"></i> <span id="vt-viewer-count">247</span> watching</div>
                        </div>
                        <!-- Session Expand Button -->
                        <div class="vt-session-expand" onclick="vtExpandSession()"><i class="fas fa-expand"></i></div>""",
    "Add session expand button on video")

# ================================================================
# 4. SESSION FULLSCREEN EXPAND
# ================================================================
print("\n=== 4. SESSION FULLSCREEN EXPAND ===")

# Add CSS for session expand button and fullscreen mode
expand_css = """
/* ======== SESSION EXPAND ======== */
.vt-session-expand{position:absolute;bottom:10px;right:10px;z-index:15;width:32px;height:32px;border-radius:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.7);font-size:13px;transition:all .25s;border:1px solid rgba(255,255,255,.1)}
.vt-session-expand:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.1)}
.vt-session.vt-session-fs{position:fixed!important;inset:16px!important;z-index:10001!important;border-radius:16px!important;box-shadow:0 40px 120px rgba(0,0,0,.6)!important;display:flex!important;flex-direction:column!important;animation:vtFullIn .4s cubic-bezier(.16,1,.3,1) forwards}
.vt-session.vt-session-fs .vt-session-bar{flex-shrink:0}
.vt-session.vt-session-fs .vt-session-content{flex:1!important;min-height:0!important}
.vt-session.vt-session-fs .vt-session-video{min-height:0!important;flex:1!important}
.vt-session.vt-session-fs .vt-session-side{max-height:none}
.vt-session.vt-session-fs .vt-session-actions{flex-shrink:0}
.vt-session.vt-session-fs .vt-session-expand i::before{content:"\\f066"}
@media(max-width:768px){.vt-session.vt-session-fs{inset:0!important;border-radius:0!important}}

"""

content = sr(content,
    '/* ======== SESSION CART DRAWER ======== */',
    expand_css + '/* ======== SESSION CART DRAWER ======== */',
    "Insert session expand CSS")

# Add JS for session expand/collapse
session_expand_js = """
/* ═══════ SESSION FULLSCREEN ═══════ */
var vtSessionExpanded=false;
function vtExpandSession(){
  var session=document.getElementById('vt-active-session');if(!session)return;
  if(vtSessionExpanded){vtCollapseSession();return}
  vtSessionExpanded=true;
  var ov=document.getElementById('vt-fs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-fs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseSession;document.body.appendChild(ov)}
  var cl=document.getElementById('vt-fs-close');
  if(!cl){cl=document.createElement('div');cl.id='vt-fs-close';cl.className='vt-fs-close';cl.innerHTML='<i class="fas fa-times"></i>';cl.onclick=vtCollapseSession;document.body.appendChild(cl)}
  ov.classList.add('open');cl.classList.add('open');
  session.classList.add('vt-session-fs');
  document.body.style.overflow='hidden';
}
function vtCollapseSession(){
  if(!vtSessionExpanded)return;
  vtSessionExpanded=false;
  var session=document.getElementById('vt-active-session');
  if(session)session.classList.remove('vt-session-fs');
  var ov=document.getElementById('vt-fs-overlay');if(ov)ov.classList.remove('open');
  var cl=document.getElementById('vt-fs-close');if(cl)cl.classList.remove('open');
  document.body.style.overflow='';
}

"""

content = sr(content,
    '/* ═══════ AUTO-START STREAM ON PAGE LOAD ═══════ */',
    session_expand_js + '/* ═══════ AUTO-START STREAM ON PAGE LOAD ═══════ */',
    "Insert session expand JS")

# Update ESC key handler to also close session expand
content = sr(content,
    "document.addEventListener('keydown',function(e){if(e.key==='Escape'&&vtExpandedFrame)vtCollapseDash()});",
    "document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(vtSessionExpanded)vtCollapseSession();else if(vtExpandedFrame)vtCollapseDash()}});",
    "ESC key closes session expand too")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nDone! {n} changes applied.")
