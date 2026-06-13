#!/usr/bin/env python3
"""
Fix:
1. Session bar language dropdown doesn't work (points to wrong element)
2. Session bar shows wrong flag (UK instead of US)
3. Default language should be English (clear any saved German)
4. Side panel clipping - needs proper overflow handling
5. Add a proper language dropdown inside the session bar
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

# ========== 1. FIX SESSION BAR - ADD DROPDOWN + US FLAG ==========
print("=== FIX SESSION BAR LANGUAGE ===")

c = sr(c,
    """<div class="vt-session-bar-right"><div class="vt-session-lang" onclick="vtToggleLangDropdown('session')" title="Change audio language"><span class="vt-lang-flag">&#127468;&#127463;</span><span id="vt-session-lang-label">EN</span> <i class="fas fa-chevron-down" style="font-size:8px;opacity:.5"></i></div><div class="vt-session-bar-btn leave" onclick="vtLeaveSession()">Leave Session</div></div>""",
    """<div class="vt-session-bar-right"><div class="vt-session-lang" onclick="vtToggleLangDropdown('session')" title="Change audio language"><span class="vt-lang-flag">&#127482;&#127480;</span><span id="vt-session-lang-label">EN</span> <i class="fas fa-chevron-down" style="font-size:8px;opacity:.5"></i><div class="vt-lang-dropdown" id="vt-session-lang-dropdown"><div class="vt-lang-dropdown-title">Language</div><div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','session')"><span class="vt-lang-flag">&#127482;&#127480;</span><span class="vt-lang-name">English</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="es" onclick="vtSelectLang(event,'es','session')"><span class="vt-lang-flag">&#127466;&#127480;</span><span class="vt-lang-name">Espa&ntilde;ol</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="fr" onclick="vtSelectLang(event,'fr','session')"><span class="vt-lang-flag">&#127467;&#127479;</span><span class="vt-lang-name">Fran&ccedil;ais</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="de" onclick="vtSelectLang(event,'de','session')"><span class="vt-lang-flag">&#127465;&#127466;</span><span class="vt-lang-name">Deutsch</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="pt" onclick="vtSelectLang(event,'pt','session')"><span class="vt-lang-flag">&#127463;&#127479;</span><span class="vt-lang-name">Portugu&ecirc;s</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="ja" onclick="vtSelectLang(event,'ja','session')"><span class="vt-lang-flag">&#127471;&#127477;</span><span class="vt-lang-name">&#26085;&#26412;&#35486;</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="zh" onclick="vtSelectLang(event,'zh','session')"><span class="vt-lang-flag">&#127464;&#127475;</span><span class="vt-lang-name">&#20013;&#25991;</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="hi" onclick="vtSelectLang(event,'hi','session')"><span class="vt-lang-flag">&#127470;&#127475;</span><span class="vt-lang-name">&#2361;&#2367;&#2344;&#2381;&#2342;&#2368;</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="ar" onclick="vtSelectLang(event,'ar','session')"><span class="vt-lang-flag">&#127480;&#127462;</span><span class="vt-lang-name">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</span><i class="fas fa-check vt-lang-check"></i></div><div class="vt-lang-option" data-lang="it" onclick="vtSelectLang(event,'it','session')"><span class="vt-lang-flag">&#127470;&#127481;</span><span class="vt-lang-name">Italiano</span><i class="fas fa-check vt-lang-check"></i></div></div></div><div class="vt-session-bar-btn leave" onclick="vtLeaveSession()">Leave Session</div></div>""",
    "Session bar: add dropdown + US flag")

# ========== 2. FIX DROPDOWN TOGGLE FOR SESSION ==========
print("\n=== FIX TOGGLE JS ===")

c = sr(c,
    """function vtToggleLangDropdown(which){
  var ddId=which==='session'?'vt-exp-lang-dropdown':(which==='explorer'?'vt-exp-lang-dropdown':'vt-guide-lang-dropdown');
  var dd=document.getElementById(ddId);
  if(!dd)return;
  var isOpen=dd.classList.contains('open');
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
  if(!isOpen)dd.classList.add('open');
}""",
    """function vtToggleLangDropdown(which){
  var ddId=which==='explorer'?'vt-exp-lang-dropdown':which==='guide'?'vt-guide-lang-dropdown':'vt-session-lang-dropdown';
  var dd=document.getElementById(ddId);
  if(!dd)return;
  var isOpen=dd.classList.contains('open');
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
  if(!isOpen)dd.classList.add('open');
}""",
    "Fix toggle to use correct dropdown ID for session")

# Close dropdowns on click outside - also handle session lang btn
c = sr(c,
    "if(!e.target.closest('.vt-lang-btn'))document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});",
    "if(!e.target.closest('.vt-lang-btn')&&!e.target.closest('.vt-session-lang'))document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});",
    "Also check session lang btn for click-outside")

# ========== 3. ADD CSS FOR SESSION LANG DROPDOWN POSITION ==========
print("\n=== SESSION LANG DROPDOWN CSS ===")

c = sr(c,
    '.vt-session-lang .vt-lang-flag{font-size:13px}',
    """.vt-session-lang .vt-lang-flag{font-size:13px}
.vt-session-lang{position:relative}
.vt-session-lang .vt-lang-dropdown{top:auto;bottom:calc(100% + 8px);right:0;left:auto}""",
    "Session lang dropdown opens upward")

# ========== 4. FIX SIDE PANEL CLIPPING ==========
print("\n=== FIX SIDE PANEL CLIPPING ===")

# The session side needs text to not overflow
c = sr(c,
    '.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.06);background:rgba(13,27,42,.6)}',
    '.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.06);background:rgba(13,27,42,.6);overflow:hidden;min-width:0}',
    "Side panel: overflow hidden + min-width 0")

# Chat title needs text-overflow
c = sr(c,
    ".vt-session-chat-title{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}",
    ".vt-session-chat-title{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;overflow:hidden}",
    "Chat title overflow hidden")

# Shop items need text-overflow too
shop_overflow = """
.vt-session-shop-item{overflow:hidden}
.vt-session-shop-item strong,.vt-session-shop-item small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
"""

c = sr(c,
    '.vt-session-shop-add{cursor:pointer;transition:all .25s}',
    shop_overflow + '.vt-session-shop-add{cursor:pointer;transition:all .25s}',
    "Shop items text overflow")

# ========== 5. ENSURE ENGLISH IS DEFAULT ==========
print("\n=== ENSURE ENGLISH DEFAULT ===")

# The restore function should not apply non-English if user hasn't explicitly chosen
# Actually the user DID choose German, so localStorage has it saved.
# The fix is: on the FIRST load of the new version, reset to English
# We can use a version key in localStorage

c = sr(c,
    """// Restore saved language on load
(function(){
  try{
    var saved=localStorage.getItem('vt-lang');
    if(saved&&vtLangData[saved]){
      vtCurrentLang=saved;
      var data=vtLangData[saved];
      setTimeout(function(){vtApplyTranslation(saved)},100);""",
    """// Restore saved language on load
(function(){
  try{
    var ver=localStorage.getItem('vt-lang-v');
    if(ver!=='2'){localStorage.removeItem('vt-lang');localStorage.setItem('vt-lang-v','2')}
    var saved=localStorage.getItem('vt-lang');
    if(saved&&vtLangData[saved]){
      vtCurrentLang=saved;
      var data=vtLangData[saved];
      setTimeout(function(){vtApplyTranslation(saved)},100);""",
    "Reset language to English for new version")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
