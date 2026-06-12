#!/usr/bin/env python3
"""Update V-Tours: rename title, add Apple-style expand, create account section."""

path = 'Design_Reference.html'
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. Change title ───────────────────────────────────────────────
src = src.replace(
    '<span class="sec-pre">Platform Preview</span>\n        <h2 class="sec-title">See the V-Tours Experience</h2>\n        <p class="sec-sub center">Click below to explore both sides of the platform: the Explorer view for guests, and the Guide Portal for tour operators.</p>',
    '<span class="sec-pre">V-Tours</span>\n        <h2 class="sec-title">Coming this Summer 2026</h2>\n        <p class="sec-sub center">Explore both sides of the platform below. Click any element to interact, or expand to full screen for the complete experience.</p>'
)

# ── 2. Add expand buttons to each dashboard frame topbar ───────────
# Explorer topbar
src = src.replace(
    '''<div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Explorer Portal</div>
          </div>''',
    '''<div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Explorer Portal</div>
            <div class="vt-expand-btn" onclick="vtExpandDash('explorer')" title="Expand to full screen"><i class="fas fa-expand"></i></div>
          </div>'''
)

# Guide topbar
src = src.replace(
    '''<div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Guide Portal</div>
          </div>''',
    '''<div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Guide Portal</div>
            <div class="vt-expand-btn" onclick="vtExpandDash('guide')" title="Expand to full screen"><i class="fas fa-expand"></i></div>
          </div>'''
)

# ── 3. Add Create Account section after the tabbed section close ───
account_section = '''
  <!-- CREATE ACCOUNT -->
  <section class="vt-sec" id="vt-signup-section">
    <div class="vt-wrap">
      <div class="sec-head center reveal">
        <span class="sec-pre">Get Early Access</span>
        <h2 class="sec-title">Create Your V-Tours Account</h2>
        <p class="sec-sub center">Be among the first to experience live virtual tours this summer. Sign up as an Explorer to join sessions, or register as a Guide to host them.</p>
      </div>
      <div class="vt-signup-wrap reveal">
        <div class="vt-signup-toggle">
          <div class="vt-signup-toggle-btn active" onclick="vtSignupToggle('explorer')"><i class="fas fa-compass"></i> Explorer</div>
          <div class="vt-signup-toggle-btn" onclick="vtSignupToggle('guide')"><i class="fas fa-user-tie"></i> Guide</div>
        </div>
        <div class="vt-signup-card" id="vt-signup-explorer">
          <div class="vt-signup-card-header">
            <div class="vt-signup-icon"><i class="fas fa-compass"></i></div>
            <h3>Explorer Account</h3>
            <p>Browse and join live virtual tours from anywhere in the world</p>
          </div>
          <form class="vt-signup-form" onsubmit="vtCreateAccount(event,'explorer')">
            <div class="vt-signup-row">
              <div class="vt-signup-field"><label>First Name</label><input type="text" placeholder="Sarah" required></div>
              <div class="vt-signup-field"><label>Last Name</label><input type="text" placeholder="Anderson" required></div>
            </div>
            <div class="vt-signup-field"><label>Email Address</label><input type="email" placeholder="sarah@example.com" required></div>
            <div class="vt-signup-field"><label>Password</label><input type="password" placeholder="Min 8 characters" required minlength="8"></div>
            <div class="vt-signup-field"><label>Interests</label>
              <div class="vt-signup-tags">
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-landmark"></i> Culture</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-shopping-bag"></i> Shopping</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-utensils"></i> Food</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-palette"></i> Learning</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-mountain"></i> Nature</span>
              </div>
            </div>
            <button type="submit" class="vt-signup-btn"><i class="fas fa-rocket"></i> Join the Waitlist</button>
            <p class="vt-signup-note">Free to join. You will be notified when V-Tours launches Summer 2026.</p>
          </form>
        </div>
        <div class="vt-signup-card" id="vt-signup-guide" style="display:none">
          <div class="vt-signup-card-header">
            <div class="vt-signup-icon guide"><i class="fas fa-user-tie"></i></div>
            <h3>Guide Account</h3>
            <p>Host live virtual tours and earn from your expertise</p>
          </div>
          <form class="vt-signup-form" onsubmit="vtCreateAccount(event,'guide')">
            <div class="vt-signup-row">
              <div class="vt-signup-field"><label>First Name</label><input type="text" placeholder="Marcus" required></div>
              <div class="vt-signup-field"><label>Last Name</label><input type="text" placeholder="Thompson" required></div>
            </div>
            <div class="vt-signup-field"><label>Email Address</label><input type="email" placeholder="marcus@example.com" required></div>
            <div class="vt-signup-field"><label>Password</label><input type="password" placeholder="Min 8 characters" required minlength="8"></div>
            <div class="vt-signup-row">
              <div class="vt-signup-field"><label>Location</label><input type="text" placeholder="Portland, Jamaica" required></div>
              <div class="vt-signup-field"><label>Years Experience</label><input type="number" placeholder="5" min="0" required></div>
            </div>
            <div class="vt-signup-field"><label>Tour Categories</label>
              <div class="vt-signup-tags">
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-landmark"></i> Culture</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-shopping-bag"></i> Shopping</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-utensils"></i> Food</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-palette"></i> Learning</span>
                <span class="vt-signup-tag" onclick="this.classList.toggle('selected')"><i class="fas fa-mountain"></i> Nature</span>
              </div>
            </div>
            <div class="vt-signup-field"><label>Tell us about your tours</label><textarea placeholder="Describe the experiences you would like to offer..." rows="3"></textarea></div>
            <button type="submit" class="vt-signup-btn guide"><i class="fas fa-paper-plane"></i> Apply as Guide</button>
            <p class="vt-signup-note">Applications reviewed within 48 hours. Guides earn 80% of session revenue.</p>
          </form>
        </div>
      </div>
    </div>
  </section>

'''

