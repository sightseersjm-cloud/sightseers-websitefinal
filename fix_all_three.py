#!/usr/bin/env python3
"""
1. Change AI Concierge sidebar icon from robot to wand-magic-sparkles
2. Retheme Tips & Gifts with adventure/nature items
3. Move light/dark toggle to topbar beside expand button
4. Fix light mode missing overrides for AI Concierge, Passport, Social views
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

# ========== 1. AI CONCIERGE ICON ==========
print("=== AI CONCIERGE ICON ===")

c = sr(c,
    """<a href="#" onclick="vtExpNav('concierge',this);return false"><i class="fas fa-robot"></i> AI Concierge</a>""",
    """<a href="#" onclick="vtExpNav('concierge',this);return false"><i class="fas fa-wand-magic-sparkles"></i> AI Concierge</a>""",
    "Sidebar icon → sparkle wand")

c = sr(c,
    """<h2><i class="fas fa-robot" style="color:var(--orange);margin-right:8px"></i>AI Trip Concierge</h2>""",
    """<h2><i class="fas fa-wand-magic-sparkles" style="color:var(--orange);margin-right:8px"></i>AI Trip Concierge</h2>""",
    "Header icon → sparkle wand")

# ========== 2. TIPS & GIFTS → ADVENTURE/NATURE THEME ==========
print("\n=== TIPS & GIFTS → ADVENTURE THEME ===")

# Gift stream items - replace with nature/adventure themed gifts
c = sr(c,
    """<div class="vt-gift-item"><span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Palm Tree<small>$10.00 — 2 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#11088;</span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Gold Star<small>$5.00 — 5 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#128026;</span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Conch Shell<small>$25.00 — 8 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Palm Tree<small>$10.00 — 12 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#128142;</span><div class="vt-gift-info"><strong>James P.</strong> sent a Diamond<small>$50.00 — 15 min ago</small></div></div>""",
    """<div class="vt-gift-item"><span class="vt-gift-emoji">&#127754;</span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Tropical Sunset<small>$15.00 — 2 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#127965;</span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Desert Island<small>$25.00 — 5 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#129416;</span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Sea Turtle<small>$20.00 — 8 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#127754;</span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Tropical Sunset<small>$15.00 — 12 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#128038;</span><div class="vt-gift-info"><strong>James P.</strong> sent a Hummingbird<small>$50.00 — 15 min ago</small></div></div>""",
    "Gift stream → adventure themed")

# Top Gift stat
c = sr(c,
    """<strong style="font-size:28px;line-height:1">&#127796;</strong><span>Top Gift</span><small>Palm Tree ($10)</small>""",
    """<strong style="font-size:28px;line-height:1">&#127754;</strong><span>Top Gift</span><small>Tropical Sunset ($15)</small>""",
    "Top Gift → Tropical Sunset")

# ========== 3. MOVE TOGGLE TO TOPBAR ==========
print("\n=== MOVE TOGGLE TO TOPBAR ===")

# Remove toggle from Explorer dashboard header
c = sr(c,
    """                    <div class="vt-dash-theme-btn" onclick="vtToggleDashTheme('explorer')"><i class="fas fa-sun" id="vt-exp-theme-icon"></i> <span id="vt-exp-theme-label">Light</span></div>
                    <div class="vt-dash-header-btn" onclick="vtExpNav('browse',document.querySelector('#vt-exp-sidebar a:nth-child(3)'))">Browse All</div>""",
    """                    <div class="vt-dash-header-btn" onclick="vtExpNav('browse',document.querySelector('#vt-exp-sidebar a:nth-child(3)'))">Browse All</div>""",
    "Remove explorer header toggle")

# Remove toggle from Guide dashboard header
c = sr(c,
    """                    <div class="vt-dash-theme-btn" onclick="vtToggleDashTheme('guide')"><i class="fas fa-sun" id="vt-guide-theme-icon"></i> <span id="vt-guide-theme-label">Light</span></div>
                    <div class="vt-dash-header-btn" onclick="vtGuideNav('tours',document.querySelector('#vt-guide-sidebar a:nth-child(3)'))">Add Tour</div>""",
    """                    <div class="vt-dash-header-btn" onclick="vtGuideNav('tours',document.querySelector('#vt-guide-sidebar a:nth-child(3)'))">Add Tour</div>""",
    "Remove guide header toggle")

