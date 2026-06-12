#!/usr/bin/env python3
"""Immersive 360° stream, clickable hotspots, expand fix, full interactivity."""

path = 'Design_Reference.html'
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# ═══════════════════════════════════════════════════════════════════
# 1. NEW CSS — immersive 360 stream, hotspots, bigger video, expand fix
# ═══════════════════════════════════════════════════════════════════
immersive_css = """
/* ======== IMMERSIVE 360 STREAM ======== */
.vt-session-video{min-height:380px!important;overflow:hidden;position:relative;cursor:grab}
.vt-session-video:active{cursor:grabbing}
.vt-modal .vt-session-video{min-height:480px!important}

.vt-360-scene{position:absolute;inset:0;overflow:hidden}
.vt-360-pano{position:absolute;width:300%;height:100%;top:0;left:0;animation:vtPanSlow 30s linear infinite;will-change:transform}
.vt-360-pano.paused{animation-play-state:paused}

/* Kayak / Blue Lagoon scene layers */
.vt-360-sky{position:absolute;inset:0;background:linear-gradient(180deg,#0a3d5c 0%,#1a7a9e 30%,#25a3c8 50%,#7ecce5 70%,#b8e6f5 100%)}
.vt-360-clouds{position:absolute;top:0;left:0;width:300%;height:40%;background:
  radial-gradient(ellipse 180px 60px at 8% 25%,rgba(255,255,255,.35),transparent),
  radial-gradient(ellipse 220px 50px at 25% 35%,rgba(255,255,255,.25),transparent),
  radial-gradient(ellipse 160px 40px at 45% 20%,rgba(255,255,255,.3),transparent),
  radial-gradient(ellipse 200px 55px at 65% 30%,rgba(255,255,255,.2),transparent),
  radial-gradient(ellipse 240px 45px at 85% 25%,rgba(255,255,255,.3),transparent),
  radial-gradient(ellipse 180px 50px at 110% 35%,rgba(255,255,255,.25),transparent),
  radial-gradient(ellipse 150px 40px at 135% 22%,rgba(255,255,255,.3),transparent),
  radial-gradient(ellipse 200px 55px at 155% 30%,rgba(255,255,255,.2),transparent);
  animation:vtPanSlow 30s linear infinite}
.vt-360-mountains{position:absolute;bottom:38%;left:0;width:300%;height:30%;background:
  linear-gradient(160deg,transparent 40%,#0b6b3a 40.5%,#0d7d45 45%,#0a5e30 50%,transparent 50.5%),
  linear-gradient(170deg,transparent 42%,#0a6838 42.5%,#0c7440 46%,#095a2d 48%,transparent 48.5%),
  linear-gradient(155deg,transparent 38%,#0d7d45 38.5%,#10925a 44%,#0b6b3a 47%,transparent 47.5%),
  linear-gradient(165deg,transparent 44%,#0b7040 44.5%,#0e8550 48%,#0a6034 50%,transparent 50.5%);
  background-size:33.33% 100%;animation:vtPanSlow 30s linear infinite}
.vt-360-water{position:absolute;bottom:0;left:0;width:300%;height:45%;background:linear-gradient(180deg,#0d8a6e 0%,#0f9e7f 20%,#12b892 40%,#15cca5 60%,#0d8a6e 80%,#0b7a60 100%);animation:vtPanSlow 30s linear infinite}
.vt-360-water-shimmer{position:absolute;bottom:0;left:0;width:300%;height:45%;background:
  radial-gradient(ellipse 120px 8px at 10% 30%,rgba(255,255,255,.25),transparent),
  radial-gradient(ellipse 80px 6px at 20% 50%,rgba(255,255,255,.2),transparent),
  radial-gradient(ellipse 150px 10px at 35% 35%,rgba(255,255,255,.15),transparent),
  radial-gradient(ellipse 100px 7px at 50% 55%,rgba(255,255,255,.22),transparent),
  radial-gradient(ellipse 130px 9px at 65% 40%,rgba(255,255,255,.18),transparent),
  radial-gradient(ellipse 90px 6px at 80% 60%,rgba(255,255,255,.25),transparent),
  radial-gradient(ellipse 110px 8px at 95% 45%,rgba(255,255,255,.2),transparent);
  animation:vtShimmer 4s ease-in-out infinite alternate,vtPanSlow 30s linear infinite}
@keyframes vtShimmer{0%{opacity:.6}100%{opacity:1}}
@keyframes vtPanSlow{0%{transform:translateX(0)}100%{transform:translateX(-33.33%)}}

.vt-360-trees{position:absolute;bottom:32%;left:0;width:300%;height:20%;background:
  radial-gradient(ellipse 40px 80px at 5% 90%,#085a30,transparent),
  radial-gradient(ellipse 35px 70px at 8% 85%,#0a6b3a,transparent),
  radial-gradient(ellipse 50px 90px at 15% 88%,#0d7d45,transparent),
  radial-gradient(ellipse 30px 60px at 18% 92%,#085a30,transparent),
  radial-gradient(ellipse 45px 85px at 30% 87%,#0b6b3a,transparent),
  radial-gradient(ellipse 55px 95px at 38% 85%,#0e8550,transparent),
  radial-gradient(ellipse 40px 75px at 50% 90%,#085a30,transparent),
  radial-gradient(ellipse 48px 88px at 60% 86%,#0d7d45,transparent),
  radial-gradient(ellipse 35px 65px at 70% 92%,#0a6b3a,transparent),
  radial-gradient(ellipse 50px 90px at 80% 87%,#0b7040,transparent),
  radial-gradient(ellipse 42px 78px at 90% 89%,#085a30,transparent);
  animation:vtPanSlow 30s linear infinite}

.vt-360-kayak{position:absolute;bottom:30%;left:50%;transform:translateX(-50%);width:140px;z-index:5;text-align:center;animation:vtKayakBob 3s ease-in-out infinite}
.vt-360-kayak-body{width:120px;height:18px;background:linear-gradient(180deg,#e67e22,#d35400);border-radius:50%;margin:0 auto;position:relative;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.vt-360-kayak-body::before{content:'';position:absolute;top:-24px;left:50%;transform:translateX(-50%);width:16px;height:28px;background:linear-gradient(180deg,#f39c12,#e67e22);border-radius:8px 8px 4px 4px}
.vt-360-kayak-paddle{position:absolute;top:-30px;left:30%;width:3px;height:50px;background:#8b6914;transform:rotate(-25deg);transform-origin:bottom center;animation:vtPaddle 2s ease-in-out infinite}
.vt-360-kayak-paddle::before,.vt-360-kayak-paddle::after{content:'';position:absolute;width:14px;height:6px;background:#a67c00;border-radius:3px}
.vt-360-kayak-paddle::before{top:0;left:-5px}
.vt-360-kayak-paddle::after{bottom:0;left:-5px}
@keyframes vtKayakBob{0%,100%{transform:translateX(-50%) translateY(0) rotate(-.5deg)}50%{transform:translateX(-50%) translateY(-6px) rotate(.5deg)}}
@keyframes vtPaddle{0%,100%{transform:rotate(-25deg)}50%{transform:rotate(25deg)}}

.vt-360-ripple{position:absolute;bottom:28%;left:50%;width:160px;height:12px;transform:translateX(-50%);border-radius:50%;border:1px solid rgba(255,255,255,.15);animation:vtRipple 2.5s ease-out infinite;opacity:0}
.vt-360-ripple:nth-child(2){animation-delay:.8s}
.vt-360-ripple:nth-child(3){animation-delay:1.6s}
@keyframes vtRipple{0%{width:140px;opacity:0;transform:translateX(-50%)}20%{opacity:.3}100%{width:300px;opacity:0;transform:translateX(-50%)}}

/* Hotspot markers */
.vt-hotspot{position:absolute;z-index:10;cursor:pointer;transition:transform .3s}
.vt-hotspot:hover{transform:scale(1.15)}
.vt-hotspot-dot{width:36px;height:36px;border-radius:50%;background:rgba(239,135,49,.85);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 4px 16px rgba(239,135,49,.5);animation:vtHotPulse 2s ease infinite;position:relative}
.vt-hotspot-dot::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(239,135,49,.4);animation:vtHotRing 2s ease infinite}
@keyframes vtHotPulse{0%,100%{box-shadow:0 4px 16px rgba(239,135,49,.5)}50%{box-shadow:0 4px 28px rgba(239,135,49,.8)}}
@keyframes vtHotRing{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.6);opacity:0}}
.vt-hotspot-label{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(0,0,0,.8);backdrop-filter:blur(8px);color:#fff;padding:6px 14px;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap;opacity:0;transition:all .3s;pointer-events:none}
.vt-hotspot-label small{display:block;color:var(--orange);font-size:10px;margin-top:2px}
.vt-hotspot:hover .vt-hotspot-label{opacity:1;bottom:calc(100% + 12px)}

.vt-hotspot-popup{position:absolute;z-index:20;background:rgba(0,0,0,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px;width:240px;box-shadow:0 20px 48px rgba(0,0,0,.4);opacity:0;transform:translateY(10px);pointer-events:none;transition:all .35s cubic-bezier(.25,.46,.45,.94)}
.vt-hotspot-popup.show{opacity:1;transform:translateY(0);pointer-events:auto}
.vt-hotspot-popup h4{color:#fff;font-size:14px;margin-bottom:4px}
.vt-hotspot-popup p{color:rgba(255,255,255,.6);font-size:11px;line-height:1.5;margin-bottom:12px}
.vt-hotspot-popup-price{font-size:18px;font-weight:800;color:var(--orange);margin-bottom:12px}
.vt-hotspot-popup-buy{width:100%;padding:10px;border-radius:10px;border:none;background:var(--orange);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .25s;font-family:inherit}
.vt-hotspot-popup-buy:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(239,135,49,.4)}
.vt-hotspot-popup-buy.bought{background:#22c55e!important}
.vt-hotspot-popup-close{position:absolute;top:8px;right:10px;color:rgba(255,255,255,.4);cursor:pointer;font-size:12px;transition:color .2s}
.vt-hotspot-popup-close:hover{color:#fff}

/* Scene switch buttons */
.vt-scene-switcher{position:absolute;top:12px;left:12px;z-index:15;display:flex;gap:6px}
.vt-scene-btn{padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;color:rgba(255,255,255,.7);background:rgba(0,0,0,.4);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .25s;text-transform:uppercase;letter-spacing:.5px}
.vt-scene-btn:hover{background:rgba(255,255,255,.15);color:#fff}
.vt-scene-btn.active{background:var(--orange);color:#fff;border-color:var(--orange)}

/* Live indicator */
.vt-live-indicator{position:absolute;top:12px;right:12px;z-index:15;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px}
.vt-live-indicator-dot{width:8px;height:8px;border-radius:50%;background:#ef4444;animation:vtRecPulse 1.5s ease infinite}
.vt-live-indicator-time{color:rgba(255,255,255,.6);font-variant-numeric:tabular-nums}

/* 360 drag indicator */
.vt-drag-hint{position:absolute;bottom:50px;left:50%;transform:translateX(-50%);z-index:15;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);padding:8px 20px;border-radius:20px;color:rgba(255,255,255,.8);font-size:11px;font-weight:600;display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .5s;pointer-events:none}
.vt-drag-hint.show{opacity:1}
.vt-drag-hint i{animation:vtDragSwipe 2s ease-in-out infinite}
@keyframes vtDragSwipe{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}

/* Expanded modal fixes */
.vt-modal .vt-dash-frame{height:100%!important}
.vt-modal .vt-dash-body{height:calc(100% - 42px)!important;overflow:auto}
.vt-modal .vt-dash-main{height:100%;overflow-y:auto}
.vt-modal .vt-session-video{min-height:480px!important}
.vt-modal .vt-hotspot-dot{width:44px;height:44px;font-size:18px}

/* Craft market scene */
.vt-360-market{position:absolute;inset:0;background:linear-gradient(180deg,#2c1810 0%,#4a2818 20%,#6b3a22 40%,#8b5230 60%,#a0694a 80%,#c4915e 100%)}
.vt-360-market-stalls{position:absolute;bottom:20%;left:0;width:300%;height:55%;background:
  linear-gradient(180deg,transparent 0%,rgba(139,82,48,.9) 40%),
  radial-gradient(ellipse 120px 140px at 8% 60%,#6b3a22,transparent),
  radial-gradient(ellipse 100px 120px at 22% 55%,#7a4428,transparent),
  radial-gradient(ellipse 130px 150px at 38% 58%,#5a3018,transparent),
  radial-gradient(ellipse 110px 130px at 55% 52%,#6b3a22,transparent),
  radial-gradient(ellipse 120px 140px at 72% 60%,#7a4428,transparent),
  radial-gradient(ellipse 100px 120px at 88% 55%,#5a3018,transparent);
  animation:vtPanSlow 30s linear infinite}
.vt-360-market-canopies{position:absolute;top:15%;left:0;width:300%;height:40%;background:
  radial-gradient(ellipse 150px 80px at 8% 50%,rgba(220,60,60,.6),transparent),
  radial-gradient(ellipse 140px 70px at 22% 45%,rgba(40,120,200,.5),transparent),
  radial-gradient(ellipse 160px 85px at 38% 55%,rgba(220,180,40,.55),transparent),
  radial-gradient(ellipse 130px 65px at 55% 48%,rgba(60,180,80,.5),transparent),
  radial-gradient(ellipse 150px 80px at 72% 52%,rgba(200,80,60,.55),transparent),
  radial-gradient(ellipse 140px 75px at 88% 46%,rgba(80,140,220,.5),transparent);
  animation:vtPanSlow 30s linear infinite}
.vt-360-market-lights{position:absolute;top:10%;left:0;width:300%;height:30%;background:
  radial-gradient(circle 4px at 5% 60%,rgba(255,220,100,.9),transparent),
  radial-gradient(circle 3px at 12% 40%,rgba(255,200,80,.7),transparent),
  radial-gradient(circle 5px at 20% 55%,rgba(255,220,100,.8),transparent),
  radial-gradient(circle 4px at 28% 45%,rgba(255,180,60,.7),transparent),
  radial-gradient(circle 3px at 35% 65%,rgba(255,220,100,.9),transparent),
  radial-gradient(circle 5px at 42% 35%,rgba(255,200,80,.8),transparent),
  radial-gradient(circle 4px at 50% 50%,rgba(255,220,100,.7),transparent),
  radial-gradient(circle 3px at 58% 60%,rgba(255,180,60,.8),transparent),
  radial-gradient(circle 5px at 65% 40%,rgba(255,220,100,.9),transparent),
  radial-gradient(circle 4px at 72% 55%,rgba(255,200,80,.7),transparent),
  radial-gradient(circle 3px at 80% 45%,rgba(255,220,100,.8),transparent),
  radial-gradient(circle 5px at 88% 60%,rgba(255,180,60,.9),transparent);
  animation:vtTwinkle 3s ease-in-out infinite alternate,vtPanSlow 30s linear infinite}
@keyframes vtTwinkle{0%{opacity:.7}100%{opacity:1}}
.vt-360-market-floor{position:absolute;bottom:0;left:0;width:300%;height:25%;background:linear-gradient(180deg,#8b5230 0%,#a0694a 30%,#b8815e 60%,#c4915e 100%);animation:vtPanSlow 30s linear infinite}
.vt-360-market-people{position:absolute;bottom:20%;left:0;width:300%;height:35%}
"""

