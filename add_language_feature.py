#!/usr/bin/env python3
"""
Add language selection to V-Tours:
1. Language selector button in topbar (Explorer + Guide)
2. Language dropdown panel with flags
3. First-visit language prompt modal
4. Audio language indicator in session bar
5. Caption language toggle in session actions
6. Light mode overrides
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

# ========== 1. CSS FOR LANGUAGE FEATURE ==========
print("=== LANGUAGE CSS ===")

lang_css = """/* ======== LANGUAGE SELECTOR ======== */
.vt-lang-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;font-size:11px;font-weight:700;color:rgba(255,255,255,.8);letter-spacing:.5px;position:relative}
.vt-lang-btn:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.1)}
.vt-lang-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:220px;background:rgba(13,27,42,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);opacity:0;transform:translateY(-6px);pointer-events:none;transition:all .25s cubic-bezier(.25,.46,.45,.94);z-index:100}
.vt-lang-dropdown.open{opacity:1;transform:translateY(0);pointer-events:auto}
.vt-lang-dropdown-title{font-size:10px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;padding:6px 10px 4px;margin-bottom:2px}
.vt-lang-option{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:all .2s;font-size:12px;color:rgba(255,255,255,.7);font-weight:500}
.vt-lang-option:hover{background:rgba(255,255,255,.08);color:#fff}
.vt-lang-option.active{background:rgba(239,135,49,.15);color:var(--orange)}
.vt-lang-option .vt-lang-flag{font-size:18px;line-height:1;flex-shrink:0}
.vt-lang-option .vt-lang-name{flex:1}
.vt-lang-option .vt-lang-check{font-size:10px;color:var(--orange);opacity:0;transition:opacity .2s}
.vt-lang-option.active .vt-lang-check{opacity:1}
.vt-lang-divider{height:1px;background:rgba(255,255,255,.06);margin:4px 8px}
.vt-lang-audio-label{font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(239,135,49,.15);color:var(--orange);font-weight:700;letter-spacing:.3px}
/* Language Prompt Modal */
.vt-lang-prompt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:100020;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:all .4s}
.vt-lang-prompt-overlay.open{opacity:1;pointer-events:auto}
.vt-lang-prompt{background:linear-gradient(160deg,#0d1b2a,#132d46);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:32px;max-width:400px;width:90%;box-shadow:0 40px 100px rgba(0,0,0,.6);text-align:center;transform:scale(.92);transition:transform .4s cubic-bezier(.2,.9,.3,1)}
.vt-lang-prompt-overlay.open .vt-lang-prompt{transform:scale(1)}
.vt-lang-prompt-icon{font-size:40px;margin-bottom:12px}
.vt-lang-prompt h3{color:#fff;font-size:18px;margin-bottom:6px;font-weight:800}
.vt-lang-prompt p{color:rgba(255,255,255,.5);font-size:12px;margin-bottom:20px;line-height:1.6}
.vt-lang-prompt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:20px}
.vt-lang-prompt-item{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);cursor:pointer;transition:all .2s;font-size:12px;color:rgba(255,255,255,.7)}
.vt-lang-prompt-item:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#fff}
.vt-lang-prompt-item.selected{background:rgba(239,135,49,.15);border-color:rgba(239,135,49,.3);color:var(--orange)}
.vt-lang-prompt-item .vt-lang-flag{font-size:20px}
.vt-lang-prompt-confirm{width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--orange),#d97706);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .3s;font-family:inherit}
.vt-lang-prompt-confirm:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,135,49,.4)}
.vt-lang-prompt-confirm:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none}
.vt-lang-prompt-skip{margin-top:10px;font-size:11px;color:rgba(255,255,255,.35);cursor:pointer;transition:color .2s;background:none;border:none;font-family:inherit}
.vt-lang-prompt-skip:hover{color:rgba(255,255,255,.6)}
/* Audio language in session */
.vt-session-lang{display:flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;background:rgba(255,255,255,.08);font-size:10px;font-weight:600;color:rgba(255,255,255,.7);cursor:pointer;transition:all .25s;border:1px solid rgba(255,255,255,.06)}
.vt-session-lang:hover{background:rgba(255,255,255,.14);color:#fff}
.vt-session-lang .vt-lang-flag{font-size:13px}
/* Light mode */
.vt-dash-light .vt-lang-btn{background:rgba(0,0,0,.06);color:var(--navy)}
.vt-dash-light .vt-lang-btn:hover{background:rgba(0,0,0,.1)}
.vt-dash-light .vt-lang-dropdown{background:rgba(255,255,255,.97);border-color:rgba(0,0,0,.08);box-shadow:0 20px 60px rgba(0,0,0,.15)}
.vt-dash-light .vt-lang-dropdown-title{color:rgba(0,0,0,.35)}
.vt-dash-light .vt-lang-option{color:#617087}
.vt-dash-light .vt-lang-option:hover{background:rgba(0,0,0,.04);color:var(--navy)}
.vt-dash-light .vt-lang-option.active{background:rgba(239,135,49,.08);color:var(--orange)}
.vt-dash-light .vt-lang-divider{background:rgba(0,0,0,.06)}
"""

c = sr(c,
    '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */',
    lang_css + '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */',
    "Insert language CSS")

# ========== 2. ADD LANGUAGE BUTTON TO EXPLORER TOPBAR ==========
print("\n=== EXPLORER TOPBAR LANGUAGE BTN ===")

c = sr(c,
    """<div class="vt-topbar-actions"><div class="vt-topbar-theme-btn" onclick="vtToggleDashTheme('explorer')" title="Toggle light/dark mode"><i class="fas fa-sun" id="vt-exp-theme-icon"></i></div><div class="vt-expand-btn" onclick="vtExpandDash('explorer')" title="Expand to full screen"><i class="fas fa-expand"></i></div></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-exp-sidebar">""",
    """<div class="vt-topbar-actions"><div class="vt-lang-btn" id="vt-exp-lang-btn" onclick="vtToggleLangDropdown('explorer')" title="Language &amp; Audio"><span id="vt-exp-lang-code">EN</span><div class="vt-lang-dropdown" id="vt-exp-lang-dropdown"><div class="vt-lang-dropdown-title">Interface Language</div><div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','explorer')"><span class="vt-lang-flag">&#127468;&#127463;</span><span class="vt-lang-name">English</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="es" onclick="vtSelectLang(event,'es','explorer')"><span class="vt-lang-flag">&#127466;&#127480;</span><span class="vt-lang-name">Espa&ntilde;ol</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="fr" onclick="vtSelectLang(event,'fr','explorer')"><span class="vt-lang-flag">&#127467;&#127479;</span><span class="vt-lang-name">Fran&ccedil;ais</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="de" onclick="vtSelectLang(event,'de','explorer')"><span class="vt-lang-flag">&#127465;&#127466;</span><span class="vt-lang-name">Deutsch</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="pt" onclick="vtSelectLang(event,'pt','explorer')"><span class="vt-lang-flag">&#127463;&#127479;</span><span class="vt-lang-name">Portugu&ecirc;s</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-divider"></div><div class="vt-lang-dropdown-title">Audio &amp; Captions</div><div class="vt-lang-option" data-lang="ja" onclick="vtSelectLang(event,'ja','explorer')"><span class="vt-lang-flag">&#127471;&#127477;</span><span class="vt-lang-name">&#26085;&#26412;&#35486;</span><span class="vt-lang-audio-label">CC</span></div><div class="vt-lang-option" data-lang="zh" onclick="vtSelectLang(event,'zh','explorer')"><span class="vt-lang-flag">&#127464;&#127475;</span><span class="vt-lang-name">&#20013;&#25991;</span><span class="vt-lang-audio-label">CC</span></div><div class="vt-lang-option" data-lang="hi" onclick="vtSelectLang(event,'hi','explorer')"><span class="vt-lang-flag">&#127470;&#127475;</span><span class="vt-lang-name">&#2361;&#2367;&#2344;&#2381;&#2342;&#2368;</span><span class="vt-lang-audio-label">CC</span></div><div class="vt-lang-option" data-lang="ar" onclick="vtSelectLang(event,'ar','explorer')"><span class="vt-lang-flag">&#127480;&#127462;</span><span class="vt-lang-name">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</span><span class="vt-lang-audio-label">CC</span></div></div></div><div class="vt-topbar-theme-btn" onclick="vtToggleDashTheme('explorer')" title="Toggle light/dark mode"><i class="fas fa-sun" id="vt-exp-theme-icon"></i></div><div class="vt-expand-btn" onclick="vtExpandDash('explorer')" title="Expand to full screen"><i class="fas fa-expand"></i></div></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-exp-sidebar">""",
    "Explorer topbar language button + dropdown")

# ========== 3. ADD LANGUAGE BUTTON TO GUIDE TOPBAR ==========
print("\n=== GUIDE TOPBAR LANGUAGE BTN ===")

c = sr(c,
    """<div class="vt-topbar-actions"><div class="vt-topbar-theme-btn" onclick="vtToggleDashTheme('guide')" title="Toggle light/dark mode"><i class="fas fa-sun" id="vt-guide-theme-icon"></i></div><div class="vt-expand-btn" onclick="vtExpandDash('guide')" title="Expand to full screen"><i class="fas fa-expand"></i></div></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-guide-sidebar">""",
    """<div class="vt-topbar-actions"><div class="vt-lang-btn" id="vt-guide-lang-btn" onclick="vtToggleLangDropdown('guide')" title="Language &amp; Audio"><span id="vt-guide-lang-code">EN</span><div class="vt-lang-dropdown" id="vt-guide-lang-dropdown"><div class="vt-lang-dropdown-title">Interface Language</div><div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','guide')"><span class="vt-lang-flag">&#127468;&#127463;</span><span class="vt-lang-name">English</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="es" onclick="vtSelectLang(event,'es','guide')"><span class="vt-lang-flag">&#127466;&#127480;</span><span class="vt-lang-name">Espa&ntilde;ol</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="fr" onclick="vtSelectLang(event,'fr','guide')"><span class="vt-lang-flag">&#127467;&#127479;</span><span class="vt-lang-name">Fran&ccedil;ais</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="de" onclick="vtSelectLang(event,'de','guide')"><span class="vt-lang-flag">&#127465;&#127466;</span><span class="vt-lang-name">Deutsch</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="pt" onclick="vtSelectLang(event,'pt','guide')"><span class="vt-lang-flag">&#127463;&#127479;</span><span class="vt-lang-name">Portugu&ecirc;s</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-divider"></div><div class="vt-lang-dropdown-title">Tour Audio Language</div><div class="vt-lang-option" data-lang="es-audio" onclick="vtSelectLang(event,'es-audio','guide')"><span class="vt-lang-flag">&#127466;&#127480;</span><span class="vt-lang-name">Spanish Audio</span><span class="vt-lang-audio-label">AI</span></div><div class="vt-lang-option" data-lang="fr-audio" onclick="vtSelectLang(event,'fr-audio','guide')"><span class="vt-lang-flag">&#127467;&#127479;</span><span class="vt-lang-name">French Audio</span><span class="vt-lang-audio-label">AI</span></div><div class="vt-lang-option" data-lang="de-audio" onclick="vtSelectLang(event,'de-audio','guide')"><span class="vt-lang-flag">&#127465;&#127466;</span><span class="vt-lang-name">German Audio</span><span class="vt-lang-audio-label">AI</span></div></div></div><div class="vt-topbar-theme-btn" onclick="vtToggleDashTheme('guide')" title="Toggle light/dark mode"><i class="fas fa-sun" id="vt-guide-theme-icon"></i></div><div class="vt-expand-btn" onclick="vtExpandDash('guide')" title="Expand to full screen"><i class="fas fa-expand"></i></div></div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-guide-sidebar">""",
    "Guide topbar language button + dropdown")

# ========== 4. ADD AUDIO LANGUAGE INDICATOR IN SESSION BAR ==========
print("\n=== SESSION AUDIO LANGUAGE ===")

c = sr(c,
    """<div class="vt-session-bar-right"><div class="vt-session-bar-btn leave" onclick="vtLeaveSession()">Leave Session</div></div>""",
    """<div class="vt-session-bar-right"><div class="vt-session-lang" onclick="vtToggleLangDropdown('session')" title="Change audio language"><span class="vt-lang-flag">&#127468;&#127463;</span><span id="vt-session-lang-label">EN</span> <i class="fas fa-chevron-down" style="font-size:8px;opacity:.5"></i></div><div class="vt-session-bar-btn leave" onclick="vtLeaveSession()">Leave Session</div></div>""",
    "Session bar audio language indicator")

# ========== 5. ADD CAPTIONS ACTION TO SESSION ACTIONS ==========
print("\n=== CAPTION ACTION ===")

c = sr(c,
    """<div class="vt-session-action" onclick="vtSessionAction(this,'invite')"><i class="fas fa-user-plus"></i>Invite Friend</div>""",
    """<div class="vt-session-action" onclick="vtToggleCaptions(this)"><i class="fas fa-closed-captioning" id="vt-cc-icon"></i><span id="vt-cc-label">Captions</span></div><div class="vt-session-action" onclick="vtSessionAction(this,'invite')"><i class="fas fa-user-plus"></i>Invite Friend</div>""",
    "Add captions action button")

# ========== 6. ADD LANGUAGE PROMPT MODAL HTML ==========
print("\n=== LANGUAGE PROMPT MODAL ===")

# Add before closing </body> or at end of vtours section
c = sr(c,
    """  <!-- DASHBOARD SHOWCASE (TABBED) -->""",
    """  <!-- Language Selection Prompt -->
  <div class="vt-lang-prompt-overlay" id="vt-lang-prompt">
    <div class="vt-lang-prompt">
      <div class="vt-lang-prompt-icon">&#127760;</div>
      <h3>Choose Your Language</h3>
      <p>Select your preferred language for the V-Tours experience. You can change this anytime from the toolbar.</p>
      <div class="vt-lang-prompt-grid">
        <div class="vt-lang-prompt-item selected" data-lang="en" onclick="vtPromptSelectLang(this,'en')"><span class="vt-lang-flag">&#127468;&#127463;</span> English</div>
        <div class="vt-lang-prompt-item" data-lang="es" onclick="vtPromptSelectLang(this,'es')"><span class="vt-lang-flag">&#127466;&#127480;</span> Espa&ntilde;ol</div>
        <div class="vt-lang-prompt-item" data-lang="fr" onclick="vtPromptSelectLang(this,'fr')"><span class="vt-lang-flag">&#127467;&#127479;</span> Fran&ccedil;ais</div>
        <div class="vt-lang-prompt-item" data-lang="de" onclick="vtPromptSelectLang(this,'de')"><span class="vt-lang-flag">&#127465;&#127466;</span> Deutsch</div>
        <div class="vt-lang-prompt-item" data-lang="pt" onclick="vtPromptSelectLang(this,'pt')"><span class="vt-lang-flag">&#127463;&#127479;</span> Portugu&ecirc;s</div>
        <div class="vt-lang-prompt-item" data-lang="ja" onclick="vtPromptSelectLang(this,'ja')"><span class="vt-lang-flag">&#127471;&#127477;</span> &#26085;&#26412;&#35486;</div>
        <div class="vt-lang-prompt-item" data-lang="zh" onclick="vtPromptSelectLang(this,'zh')"><span class="vt-lang-flag">&#127464;&#127475;</span> &#20013;&#25991;</div>
        <div class="vt-lang-prompt-item" data-lang="hi" onclick="vtPromptSelectLang(this,'hi')"><span class="vt-lang-flag">&#127470;&#127475;</span> &#2361;&#2367;&#2344;&#2381;&#2342;&#2368;</div>
        <div class="vt-lang-prompt-item" data-lang="ar" onclick="vtPromptSelectLang(this,'ar')"><span class="vt-lang-flag">&#127480;&#127462;</span> &#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</div>
        <div class="vt-lang-prompt-item" data-lang="it" onclick="vtPromptSelectLang(this,'it')"><span class="vt-lang-flag">&#127470;&#127481;</span> Italiano</div>
      </div>
      <button class="vt-lang-prompt-confirm" id="vt-lang-confirm-btn" onclick="vtConfirmLangPrompt()"><i class="fas fa-check-circle" style="margin-right:6px"></i>Continue with English</button>
      <button class="vt-lang-prompt-skip" onclick="vtSkipLangPrompt()">Skip &mdash; use English</button>
    </div>
  </div>

  <!-- DASHBOARD SHOWCASE (TABBED) -->""",
    "Language prompt modal HTML")

# ========== 7. ADD LANGUAGE JS ==========
print("\n=== LANGUAGE JS ===")

lang_js = """
/* ═══════ LANGUAGE SELECTION ═══════ */
var vtLangData={
  en:{name:'English',flag:'\\u{1F1EC}\\u{1F1E7}',code:'EN'},
  es:{name:'Espa\\u00f1ol',flag:'\\u{1F1EA}\\u{1F1F8}',code:'ES'},
  fr:{name:'Fran\\u00e7ais',flag:'\\u{1F1EB}\\u{1F1F7}',code:'FR'},
  de:{name:'Deutsch',flag:'\\u{1F1E9}\\u{1F1EA}',code:'DE'},
  pt:{name:'Portugu\\u00eas',flag:'\\u{1F1E7}\\u{1F1F7}',code:'PT'},
  ja:{name:'\\u65E5\\u672C\\u8A9E',flag:'\\u{1F1EF}\\u{1F1F5}',code:'JA'},
  zh:{name:'\\u4E2D\\u6587',flag:'\\u{1F1E8}\\u{1F1F3}',code:'ZH'},
  hi:{name:'\\u0939\\u093F\\u0928\\u094D\\u0926\\u0940',flag:'\\u{1F1EE}\\u{1F1F3}',code:'HI'},
  ar:{name:'\\u0627\\u0644\\u0639\\u0631\\u0628\\u064A\\u0629',flag:'\\u{1F1F8}\\u{1F1E6}',code:'AR'},
  it:{name:'Italiano',flag:'\\u{1F1EE}\\u{1F1F9}',code:'IT'}
};
var vtCurrentLang='en';
var vtCaptionsOn=false;

function vtToggleLangDropdown(which){
  var ddId=which==='session'?'vt-exp-lang-dropdown':(which==='explorer'?'vt-exp-lang-dropdown':'vt-guide-lang-dropdown');
  var dd=document.getElementById(ddId);
  if(!dd)return;
  var isOpen=dd.classList.contains('open');
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
  if(!isOpen)dd.classList.add('open');
}

function vtSelectLang(e,lang,which){
  e.stopPropagation();
  var isAudio=lang.indexOf('-audio')>-1;
  var baseLang=lang.replace('-audio','');

  if(isAudio){
    vtToast('<i class="fas fa-headphones"></i> AI-translated audio switching to '+vtLangData[baseLang].name+'...');
    setTimeout(function(){vtToast('<i class="fas fa-check-circle"></i> Audio now in '+vtLangData[baseLang].name+' (AI-translated)')},1500);
    document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
    return;
  }

  vtCurrentLang=lang;
  var data=vtLangData[lang];if(!data)return;

  // Update all code displays
  var codes=['vt-exp-lang-code','vt-guide-lang-code','vt-session-lang-label'];
  codes.forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=data.code});

  // Update active states in all dropdowns
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(dd){
    dd.querySelectorAll('.vt-lang-option').forEach(function(opt){
      opt.classList.toggle('active',opt.getAttribute('data-lang')===lang);
    });
  });

  // Close dropdowns
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});

  // Save preference
  try{localStorage.setItem('vt-lang',lang)}catch(e){}

  vtToast('<i class="fas fa-language"></i> Language set to '+data.flag+' '+data.name);
}

// Close dropdowns when clicking outside
document.addEventListener('click',function(e){
  if(!e.target.closest('.vt-lang-btn'))document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
});

// Language prompt
var vtPromptSelectedLang='en';
function vtPromptSelectLang(el,lang){
  document.querySelectorAll('.vt-lang-prompt-item').forEach(function(i){i.classList.remove('selected')});
  el.classList.add('selected');
  vtPromptSelectedLang=lang;
  var data=vtLangData[lang];
  var btn=document.getElementById('vt-lang-confirm-btn');
  if(btn&&data)btn.innerHTML='<i class="fas fa-check-circle" style="margin-right:6px"></i>Continue with '+data.name;
}

function vtConfirmLangPrompt(){
  vtSelectLang({stopPropagation:function(){}},vtPromptSelectedLang,'explorer');
  vtCloseLangPrompt();
  try{localStorage.setItem('vt-lang-prompted','1')}catch(e){}
}

function vtSkipLangPrompt(){
  vtCloseLangPrompt();
  try{localStorage.setItem('vt-lang-prompted','1')}catch(e){}
}

function vtCloseLangPrompt(){
  var p=document.getElementById('vt-lang-prompt');
  if(p)p.classList.remove('open');
}

function vtShowLangPrompt(){
  try{if(localStorage.getItem('vt-lang-prompted'))return}catch(e){}
  var p=document.getElementById('vt-lang-prompt');
  if(p)setTimeout(function(){p.classList.add('open')},800);
}

// Captions toggle
function vtToggleCaptions(el){
  vtCaptionsOn=!vtCaptionsOn;
  var icon=document.getElementById('vt-cc-icon');
  var label=document.getElementById('vt-cc-label');
  if(vtCaptionsOn){
    if(el)el.classList.add('clicked');
    if(icon)icon.style.color='var(--orange)';
    if(label)label.textContent='CC On';
    vtToast('<i class="fas fa-closed-captioning"></i> Live captions enabled — '+vtLangData[vtCurrentLang].name);
  } else {
    if(icon)icon.style.color='';
    if(label)label.textContent='Captions';
    vtToast('<i class="fas fa-closed-captioning"></i> Live captions disabled');
  }
}

// Restore saved language on load
(function(){
  try{
    var saved=localStorage.getItem('vt-lang');
    if(saved&&vtLangData[saved]){
      vtCurrentLang=saved;
      var data=vtLangData[saved];
      ['vt-exp-lang-code','vt-guide-lang-code','vt-session-lang-label'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.textContent=data.code;
      });
      document.querySelectorAll('.vt-lang-dropdown .vt-lang-option').forEach(function(opt){
        opt.classList.toggle('active',opt.getAttribute('data-lang')===saved);
      });
    }
  }catch(e){}
})();
"""

# Insert the JS after the vtExpandSession block
c = sr(c,
    """/* ═══════ SIGNUP ═══════ */""",
    lang_js + """/* ═══════ SIGNUP ═══════ */""",
    "Language selection JS")

# ========== 8. TRIGGER PROMPT ON V-TOURS NAV ==========
print("\n=== TRIGGER PROMPT ON NAV ===")

c = sr(c,
    """if(id==='vtours'){
    try{var ytp=document.getElementById('vt-yt-player');if(ytp)ytp.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}','*')}catch(e){}
  }""",
    """if(id==='vtours'){
    try{var ytp=document.getElementById('vt-yt-player');if(ytp)ytp.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}','*')}catch(e){}
    vtShowLangPrompt();
  }""",
    "Trigger language prompt on V-Tours nav")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
