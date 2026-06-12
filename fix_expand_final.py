#!/usr/bin/env python3
"""
Fix dashboard expand and session expand.
Root cause: .page.on has transform:translateY(0) which is a non-none transform,
creating a containing block that traps position:fixed elements.
Fix: body.vt-expanding class neutralizes ALL ancestor stacking contexts.
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

# ========== 1. CSS: body.vt-expanding neutralizes all stacking contexts ==========
print("=== ADD EXPANDING CSS ===")

expanding_css = """/* ======== EXPAND STACKING FIX ======== */
body.vt-expanding .page,body.vt-expanding .reveal,body.vt-expanding .vt-sec,body.vt-expanding .vt-wrap,body.vt-expanding .vt-dash-panel,body.vt-expanding .vt-dash-showcase{transform:none!important;animation:none!important;will-change:auto!important;filter:none!important;perspective:none!important;contain:none!important;transition:none!important}
"""

c = sr(c,
    '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */',
    expanding_css + '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */',
    "Add body.vt-expanding stacking fix CSS")

# ========== 2. Remove transform from vtFullIn animation ==========
print("\n=== FIX ANIMATION ===")

c = sr(c,
    '@keyframes vtFullIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}',
    '@keyframes vtFullIn{from{opacity:0}to{opacity:1}}',
    "vtFullIn → opacity only (no transform)")

# ========== 3. Update vtExpandDash JS ==========
print("\n=== FIX DASHBOARD EXPAND JS ===")

c = sr(c,
    """function vtExpandDash(which){
  if(vtExpandedFrame){vtCollapseDash();return}
  var frame=document.getElementById(which==='explorer'?'vt-explorer-frame':'vt-guide-frame');
  if(!frame)return;
  vtExpandedFrame=frame;
  var ov=document.getElementById('vt-fs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-fs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseDash;document.body.appendChild(ov)}
  var cl=document.getElementById('vt-fs-close');
  if(!cl){cl=document.createElement('div');cl.id='vt-fs-close';cl.className='vt-fs-close';cl.innerHTML='<i class="fas fa-times"></i>';cl.onclick=vtCollapseDash;document.body.appendChild(cl)}
  ov.classList.add('open');
  cl.classList.add('open');
  frame.classList.add('vt-fullscreen');
  document.body.style.overflow='hidden';
  if(!vtStreamActive)vtStartStream();
}
function vtCollapseDash(){
  if(!vtExpandedFrame)return;
  vtExpandedFrame.classList.remove('vt-fullscreen');
  var ov=document.getElementById('vt-fs-overlay');if(ov)ov.classList.remove('open');
  var cl=document.getElementById('vt-fs-close');if(cl)cl.classList.remove('open');
  document.body.style.overflow='';
  vtExpandedFrame=null;
}""",
    """function vtExpandDash(which){
  if(vtExpandedFrame){vtCollapseDash();return}
  var frame=document.getElementById(which==='explorer'?'vt-explorer-frame':'vt-guide-frame');
  if(!frame)return;
  vtExpandedFrame=frame;
  document.body.classList.add('vt-expanding');
  var ov=document.getElementById('vt-fs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-fs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseDash;document.body.appendChild(ov)}
  var cl=document.getElementById('vt-fs-close');
  if(!cl){cl=document.createElement('div');cl.id='vt-fs-close';cl.className='vt-fs-close';cl.innerHTML='<i class="fas fa-times"></i>';cl.onclick=vtCollapseDash;document.body.appendChild(cl)}
  ov.classList.add('open');
  cl.classList.add('open');
  frame.classList.add('vt-fullscreen');
  document.body.style.overflow='hidden';
  if(!vtStreamActive)vtStartStream();
}
function vtCollapseDash(){
  if(!vtExpandedFrame)return;
  vtExpandedFrame.classList.remove('vt-fullscreen');
  document.body.classList.remove('vt-expanding');
  var ov=document.getElementById('vt-fs-overlay');if(ov)ov.classList.remove('open');
  var cl=document.getElementById('vt-fs-close');if(cl)cl.classList.remove('open');
  document.body.style.overflow='';
  vtExpandedFrame=null;
}""",
    "vtExpandDash/Collapse → add/remove body.vt-expanding")

# ========== 4. Update vtExpandSession JS ==========
print("\n=== FIX SESSION EXPAND JS ===")

c = sr(c,
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
    """function vtExpandSession(){
  var session=document.getElementById('vt-active-session');if(!session)return;
  if(vtSessionExpanded){vtCollapseSession();return}
  vtSessionExpanded=true;
  document.body.classList.add('vt-expanding');
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
  document.body.classList.remove('vt-expanding');
  var ov=document.getElementById('vt-sfs-overlay');if(ov)ov.classList.remove('open');
  document.body.style.overflow='';
}""",
    "vtExpandSession/Collapse → add/remove body.vt-expanding")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
