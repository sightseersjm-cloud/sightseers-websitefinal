#!/usr/bin/env python3
"""
Fix:
1. Light mode: Stream Settings, Pricing controls, missing elements
2. Audio: unmute YouTube when entering V-Tours
3. Ensure session expand works (stacking context already fixed)
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

# ========== 1. LIGHT MODE FIXES ==========
print("=== LIGHT MODE FIXES ===")

# Stream Settings h4 has inline color:#fff - need override
# Selects have inline dark styles - need overrides
# Pricing section needs more light overrides
# Add comprehensive missing light overrides

extra_light = """
.vt-dash-light .vt-multicam-settings{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-multicam-settings h4{color:var(--navy)!important}
.vt-dash-light .vt-multicam-settings select{background:#fff!important;color:var(--navy)!important;border-color:rgba(0,0,0,.1)!important}
.vt-dash-light .vt-multicam-setting{border-bottom-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-pricing-ctrl{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-pricing-ctrl h4{color:var(--navy)!important}
.vt-dash-light .vt-pricing-row{border-bottom-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-pricing-row span{color:#617087!important}
.vt-dash-light .vt-pricing-val strong{color:var(--navy)!important}
.vt-dash-light .vt-pricing-num{color:var(--orange)!important}
.vt-dash-light .vt-toggle-slider{background:rgba(0,0,0,.12)!important}
.vt-dash-light .vt-toggle-slider::after{background:#fff!important;box-shadow:0 1px 4px rgba(0,0,0,.15)!important}
.vt-dash-light .vt-toggle input:checked+.vt-toggle-slider{background:var(--orange)!important}
.vt-dash-light .vt-live-header h3{color:var(--navy)!important}
.vt-dash-light .vt-live-header a{color:var(--orange)!important}
.vt-dash-light .vt-session{background:linear-gradient(135deg,rgba(13,27,42,.95),rgba(20,45,68,.92))!important}
"""

c = sr(c,
    '/* ======== V-TOURS RESPONSIVE ======== */',
    extra_light + '/* ======== V-TOURS RESPONSIVE ======== */',
    "Add missing light overrides")

# ========== 2. UNMUTE AUDIO ON V-TOURS NAV ==========
print("\n=== AUDIO ON V-TOURS ===")

# Add YouTube player API unmute when navigating to V-Tours
# The iframe has enablejsapi=1, so we can use postMessage
c = sr(c,
    """  if(id==='tours'){""",
    """  if(id==='vtours'){
    try{var ytp=document.getElementById('vt-yt-player');if(ytp)ytp.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}','*')}catch(e){}
  }
  if(id!=='vtours'){
    try{var ytp=document.getElementById('vt-yt-player');if(ytp)ytp.contentWindow.postMessage('{"event":"command","func":"mute","args":""}','*')}catch(e){}
  }
  if(id==='tours'){""",
    "Unmute YouTube on V-Tours nav")

# ========== 3. FIX SESSION EXPAND STACKING ==========
print("\n=== SESSION EXPAND FIX ===")

# The session is inside the dashboard frame which is inside .vt-dash-panel
# We already removed transforms from vtFadeIn, but the session itself
# needs to escape any remaining context. Best approach: also move session to body
# but only the session element (not the whole frame), and it doesn't have an iframe directly.
# Actually the session DOES contain the YouTube iframe.
# So we can't move it. Instead, ensure no parent creates a stacking context.

# The .vt-session.vt-session-fs uses position:fixed. Let's verify the
# animation on it doesn't create an issue.
c = sr(c,
    '.vt-session.vt-session-fs{position:fixed!important;inset:12px!important;z-index:10001!important;border-radius:20px!important;box-shadow:0 40px 100px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)!important;display:flex!important;flex-direction:column!important;animation:vtSessionOpen .5s cubic-bezier(.2,.9,.3,1) forwards;overflow:hidden!important}',
    '.vt-session.vt-session-fs{position:fixed!important;inset:12px!important;z-index:10001!important;border-radius:20px!important;box-shadow:0 40px 100px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}',
    "Session fullscreen - remove animation (prevents stacking)")

# Also ensure the .reveal.vis parent doesn't block fixed positioning
# Add explicit override when session is in fullscreen
c = sr(c,
    '.vt-dash-frame.vt-fullscreen .vt-dash-panel,.vt-dash-frame.vt-fullscreen .vt-dash-showcase{transform:none!important;animation:none!important}',
    '.vt-dash-frame.vt-fullscreen .vt-dash-panel,.vt-dash-frame.vt-fullscreen .vt-dash-showcase{transform:none!important;animation:none!important}\n.vt-dash-showcase.vis{transform:none!important}',
    "Ensure showcase vis has no transform")

# The session expand also needs the session to escape the dashboard frame's
# overflow:hidden. When the frame itself isn't fullscreen but the session is,
# the session is clipped. Fix: when session goes fullscreen, temporarily
# set overflow:visible on parents.
c = sr(c,
    """function vtExpandSession(){
  var session=document.getElementById('vt-active-session');if(!session)return;
  if(vtSessionExpanded){vtCollapseSession();return}
  vtSessionExpanded=true;
  var ov=document.getElementById('vt-sfs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-sfs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseSession;document.body.appendChild(ov)}
  ov.classList.add('open');
  session.classList.add('vt-session-fs');
  document.body.style.overflow='hidden';
}
function vtCollapseSession(){
  if(!vtSessionExpanded)return;
  vtSessionExpanded=false;
  var session=document.getElementById('vt-active-session');
  if(session){session.style.animation='vtSessionClose .35s cubic-bezier(.4,0,.2,1) forwards';setTimeout(function(){session.classList.remove('vt-session-fs');session.style.animation=''},350)}
  var ov=document.getElementById('vt-sfs-overlay');if(ov)ov.classList.remove('open');
  document.body.style.overflow='';
}""",
    """function vtExpandSession(){
  var session=document.getElementById('vt-active-session');if(!session)return;
  if(vtSessionExpanded){vtCollapseSession();return}
  vtSessionExpanded=true;
  var ov=document.getElementById('vt-sfs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-sfs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseSession;document.body.appendChild(ov)}
  ov.classList.add('open');
  var frame=session.closest('.vt-dash-frame');
  if(frame){frame.style.overflow='visible';frame.style.zIndex='10000'}
  var body=session.closest('.vt-dash-body');if(body)body.style.overflow='visible';
  var main=session.closest('.vt-dash-main');if(main)main.style.overflow='visible';
  session.classList.add('vt-session-fs');
  document.body.style.overflow='hidden';
}
function vtCollapseSession(){
  if(!vtSessionExpanded)return;
  vtSessionExpanded=false;
  var session=document.getElementById('vt-active-session');
  if(session){
    session.classList.remove('vt-session-fs');
    var frame=session.closest('.vt-dash-frame');
    if(frame){frame.style.overflow='';frame.style.zIndex=''}
    var body=session.closest('.vt-dash-body');if(body)body.style.overflow='';
    var main=session.closest('.vt-dash-main');if(main)main.style.overflow='';
  }
  var ov=document.getElementById('vt-sfs-overlay');if(ov)ov.classList.remove('open');
  document.body.style.overflow='';
}""",
    "Session expand - unclip parents")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