# Insert after the dashboard section closes, before DEVICE TIERS
src = src.replace('  <!-- DEVICE TIERS -->', account_section + '  <!-- DEVICE TIERS -->')

# ── 4. Add CSS for expand modal, create account, and refinements ──
expand_css = """
/* ======== APPLE-STYLE EXPAND/POPOUT ======== */
.vt-expand-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;font-size:13px;color:rgba(255,255,255,.7)}
.vt-expand-btn:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.1)}

.vt-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:10000;opacity:0;pointer-events:none;transition:opacity .4s cubic-bezier(.25,.46,.45,.94)}
.vt-modal-overlay.open{opacity:1;pointer-events:auto}

.vt-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.92);width:calc(100vw - 48px);max-width:1400px;height:calc(100vh - 48px);max-height:920px;z-index:10001;border-radius:20px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06);opacity:0;pointer-events:none;transition:all .5s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column;background:#f0f2f5}
.vt-modal.open{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}

.vt-modal .vt-dash-frame{border-radius:0!important;border:none!important;box-shadow:none!important;height:100%;display:flex;flex-direction:column}
.vt-modal .vt-dash-body{flex:1;overflow:auto}
.vt-modal .vt-dash-main{overflow-y:auto;padding-bottom:40px}
.vt-modal .vt-session-video{min-height:320px}
.vt-modal .vt-live-grid{grid-template-columns:repeat(3,1fr)}
.vt-modal .vt-expand-btn i::before{content:"\\f066"}

.vt-modal-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10002;transition:all .25s;color:#fff;font-size:14px}
.vt-modal-close:hover{background:rgba(255,255,255,.2);transform:scale(1.1)}

body.theme-night .vt-modal{background:#0d1b2a}

/* ======== CREATE ACCOUNT SECTION ======== */
.vt-signup-wrap{max-width:560px;margin:0 auto}
.vt-signup-toggle{display:flex;justify-content:center;gap:8px;margin-bottom:32px;background:#f0f2f5;border-radius:14px;padding:4px}
.vt-signup-toggle-btn{flex:1;padding:12px 24px;border-radius:11px;text-align:center;font-size:14px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.25,.46,.45,.94);color:#617087;display:flex;align-items:center;justify-content:center;gap:8px}
.vt-signup-toggle-btn:hover{color:var(--navy)}
.vt-signup-toggle-btn.active{background:#fff;color:var(--navy);box-shadow:0 2px 12px rgba(0,0,0,.08)}
.vt-signup-toggle-btn i{font-size:15px}

.vt-signup-card{background:#fff;border-radius:24px;border:1px solid rgba(0,0,0,.06);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.06);animation:vtFadeIn .4s ease}
.vt-signup-card-header{text-align:center;padding:40px 30px 24px;background:linear-gradient(135deg,#063a63 0%,#0d5371 50%,#1a7a9e 100%);color:#fff}
.vt-signup-icon{width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,.12);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px;color:#fff;border:1px solid rgba(255,255,255,.15)}
.vt-signup-icon.guide{background:rgba(239,135,49,.2);border-color:rgba(239,135,49,.3)}
.vt-signup-card-header h3{font-family:'Playfair Display',serif;font-size:24px;margin-bottom:8px}
.vt-signup-card-header p{font-size:14px;color:rgba(255,255,255,.7)}

.vt-signup-form{padding:32px 30px 28px}
.vt-signup-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.vt-signup-field{margin-bottom:20px}
.vt-signup-field label{display:block;font-size:12px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.vt-signup-field input,.vt-signup-field textarea{width:100%;padding:14px 18px;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;font-size:14px;font-family:inherit;background:#fafbfc;transition:all .25s;outline:none;box-sizing:border-box;resize:none}
.vt-signup-field input:focus,.vt-signup-field textarea:focus{border-color:var(--orange);background:#fff;box-shadow:0 0 0 4px rgba(239,135,49,.08)}

.vt-signup-tags{display:flex;flex-wrap:wrap;gap:8px}
.vt-signup-tag{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;font-size:12px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#617087;cursor:pointer;transition:all .25s;user-select:none}
.vt-signup-tag:hover{border-color:var(--orange);color:var(--navy)}
.vt-signup-tag.selected{background:var(--orange);color:#fff;border-color:var(--orange)}
.vt-signup-tag.selected i{color:#fff}
.vt-signup-tag i{font-size:11px;color:var(--orange);transition:color .25s}

.vt-signup-btn{width:100%;padding:16px 32px;border:none;border-radius:14px;background:linear-gradient(135deg,var(--navy),#0d5371);color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .35s cubic-bezier(.25,.46,.45,.94);display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px}
.vt-signup-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(6,58,99,.3)}
.vt-signup-btn:active{transform:translateY(0)}
.vt-signup-btn.guide{background:linear-gradient(135deg,var(--orange),#ff8d47)}
.vt-signup-btn.guide:hover{box-shadow:0 12px 32px rgba(239,135,49,.35)}
.vt-signup-btn.success{background:#22c55e!important;pointer-events:none}

.vt-signup-note{text-align:center;font-size:12px;color:#94a3b8;margin-top:16px;line-height:1.6}

body.theme-night .vt-signup-toggle{background:#0d1b2a}
body.theme-night .vt-signup-toggle-btn{color:rgba(255,255,255,.5)}
body.theme-night .vt-signup-toggle-btn.active{background:rgba(255,255,255,.08);color:#fff}
body.theme-night .vt-signup-card{background:#0d1b2a;border-color:rgba(255,255,255,.06)}
body.theme-night .vt-signup-field label{color:rgba(255,255,255,.7)}
body.theme-night .vt-signup-field input,body.theme-night .vt-signup-field textarea{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:#fff}
body.theme-night .vt-signup-tag{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.6)}

@media(max-width:768px){
  .vt-modal{width:100vw;height:100vh;max-width:100vw;max-height:100vh;border-radius:0;top:0;left:0;transform:translateY(20px);transform-origin:center}
  .vt-modal.open{transform:translateY(0)}
  .vt-modal .vt-live-grid{grid-template-columns:1fr}
  .vt-signup-row{grid-template-columns:1fr}
}
"""