css_marker = '/* ======== APPLE-STYLE EXPAND/POPOUT ======== */'
src = src.replace(css_marker, immersive_css + '\n' + css_marker)

# ═══════════════════════════════════════════════════════════════════
# 2. REPLACE the session video HTML with immersive 360° stream
# ═══════════════════════════════════════════════════════════════════
old_video_block = '''                      <div class="vt-session-video" id="vt-session-video" onclick="vtToggleVideo()" style="cursor:pointer">
                        <div class="vt-session-video-label">
                          <i class="fas fa-video" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>
                          Live Guide POV Stream<br><small style="opacity:.5">Click to simulate live feed</small>
                        </div>
                        <div class="vt-session-video-overlay">
                          <div class="vt-session-location" id="vt-session-loc">Port Antonio &bull; Portland &bull; Jamaica</div>
                          <div class="vt-session-viewers"><i class="fas fa-eye"></i> <span id="vt-viewer-count">247</span> watching</div>
                        </div>
                      </div>'''

new_video_block = '''                      <div class="vt-session-video" id="vt-session-video" style="min-height:380px">

                        <!-- Scene Switcher -->
                        <div class="vt-scene-switcher">
                          <div class="vt-scene-btn active" onclick="vtSwitchScene('kayak')"><i class="fas fa-water" style="margin-right:4px"></i> Blue Lagoon</div>
                          <div class="vt-scene-btn" onclick="vtSwitchScene('market')"><i class="fas fa-store" style="margin-right:4px"></i> Craft Market</div>
                        </div>

                        <!-- Live Indicator -->
                        <div class="vt-live-indicator"><div class="vt-live-indicator-dot"></div>LIVE <span class="vt-live-indicator-time" id="vt-live-timer">12:04</span></div>

                        <!-- KAYAK SCENE -->
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
                        </div>

                        <!-- CRAFT MARKET SCENE -->
                        <div class="vt-360-scene" id="vt-scene-market" style="display:none">
                          <div class="vt-360-pano">
                            <div class="vt-360-market"></div>
                            <div class="vt-360-market-stalls"></div>
                            <div class="vt-360-market-canopies"></div>
                            <div class="vt-360-market-lights"></div>
                            <div class="vt-360-market-floor"></div>
                          </div>

                          <!-- Market Hotspots -->
                          <div class="vt-hotspot" style="top:40%;left:18%" onclick="vtShowHotspot(event,'hs4')">
                            <div class="vt-hotspot-dot"><i class="fas fa-shopping-basket"></i></div>
                            <div class="vt-hotspot-label">Handwoven Market Basket<small>USD $28.00</small></div>
                          </div>
                          <div class="vt-hotspot" style="top:30%;left:50%" onclick="vtShowHotspot(event,'hs5')">
                            <div class="vt-hotspot-dot"><i class="fas fa-paint-brush"></i></div>
                            <div class="vt-hotspot-label">Hand-Painted Canvas Art<small>USD $85.00</small></div>
                          </div>
                          <div class="vt-hotspot" style="top:55%;left:72%" onclick="vtShowHotspot(event,'hs6')">
                            <div class="vt-hotspot-dot"><i class="fas fa-pepper-hot"></i></div>
                            <div class="vt-hotspot-label">Jamaican Spice Collection<small>USD $22.00</small></div>
                          </div>
                          <div class="vt-hotspot" style="top:45%;left:35%" onclick="vtShowHotspot(event,'hs7')">
                            <div class="vt-hotspot-dot"><i class="fas fa-gem"></i></div>
                            <div class="vt-hotspot-label">Larimar Stone Necklace<small>USD $65.00</small></div>
                          </div>
                        </div>

                        <!-- Hotspot Purchase Popup -->
                        <div class="vt-hotspot-popup" id="vt-hotspot-popup">
                          <div class="vt-hotspot-popup-close" onclick="vtCloseHotspot()"><i class="fas fa-times"></i></div>
                          <h4 id="vt-hs-name"></h4>
                          <p id="vt-hs-desc"></p>
                          <div class="vt-hotspot-popup-price" id="vt-hs-price"></div>
                          <button class="vt-hotspot-popup-buy" onclick="vtBuyHotspot()"><i class="fas fa-shopping-cart" style="margin-right:6px"></i>Buy Now</button>
                        </div>

                        <!-- Drag Hint -->
                        <div class="vt-drag-hint show" id="vt-drag-hint"><i class="fas fa-arrows-alt-h"></i> Drag to look around in 360&deg;</div>

                        <!-- Overlay -->
                        <div class="vt-session-video-overlay">
                          <div class="vt-session-location" id="vt-session-loc">Port Antonio &bull; Portland &bull; Jamaica</div>
                          <div class="vt-session-viewers"><i class="fas fa-eye"></i> <span id="vt-viewer-count">247</span> watching</div>
                        </div>
                      </div>'''