# Add toggle to Explorer topbar beside expand
c = sr(c,
    """            <div class="vt-expand-btn" onclick="vtExpandDash('explorer')" title="Expand to full screen"><i class="fas fa-expand"></i></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-exp-sidebar">""",
    """            <div class="vt-topbar-actions"><div class="vt-topbar-theme-btn" onclick="vtToggleDashTheme('explorer')" title="Toggle light/dark mode"><i class="fas fa-sun" id="vt-exp-theme-icon"></i></div><div class="vt-expand-btn" onclick="vtExpandDash('explorer')" title="Expand to full screen"><i class="fas fa-expand"></i></div></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-exp-sidebar">""",
    "Explorer topbar toggle")

# Add toggle to Guide topbar beside expand
c = sr(c,
    """            <div class="vt-expand-btn" onclick="vtExpandDash('guide')" title="Expand to full screen"><i class="fas fa-expand"></i></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-guide-sidebar">""",
    """            <div class="vt-topbar-actions"><div class="vt-topbar-theme-btn" onclick="vtToggleDashTheme('guide')" title="Toggle light/dark mode"><i class="fas fa-sun" id="vt-guide-theme-icon"></i></div><div class="vt-expand-btn" onclick="vtExpandDash('guide')" title="Expand to full screen"><i class="fas fa-expand"></i></div></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-guide-sidebar">""",
    "Guide topbar toggle")

# Add CSS for topbar actions and theme button
topbar_css = """.vt-topbar-actions{display:flex;align-items:center;gap:8px}
.vt-topbar-theme-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;font-size:13px;color:rgba(255,255,255,.7)}
.vt-topbar-theme-btn:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.1)}
.vt-dash-light .vt-topbar-theme-btn{background:rgba(0,0,0,.06);color:var(--navy)}
.vt-dash-light .vt-topbar-theme-btn:hover{background:rgba(0,0,0,.1)}
.vt-dash-light .vt-dash-topbar{background:var(--navy)}
"""

c = sr(c,
    '.vt-dash-topbar{display:flex;align-items:center;justify-content:space-between;background:var(--navy);padding:10px 20px;color:#fff;font-size:13px;font-weight:700}',
    topbar_css + '.vt-dash-topbar{display:flex;align-items:center;justify-content:space-between;background:var(--navy);padding:10px 20px;color:#fff;font-size:13px;font-weight:700}',
    "Topbar theme btn CSS")