css_marker = '/* ======== V-TOURS DASHBOARD TABS ======== */'
src = src.replace(css_marker, expand_css + '\n' + css_marker)

# ── 5. Add modal overlay div and replace JS block ─────────────────
# Add modal overlay before the script tag
src = src.replace(
    '\n<script>\n/* ── Tab switching ── */',
    '\n<div class="vt-modal-overlay" id="vt-modal-overlay" onclick="vtCollapseDash()"></div>\n<div class="vt-modal" id="vt-modal"><div class="vt-modal-close" onclick="vtCollapseDash()"><i class="fas fa-times"></i></div><div id="vt-modal-content"></div></div>\n\n<script>\n/* ── Tab switching ── */'
)

# Replace the entire script block
old_script_end = '''/* ── Go Live (guide) ── */
function vtGoLive(){
  var el=document.getElementById('vt-guide-sessions');
  if(el)el.textContent=parseInt(el.textContent)+1;
  vtToast('<i class="fas fa-broadcast-tower"></i> You are now live! 0 viewers watching...');
}
</script>'''

new_script_end = r'''/* ── Go Live (guide) ── */
function vtGoLive(){
  var el=document.getElementById('vt-guide-sessions');
  if(el)el.textContent=parseInt(el.textContent)+1;
  vtToast('<i class="fas fa-broadcast-tower"></i> You are now live! 0 viewers watching...');
}

/* ── Apple-style expand/popout ── */
var vtExpandedSource=null;
function vtExpandDash(which){
  if(document.getElementById('vt-modal').classList.contains('open')){vtCollapseDash();return}
  var frame=document.getElementById(which==='explorer'?'vt-explorer-frame':'vt-guide-frame');
  if(!frame)return;
  vtExpandedSource=frame;
  var modal=document.getElementById('vt-modal');
  var content=document.getElementById('vt-modal-content');
  content.innerHTML='';
  var clone=frame.cloneNode(true);
  clone.removeAttribute('id');
  /* Re-wire onclick handlers on the clone */
  clone.querySelectorAll('[onclick]').forEach(function(el){
    var fn=el.getAttribute('onclick');
    el.removeAttribute('onclick');
    el.addEventListener('click',function(e){
      try{(new Function('event',fn)).call(el,e)}catch(err){}
    });
  });
  clone.querySelectorAll('form').forEach(function(f){
    var fn=f.getAttribute('onsubmit');
    if(fn){f.removeAttribute('onsubmit');f.addEventListener('submit',function(e){try{(new Function('event',fn)).call(f,e)}catch(err){}})}
  });
  content.appendChild(clone);
  document.getElementById('vt-modal-overlay').classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow='hidden';
}
function vtCollapseDash(){
  document.getElementById('vt-modal-overlay').classList.remove('open');
  document.getElementById('vt-modal').classList.remove('open');
  document.body.style.overflow='';
  vtExpandedSource=null;
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')vtCollapseDash()});

/* ── Signup toggle ── */
function vtSignupToggle(type){
  document.querySelectorAll('.vt-signup-toggle-btn').forEach(function(b){b.classList.remove('active')});
  if(type==='explorer'){
    document.querySelectorAll('.vt-signup-toggle-btn')[0].classList.add('active');
    document.getElementById('vt-signup-explorer').style.display='block';
    document.getElementById('vt-signup-guide').style.display='none';
  } else {
    document.querySelectorAll('.vt-signup-toggle-btn')[1].classList.add('active');
    document.getElementById('vt-signup-explorer').style.display='none';
    document.getElementById('vt-signup-guide').style.display='block';
  }
}

/* ── Create Account ── */
function vtCreateAccount(e,type){
  e.preventDefault();
  var btn=e.target.querySelector('.vt-signup-btn');
  var orig=btn.innerHTML;
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Creating account...';
  btn.style.pointerEvents='none';
  setTimeout(function(){
    btn.classList.add('success');
    btn.innerHTML='<i class="fas fa-check-circle"></i> '+(type==='explorer'?'You are on the waitlist!':'Application submitted!');
    vtToast('<i class="fas fa-check-circle"></i> '+(type==='explorer'?'Welcome aboard! You will be notified at launch.':'Guide application received! Review within 48 hours.'));
    setTimeout(function(){btn.innerHTML=orig;btn.classList.remove('success');btn.style.pointerEvents=''},4000);
  },1800);
}
</script>'''

src = src.replace(old_script_end, new_script_end)

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done: Title updated, expand/popout added, create account section added.')
