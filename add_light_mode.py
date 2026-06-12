#!/usr/bin/env python3
"""
Add light/dark mode toggle to both dashboards.
- Toggle button in each dashboard header
- .vt-dash-light class overrides all dark CSS back to clean light theme
- JS toggle function with localStorage persistence
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

# ========== 1. ADD LIGHT MODE CSS ==========
print("=== LIGHT MODE CSS ===")

light_css = """
/* ======== DASHBOARD LIGHT MODE ======== */
.vt-dash-theme-btn{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:12px;font-weight:600;color:rgba(255,255,255,.7);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .25s}
.vt-dash-theme-btn:hover{background:rgba(255,255,255,.1);color:#fff}
.vt-dash-light .vt-dash-theme-btn{border-color:rgba(0,0,0,.08);background:#fff;color:var(--navy)}
.vt-dash-light .vt-dash-theme-btn:hover{background:#f0f2f5}

.vt-dash-light{background:#f0f2f5!important;border-color:rgba(0,0,0,.08)!important;box-shadow:0 20px 60px rgba(0,0,0,.08)!important}
.vt-dash-light .vt-dash-sidebar{background:#fff!important;border-right-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-dash-sidebar-label{color:#99a3b0!important}
.vt-dash-light .vt-dash-sidebar a{color:#617087!important}
.vt-dash-light .vt-dash-sidebar a:hover{background:rgba(0,0,0,.03)!important;color:var(--navy)!important}
.vt-dash-light .vt-dash-sidebar a.active{background:rgba(239,135,49,.08)!important;color:var(--orange)!important}
.vt-dash-light .vt-dash-sidebar a .badge{background:var(--orange)!important;color:#fff!important}
.vt-dash-light .vt-dash-main{background:#f0f2f5!important}
.vt-dash-light .vt-dash-header h2{color:var(--navy)!important}
.vt-dash-light .vt-dash-header-btn{border-color:rgba(0,0,0,.08)!important;background:#fff!important;color:var(--navy)!important}
.vt-dash-light .vt-dash-header-btn.primary{background:var(--orange)!important;color:#fff!important;border-color:var(--orange)!important}
.vt-dash-light .vt-dash-stat{background:#fff!important;border-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-dash-stat strong{color:var(--navy)!important}
.vt-dash-light .vt-dash-stat span{color:#99a3b0!important}
.vt-dash-light .vt-dash-stat small{color:#b0b8c4!important}
.vt-dash-light .vt-live-header h3{color:var(--navy)!important}
.vt-dash-light .vt-live-card{background:#fff!important;border-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-live-card-body{background:#fff!important}
.vt-dash-light .vt-live-card-title{color:var(--navy)!important}
.vt-dash-light .vt-live-card-guide{color:#617087!important}
.vt-dash-light .vt-live-card-price{color:var(--navy)!important}
.vt-dash-light .vt-empty-state{color:#94a3b8!important}
.vt-dash-light .vt-empty-state h4{color:var(--navy)!important}
.vt-dash-light .vt-dash-avatar{border-top-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-dash-avatar-info{color:var(--navy)!important}
.vt-dash-light .vt-dash-avatar-info span{color:#99a3b0!important}
.vt-dash-light .vt-earnings-chart{background:#fff!important;border-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-earnings-chart h4{color:var(--navy)!important}
.vt-dash-light .vt-earnings-chart .vt-chart-sub{color:#99a3b0!important}
.vt-dash-light .vt-chart-bar span{color:#99a3b0!important}
.vt-dash-light .vt-chart-note{color:#99a3b0!important}
.vt-dash-light .vt-schedule h4{color:var(--navy)!important}
.vt-dash-light .vt-schedule-item{border-bottom-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-schedule-info h5{color:var(--navy)!important}
.vt-dash-light .vt-schedule-info p{color:#99a3b0!important}
.vt-dash-light .vt-schedule-day strong{color:var(--navy)!important}
.vt-dash-light .vt-schedule-day span{color:#99a3b0!important}
.vt-dash-light .vt-guide-table th{color:#99a3b0!important;border-bottom-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-guide-table td{color:#617087!important;border-bottom-color:rgba(0,0,0,.03)!important}
.vt-dash-light .vt-guide-table td:first-child{color:var(--navy)!important}
.vt-dash-light .vt-guide-table tbody tr:hover{background:rgba(239,135,49,.04)!important}
.vt-dash-light .vt-ai-chat{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-ai-chat-header{background:linear-gradient(135deg,#063a63,#0d5371)!important;color:#fff!important}
.vt-dash-light .vt-ai-msg.bot{background:rgba(0,0,0,.03)!important;color:#333!important}
.vt-dash-light .vt-ai-msg.user{background:var(--orange)!important;color:#fff!important}
.vt-dash-light .vt-ai-chip{background:rgba(0,0,0,.04)!important;color:var(--navy)!important;border-color:rgba(0,0,0,.08)!important}
.vt-dash-light .vt-ai-chip:hover{background:rgba(239,135,49,.08)!important;border-color:var(--orange)!important;color:var(--orange)!important}
.vt-dash-light .vt-ai-input-wrap{background:#f8f9fa!important;border-top-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-ai-input-wrap input{background:#fff!important;border-color:rgba(0,0,0,.1)!important;color:#333!important}
.vt-dash-light .vt-passport-card{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-passport-card h3{color:var(--navy)!important}
.vt-dash-light .vt-passport-map{background:#f0f2f5!important}
.vt-dash-light .vt-passport-stats strong{color:var(--navy)!important}
.vt-dash-light .vt-passport-stats span{color:#617087!important}
.vt-dash-light .vt-passport-badges strong{color:var(--navy)!important}
.vt-dash-light .vt-passport-badge span{color:#617087!important}
.vt-dash-light .vt-passport-stamp span{color:#617087!important}
.vt-dash-light .vt-social-card{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-social-friend-info strong{color:var(--navy)!important}
.vt-dash-light .vt-social-friend-info span{color:#617087!important}
.vt-dash-light .vt-social-post-avatar{background:rgba(0,0,0,.06)!important;color:#617087!important}
.vt-dash-light .vt-social-post-body{color:#333!important}
.vt-dash-light .vt-social-post-body strong{color:var(--navy)!important}
.vt-dash-light .vt-social-post-time{color:#99a3b0!important}
.vt-dash-light .vt-social-post-text{color:#617087!important}
.vt-dash-light .vt-social-feed-label{color:#99a3b0!important}
.vt-dash-light .vt-social-friend-action{background:rgba(239,135,49,.08)!important;color:var(--orange)!important}
.vt-dash-light .vt-replay-card{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-replay-card-info strong{color:var(--navy)!important}
.vt-dash-light .vt-replay-card-info span{color:#617087!important}
.vt-dash-light .vt-replay-card-info small{color:#99a3b0!important}
.vt-dash-light .vt-sentiment-label{color:var(--navy)!important}
.vt-dash-light .vt-sentiment-bar{background:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-sentiment-kw-title{color:#99a3b0!important}
.vt-dash-light .vt-kw{color:var(--orange)!important}
.vt-dash-light .vt-gift-item{border-bottom-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-gift-info strong{color:var(--navy)!important}
.vt-dash-light .vt-gift-info small{color:#99a3b0!important}
.vt-dash-light .vt-gift-info{color:#617087!important}
.vt-dash-light .vt-multicam-card{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-multicam-label strong{color:var(--navy)!important}
.vt-dash-light .vt-multicam-label span{color:#617087!important}
.vt-dash-light .vt-multicam-setting{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-multicam-setting strong{color:var(--navy)!important}
.vt-dash-light .vt-multicam-setting span{color:#617087!important}
.vt-dash-light .vt-pricing-ctrl{background:#fff!important;border-color:rgba(0,0,0,.06)!important}
.vt-dash-light .vt-pricing-row{border-bottom-color:rgba(0,0,0,.04)!important}
.vt-dash-light .vt-pricing-row span{color:#617087!important}
.vt-dash-light .vt-pricing-val strong{color:var(--navy)!important}
.vt-dash-light .vt-toggle-slider{background:rgba(0,0,0,.15)!important}
"""

c = sr(c,
    '/* ======== V-TOURS RESPONSIVE ======== */',
    light_css + '/* ======== V-TOURS RESPONSIVE ======== */',
    "Insert light mode CSS block")

# ========== 2. ADD TOGGLE BUTTONS ==========
print("\n=== TOGGLE BUTTONS ===")

# Explorer dashboard header
c = sr(c,
    """                  <div class="vt-dash-header-actions">
                    <div class="vt-dash-header-btn" onclick="vtExpNav('browse',document.querySelector('#vt-exp-sidebar a:nth-child(3)'))">Browse All</div>
                    <div class="vt-dash-header-btn primary" onclick="vtToast('<i class=\\'fas fa-calendar-check\\'></i> Tour scheduler coming soon!')">Schedule Tour</div>
                  </div>""",
    """                  <div class="vt-dash-header-actions">
                    <div class="vt-dash-theme-btn" onclick="vtToggleDashTheme('explorer')"><i class="fas fa-sun" id="vt-exp-theme-icon"></i> <span id="vt-exp-theme-label">Light</span></div>
                    <div class="vt-dash-header-btn" onclick="vtExpNav('browse',document.querySelector('#vt-exp-sidebar a:nth-child(3)'))">Browse All</div>
                    <div class="vt-dash-header-btn primary" onclick="vtToast('<i class=\\'fas fa-calendar-check\\'></i> Tour scheduler coming soon!')">Schedule Tour</div>
                  </div>""",
    "Explorer toggle button")

# Guide dashboard header
c = sr(c,
    """                  <div class="vt-dash-header-actions">
                    <div class="vt-dash-header-btn" onclick="vtGuideNav('tours',document.querySelector('#vt-guide-sidebar a:nth-child(3)'))">Add Tour</div>
                    <div class="vt-dash-header-btn primary" onclick="vtGoLive()">Go Live Now</div>
                  </div>""",
    """                  <div class="vt-dash-header-actions">
                    <div class="vt-dash-theme-btn" onclick="vtToggleDashTheme('guide')"><i class="fas fa-sun" id="vt-guide-theme-icon"></i> <span id="vt-guide-theme-label">Light</span></div>
                    <div class="vt-dash-header-btn" onclick="vtGuideNav('tours',document.querySelector('#vt-guide-sidebar a:nth-child(3)'))">Add Tour</div>
                    <div class="vt-dash-header-btn primary" onclick="vtGoLive()">Go Live Now</div>
                  </div>""",
    "Guide toggle button")

# ========== 3. ADD JS TOGGLE FUNCTION ==========
print("\n=== TOGGLE JS ===")

toggle_js = """
/* -- Dashboard light/dark toggle -- */
function vtToggleDashTheme(which){
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
vtRestoreDashTheme();

"""

c = sr(c,
    '/* ── Guide sidebar nav ── */',
    toggle_js + '/* ── Guide sidebar nav ── */',
    "Insert toggle JS")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