# Update JS to use new icon IDs (no more label span)
c = sr(c,
    """function vtToggleDashTheme(which){
  var frameId=which==='explorer'?'vt-explorer-frame':'vt-guide-frame';
  var frame=document.getElementById(frameId);
  if(!frame)return;
  var isLight=frame.classList.toggle('vt-dash-light');
  var iconId=which==='explorer'?'vt-exp-theme-icon':'vt-guide-theme-icon';
  var labelId=which==='explorer'?'vt-exp-theme-label':'vt-guide-theme-label';
  var icon=document.getElementById(iconId);
  var label=document.getElementById(labelId);
  if(icon){icon.className=isLight?'fas fa-moon':'fas fa-sun'}
  if(label){label.textContent=isLight?'Dark':'Light'}
  try{localStorage.setItem('vt-dash-theme-'+which,isLight?'light':'dark')}catch(e){}
}
function vtRestoreDashTheme(){
  ['explorer','guide'].forEach(function(w){
    try{
      var pref=localStorage.getItem('vt-dash-theme-'+w);
      if(pref==='light'){
        var frameId=w==='explorer'?'vt-explorer-frame':'vt-guide-frame';
        var frame=document.getElementById(frameId);
        if(frame)frame.classList.add('vt-dash-light');
        var iconId=w==='explorer'?'vt-exp-theme-icon':'vt-guide-theme-icon';
        var labelId=w==='explorer'?'vt-exp-theme-label':'vt-guide-theme-label';
        var icon=document.getElementById(iconId);
        var label=document.getElementById(labelId);
        if(icon)icon.className='fas fa-moon';
        if(label)label.textContent='Dark';
      }
    }catch(e){}
  });
}
vtRestoreDashTheme();""",
    """function vtToggleDashTheme(which){
  var frameId=which==='explorer'?'vt-explorer-frame':'vt-guide-frame';
  var frame=document.getElementById(frameId);
  if(!frame)return;
  var isLight=frame.classList.toggle('vt-dash-light');
  var icon=document.getElementById(which==='explorer'?'vt-exp-theme-icon':'vt-guide-theme-icon');
  if(icon)icon.className=isLight?'fas fa-moon':'fas fa-sun';
  try{localStorage.setItem('vt-dash-theme-'+which,isLight?'light':'dark')}catch(e){}
}
function vtRestoreDashTheme(){
  ['explorer','guide'].forEach(function(w){
    try{
      if(localStorage.getItem('vt-dash-theme-'+w)==='light'){
        var frame=document.getElementById(w==='explorer'?'vt-explorer-frame':'vt-guide-frame');
        if(frame)frame.classList.add('vt-dash-light');
        var icon=document.getElementById(w==='explorer'?'vt-exp-theme-icon':'vt-guide-theme-icon');
        if(icon)icon.className='fas fa-moon';
      }
    }catch(e){}
  });
}
vtRestoreDashTheme();""",
    "Simplify toggle JS")

# ========== 4. FIX LIGHT MODE FOR AI CONCIERGE, PASSPORT, SOCIAL ==========
print("\n=== LIGHT MODE MISSING OVERRIDES ===")

# Build comprehensive missing light overrides
missing_light = """
.vt-dash-light .vt-ai-bubble{background:rgba(0,0,0,.04)!important;border-color:rgba(0,0,0,.06)!important;color:#333!important}
.vt-dash-light .vt-ai-msg.user .vt-ai-bubble{background:rgba(239,135,49,.1)!important;color:var(--navy)!important}
.vt-dash-light .vt-ai-msg.user .vt-ai-avatar{background:linear-gradient(135deg,var(--navy),#0d5371)!important}
.vt-dash-light .vt-ai-typing span{background:#99a3b0!important}
.vt-dash-light .vt-passport-tier{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-passport-tier-info strong{color:var(--navy)!important}
.vt-dash-light .vt-passport-tier-info span{color:#617087!important}
.vt-dash-light .vt-passport-xp{background:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-passport-xp-label{color:#99a3b0!important}
.vt-dash-light .vt-passport-stamps{color:#333!important}
.vt-dash-light .vt-passport-stamp{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-social-friend{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-social-friend:hover{background:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-social-friend-avatar.off{background:rgba(0,0,0,.06)!important;color:#99a3b0!important}
.vt-dash-light .vt-social-friend-info span{color:#99a3b0!important}
.vt-dash-light .vt-social-post{background:rgba(0,0,0,.02)!important;border-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-replay-card-meta{color:#99a3b0!important}
"""

c = sr(c,
    '.vt-dash-light .vt-replay-card-info small{color:#99a3b0!important}',
    '.vt-dash-light .vt-replay-card-info small{color:#99a3b0!important}' + missing_light,
    "Add missing light overrides")

# Also remove the old .vt-dash-theme-btn CSS since we replaced with topbar version
c = sr(c,
    """.vt-dash-theme-btn{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:12px;font-weight:600;color:rgba(255,255,255,.7);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .25s}
.vt-dash-theme-btn:hover{background:rgba(255,255,255,.1);color:#fff}
.vt-dash-light .vt-dash-theme-btn{border-color:rgba(0,0,0,.08);background:#fff;color:var(--navy)}
.vt-dash-light .vt-dash-theme-btn:hover{background:#f0f2f5}""",
    "",
    "Remove old theme btn CSS")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