src = src.replace(old_video_block, new_video_block)

# ═══════════════════════════════════════════════════════════════════
# 3. REPLACE the full JS block with comprehensive interactive version
# ═══════════════════════════════════════════════════════════════════
old_js_start = '''<script>
/* ── Tab switching ── */'''
old_js_end = '''/* ── Go Live (guide) ── */
function vtGoLive(){
  var el=document.getElementById('vt-guide-sessions');
  if(el)el.textContent=parseInt(el.textContent)+1;
  vtToast('<i class="fas fa-broadcast-tower"></i> You are now live! 0 viewers watching...');
}

/* ── Apple-style expand/popout ── */'''

# Find and replace the entire script block
js_start_idx = src.index(old_js_start)
# Find the closing </script> after the start
js_end_idx = src.index('</script>', js_start_idx) + len('</script>')

new_full_js = '''<script>
/* ── Tab switching ── */
function vtSwitchTab(which){
  document.querySelectorAll('.vt-dash-tab').forEach(function(t){t.classList.remove('active')});
  document.querySelectorAll('.vt-dash-panel').forEach(function(p){p.classList.remove('active')});
  if(which==='explorer'){
    document.querySelectorAll('.vt-dash-tab')[0].classList.add('active');
    document.getElementById('vt-panel-explorer').classList.add('active');
  } else {
    document.querySelectorAll('.vt-dash-tab')[1].classList.add('active');
    document.getElementById('vt-panel-guide').classList.add('active');
  }
}

/* ── Toast ── */
var vtToastTimer;
function vtToast(msg){
  var t=document.getElementById('vt-toast');
  if(!t){t=document.createElement('div');t.id='vt-toast';t.className='vt-toast';document.body.appendChild(t)}
  t.innerHTML=msg;clearTimeout(vtToastTimer);t.classList.add('show');
  vtToastTimer=setTimeout(function(){t.classList.remove('show')},2800);
}

/* ── Explorer sidebar nav ── */
function vtExpNav(view,el){
  var sb=document.getElementById('vt-exp-sidebar');
  sb.querySelectorAll('a').forEach(function(a){a.classList.remove('active')});
  if(el)el.classList.add('active');
  document.querySelectorAll('#vt-exp-main .vt-dash-view').forEach(function(v){v.classList.remove('active')});
  var target=document.getElementById('vt-exp-'+view);
  if(target)target.classList.add('active');
}

/* ── Guide sidebar nav ── */
function vtGuideNav(view,el){
  var sb=document.getElementById('vt-guide-sidebar');
  sb.querySelectorAll('a').forEach(function(a){a.classList.remove('active')});
  if(el)el.classList.add('active');
  document.querySelectorAll('#vt-guide-main .vt-dash-view').forEach(function(v){v.classList.remove('active')});
  var target=document.getElementById('vt-guide-'+view);
  if(target)target.classList.add('active');
}

/* ── Join session ── */
var vtSessions={
  'blue-lagoon':{title:'Blue Lagoon Morning Walk',guide:'Marcus Thompson',loc:'Port Antonio &bull; Portland &bull; Jamaica',viewers:247},
  'kingston-jerk':{title:'Kingston Jerk and Ackee Class',guide:'Chef Anita Murray',loc:'Kingston &bull; St Andrew &bull; Jamaica',viewers:183}
};
function vtJoinSession(id){
  var s=vtSessions[id];if(!s)return;
  var el;
  el=document.getElementById('vt-session-title');if(el)el.textContent=s.title;
  el=document.getElementById('vt-session-guide');if(el)el.textContent=s.guide;
  el=document.getElementById('vt-session-loc');if(el)el.innerHTML=s.loc;
  el=document.getElementById('vt-viewer-count');if(el)el.textContent=s.viewers;
  el=document.getElementById('vt-chat-viewers');if(el)el.textContent=s.viewers+' watching';
  var sess=document.getElementById('vt-active-session');
  if(sess)sess.scrollIntoView({behavior:'smooth',block:'center'});
  vtToast('<i class="fas fa-broadcast-tower"></i> Joined: '+s.title);
  vtStartStream();
}

/* ── Viewer count animation ── */
var vtViewerInterval;
function vtAnimateViewers(){
  clearInterval(vtViewerInterval);
  vtViewerInterval=setInterval(function(){
    var el=document.getElementById('vt-viewer-count');if(!el)return;
    var v=parseInt(el.textContent)||247;
    v+=Math.floor(Math.random()*7)-3;
    if(v<200)v=200;if(v>400)v=400;
    el.textContent=v;
    var cv=document.getElementById('vt-chat-viewers');if(cv)cv.textContent=v+' watching';
  },2500);
}

/* ── Live timer ── */
var vtTimerInterval;
function vtStartTimer(){
  clearInterval(vtTimerInterval);
  var mins=12,secs=4;
  vtTimerInterval=setInterval(function(){
    secs++;if(secs>=60){secs=0;mins++}
    var el=document.getElementById('vt-live-timer');
    if(el)el.textContent=(mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
  },1000);
}

/* ── Start/stop stream ── */
var vtStreamActive=false;
function vtStartStream(){
  vtStreamActive=true;vtAnimateViewers();vtStartTimer();
  var hint=document.getElementById('vt-drag-hint');
  if(hint){hint.classList.add('show');setTimeout(function(){hint.classList.remove('show')},4000)}
  vtAutoChat();
}
function vtLeaveSession(){
  vtStreamActive=false;
  clearInterval(vtViewerInterval);clearInterval(vtTimerInterval);clearInterval(vtAutoChatInterval);
  vtToast('<i class="fas fa-sign-out-alt"></i> Session ended. Thanks for watching!');
}

/* ── Auto chat messages ── */
var vtAutoChatInterval;
var vtAutoChatMsgs=[
  {a:'K',m:'This is absolutely stunning!'},
  {a:'L',m:'Can you show the blue water up close?'},
  {a:'D',m:'Just bought the spice collection!'},
  {a:'A',m:'How deep is the lagoon?'},
  {a:'T',m:'I visited Jamaica last year, brings back memories'},
  {a:'N',m:'The guide is so knowledgeable'},
  {a:'P',m:'Adding this to my bucket list'},
  {a:'M',m:'That basket is gorgeous, purchasing now!',guide:true},
  {a:'R',m:'Best $42 I ever spent'},
  {a:'E',m:'Can you turn the camera to the left?'},
  {a:'W',m:'The colors are unreal!'},
  {a:'B',m:'How do I book a private session?'},
  {a:'M',m:'Great question! I will show you the reef next.',guide:true},
  {a:'C',m:'Wow I can almost feel the breeze'},
  {a:'H',m:'Just invited my friend to join!'}
];
function vtAutoChat(){
  clearInterval(vtAutoChatInterval);
  var i=0;
  vtAutoChatInterval=setInterval(function(){
    if(!vtStreamActive)return;
    var box=document.getElementById('vt-chat-messages');if(!box)return;
    var msg=vtAutoChatMsgs[i%vtAutoChatMsgs.length];
    var cls=msg.guide?'vt-session-chat-avatar guide':'vt-session-chat-avatar';
    box.innerHTML+='<div class="vt-session-chat-msg"><div class="'+cls+'">'+msg.a+'</div><div class="vt-session-chat-text">'+msg.m+'</div></div>';
    box.scrollTop=box.scrollHeight;
    i++;
  },3500+Math.random()*2000);
}

/* ── Session action buttons ── */
function vtSessionAction(el,type){
  el.classList.add('clicked');setTimeout(function(){el.classList.remove('clicked')},500);
  var msgs={
    'shop':'<i class="fas fa-shopping-bag"></i> Click the orange hotspots on the stream to purchase items!',
    'capture':'<i class="fas fa-camera"></i> Screenshot captured and saved to your gallery!',
    'point':'<i class="fas fa-hand-pointer"></i> Point mode active! Click anywhere on the stream to direct the guide.',
    'invite':'<i class="fas fa-user-plus"></i> Share link copied! Send it to a friend to join your session.'
  };
  vtToast(msgs[type]||'Action triggered');
}

/* ── Live chat send ── */
var vtBotReplies=['Amazing view!','How much is that?','I want to visit Jamaica so badly','This is incredible technology','Can the guide show us the beach?','Wow, the water is so blue!','Adding that to my wishlist','Best virtual tour ever','Is that a hummingbird?','The colors are breathtaking','Just bought the basket!','Guide, can you go closer?','This is the future of travel'];
function vtSendChat(){
  var inp=document.getElementById('vt-chat-input');var msg=inp.value.trim();if(!msg)return;
  var box=document.getElementById('vt-chat-messages');
  box.innerHTML+='<div class="vt-session-chat-msg"><div class="vt-session-chat-avatar" style="background:var(--orange)">Y</div><div class="vt-session-chat-text">'+msg.replace(/</g,'&lt;')+'</div></div>';
  inp.value='';box.scrollTop=box.scrollHeight;
  setTimeout(function(){
    var reply=vtBotReplies[Math.floor(Math.random()*vtBotReplies.length)];
    var avatars=['K','L','D','A','T','N'];var av=avatars[Math.floor(Math.random()*avatars.length)];
    box.innerHTML+='<div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">'+av+'</div><div class="vt-session-chat-text">'+reply+'</div></div>';
    box.scrollTop=box.scrollHeight;
  },800+Math.random()*1200);
}

/* ── Add to cart ── */
function vtAddToCart(el,name){
  el.textContent='Added';el.classList.add('added');
  var c=document.getElementById('vt-exp-items');if(c){c.textContent=parseInt(c.textContent)+1}
  vtToast('<i class="fas fa-check-circle"></i> '+name+' added to cart');
  setTimeout(function(){el.textContent='Add';el.classList.remove('added')},2500);
}

/* ── Go Live (guide) ── */
function vtGoLive(){
  var el=document.getElementById('vt-guide-sessions');
  if(el)el.textContent=parseInt(el.textContent)+1;
  vtToast('<i class="fas fa-broadcast-tower"></i> You are now live! Viewers joining...');
}

/* ═══════ 360° SCENE SWITCHING ═══════ */
function vtSwitchScene(scene){
  document.querySelectorAll('.vt-scene-btn').forEach(function(b){b.classList.remove('active')});
  document.querySelectorAll('.vt-360-scene').forEach(function(s){s.style.display='none'});
  if(scene==='kayak'){
    document.querySelectorAll('.vt-scene-btn')[0].classList.add('active');
    document.getElementById('vt-scene-kayak').style.display='block';
    var loc=document.getElementById('vt-session-loc');if(loc)loc.innerHTML='Port Antonio &bull; Portland &bull; Jamaica';
  } else {
    document.querySelectorAll('.vt-scene-btn')[1].classList.add('active');
    document.getElementById('vt-scene-market').style.display='block';
    var loc=document.getElementById('vt-session-loc');if(loc)loc.innerHTML='Falmouth &bull; Trelawny &bull; Jamaica';
  }
  vtToast('<i class="fas fa-sync-alt"></i> Scene: '+(scene==='kayak'?'Blue Lagoon Kayak':'Falmouth Craft Market'));
}

/* ═══════ HOTSPOT PURCHASE SYSTEM ═══════ */
var vtHotspotData={
  hs1:{name:'Blue Mahoe Seedling',desc:'Grow Jamaica\\'s national tree at home. Shipped as a living seedling in eco-packaging with care instructions.',price:'USD $35.00',priceNum:35},
  hs2:{name:'Portland Parish T-Shirt',desc:'Locally screen-printed cotton tee featuring Portland\\'s iconic Blue Lagoon and Rio Grande. Limited run.',price:'USD $28.00',priceNum:28},
  hs3:{name:'Photo Print - This Moment',desc:'High-resolution print of this exact frame from the guide\\'s camera. Shipped on gallery-grade paper.',price:'USD $15.00',priceNum:15},
  hs4:{name:'Handwoven Market Basket',desc:'Traditional Jamaican wicker basket handcrafted by local artisans in Falmouth. Each one is unique.',price:'USD $28.00',priceNum:28},
  hs5:{name:'Hand-Painted Canvas Art',desc:'Original acrylic painting by a Falmouth market artist. Caribbean street scene on 16x20 stretched canvas.',price:'USD $85.00',priceNum:85},
  hs6:{name:'Jamaican Spice Collection',desc:'Gift box with jerk seasoning, pimento, allspice, scotch bonnet sauce, and Blue Mountain coffee.',price:'USD $22.00',priceNum:22},
  hs7:{name:'Larimar Stone Necklace',desc:'Genuine Caribbean larimar pendant on sterling silver chain. Handset by a Jamaican jeweller.',price:'USD $65.00',priceNum:65}
};
var vtCurrentHotspot=null;
function vtShowHotspot(e,id){
  e.stopPropagation();
  var d=vtHotspotData[id];if(!d)return;
  vtCurrentHotspot=id;
  document.getElementById('vt-hs-name').textContent=d.name;
  document.getElementById('vt-hs-desc').textContent=d.desc;
  document.getElementById('vt-hs-price').textContent=d.price;
  var popup=document.getElementById('vt-hotspot-popup');
  var btn=popup.querySelector('.vt-hotspot-popup-buy');
  btn.innerHTML='<i class="fas fa-shopping-cart" style="margin-right:6px"></i>Buy Now';
  btn.classList.remove('bought');
  popup.style.top=(parseInt(e.target.closest('.vt-hotspot').style.top)||40)+'%';
  popup.style.left=Math.min(60,Math.max(5,(parseInt(e.target.closest('.vt-hotspot').style.left)||50)-5))+'%';
  popup.classList.add('show');
}
function vtCloseHotspot(){document.getElementById('vt-hotspot-popup').classList.remove('show');vtCurrentHotspot=null}
function vtBuyHotspot(){
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
}

/* ═══════ 360° DRAG TO PAN ═══════ */
(function(){
  var dragging=false,startX=0,scrollLeft=0;
  document.addEventListener('mousedown',function(e){
    var vid=e.target.closest('.vt-session-video');
    if(!vid||e.target.closest('.vt-hotspot')||e.target.closest('.vt-hotspot-popup')||e.target.closest('.vt-scene-btn'))return;
    dragging=true;startX=e.pageX;
    var panos=vid.querySelectorAll('.vt-360-pano');
    if(panos.length)scrollLeft=parseFloat(getComputedStyle(panos[0]).transform.split(',')[4])||0;
    panos.forEach(function(p){p.classList.add('paused')});
    var hint=document.getElementById('vt-drag-hint');if(hint)hint.classList.remove('show');
  });
  document.addEventListener('mousemove',function(e){
    if(!dragging)return;
    var dx=e.pageX-startX;
    var vid=document.getElementById('vt-session-video');if(!vid)return;
    vid.querySelectorAll('.vt-360-pano').forEach(function(p){
      p.style.transform='translateX('+(scrollLeft+dx)+'px)';
    });
  });
  document.addEventListener('mouseup',function(){
    if(!dragging)return;dragging=false;
    var vid=document.getElementById('vt-session-video');if(!vid)return;
    vid.querySelectorAll('.vt-360-pano').forEach(function(p){
      p.classList.remove('paused');p.style.transform='';
    });
  });
})();

/* ═══════ APPLE-STYLE EXPAND ═══════ */
function vtExpandDash(which){
  var overlay=document.getElementById('vt-modal-overlay');
  var modal=document.getElementById('vt-modal');
  if(modal.classList.contains('open')){vtCollapseDash();return}
  var frame=document.getElementById(which==='explorer'?'vt-explorer-frame':'vt-guide-frame');
  if(!frame)return;
  var content=document.getElementById('vt-modal-content');
  content.innerHTML=frame.outerHTML;
  /* Remove ID from clone to avoid duplicates */
  content.firstChild.removeAttribute('id');
  /* Re-wire all onclick handlers */
  content.querySelectorAll('[onclick]').forEach(function(el){
    var fn=el.getAttribute('onclick');
    el.setAttribute('onclick',fn);
  });
  overlay.classList.add('open');modal.classList.add('open');
  document.body.style.overflow='hidden';
  vtStartStream();
}
function vtCollapseDash(){
  document.getElementById('vt-modal-overlay').classList.remove('open');
  document.getElementById('vt-modal').classList.remove('open');
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')vtCollapseDash()});

/* ═══════ SIGNUP ═══════ */
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

/* ═══════ AUTO-START STREAM ON PAGE LOAD ═══════ */
vtStartStream();
</script>'''

src = src[:js_start_idx] + new_full_js + src[js_end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done: Immersive 360° stream, hotspots, expand fix, full interactivity.')
