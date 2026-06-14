#!/usr/bin/env python3
"""
Add 10 next-gen 2040 features to V-Tours with Apple-style UI:
1. AI Guide Clone (Guide Portal)
2. Point & Identify (Session)
3. Mood-Adaptive Tours (Guide Portal - enhance Sentiment)
4. Spatial Audio Zones (Session)
5. Weather Sync (Session)
6. Haptic Moments (Session)
7. Group Watch Rooms (Explorer Portal)
8. NFT Stamps (Explorer Portal - enhance Passport)
9. Live Auction Hotspots (Session)
10. Guide Splits (Guide Portal - enhance Earnings)
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

# ═══════════════════════════════════════════════════════
# 1. CSS - Add all new feature styles
# ═══════════════════════════════════════════════════════
print("=== ADDING CSS ===")

new_css = """
/* ═══════ 2040 NEXT-GEN FEATURES ═══════ */
.vt-ai-clone-card{background:linear-gradient(135deg,rgba(239,135,49,.08),rgba(239,135,49,.02));border:1px solid rgba(239,135,49,.15);border-radius:20px;padding:24px;margin-bottom:16px;position:relative;overflow:hidden}
.vt-ai-clone-card::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(239,135,49,.12),transparent 70%);border-radius:50%}
.vt-ai-clone-header{display:flex;align-items:center;gap:16px;margin-bottom:20px}
.vt-ai-clone-avatar{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--orange),#e8842d);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;box-shadow:0 8px 24px rgba(239,135,49,.3);position:relative}
.vt-ai-clone-avatar .vt-ai-pulse{position:absolute;inset:-3px;border-radius:18px;border:2px solid var(--orange);opacity:.4;animation:vtAiPulse 2s infinite}
@keyframes vtAiPulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.08);opacity:0}}
.vt-ai-clone-info h3{font-size:15px;color:#fff;font-weight:700;margin:0 0 4px}
.vt-ai-clone-info span{font-size:11px;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:4px}
.vt-ai-clone-info .vt-ai-live{color:#22c55e;font-weight:600}
.vt-ai-clone-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
.vt-ai-clone-stat{background:rgba(255,255,255,.04);border-radius:14px;padding:14px;text-align:center;border:1px solid rgba(255,255,255,.04)}
.vt-ai-clone-stat strong{display:block;font-size:18px;color:#fff;font-weight:700}
.vt-ai-clone-stat span{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px}
.vt-ai-clone-langs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
.vt-ai-clone-lang{padding:5px 12px;border-radius:10px;background:rgba(255,255,255,.06);font-size:11px;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.06)}
.vt-ai-clone-lang.active{background:rgba(239,135,49,.12);color:var(--orange);border-color:rgba(239,135,49,.2)}
.vt-ai-clone-actions{display:flex;gap:10px}
.vt-ai-clone-btn{flex:1;padding:12px;border:none;border-radius:14px;font-size:12px;font-weight:700;cursor:pointer;transition:all .25s;font-family:inherit;text-align:center}
.vt-ai-clone-btn.primary{background:linear-gradient(135deg,var(--orange),#e8842d);color:#fff;box-shadow:0 6px 20px rgba(239,135,49,.3)}
.vt-ai-clone-btn.primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(239,135,49,.4)}
.vt-ai-clone-btn.secondary{background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08)}
.vt-ai-clone-btn.secondary:hover{background:rgba(255,255,255,.1)}

.vt-weather-widget{position:absolute;top:12px;right:60px;background:rgba(0,0,0,.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:14px;padding:8px 14px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.1);z-index:8;cursor:default}
.vt-weather-icon{font-size:22px}
.vt-weather-info{font-size:11px;color:#fff;font-weight:600;line-height:1.4}
.vt-weather-info small{display:block;font-size:9px;color:rgba(255,255,255,.5);font-weight:400}

.vt-audio-zone{position:absolute;bottom:36px;left:12px;background:rgba(0,0,0,.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:12px;padding:6px 12px;display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.1);z-index:8}
.vt-audio-zone-bars{display:flex;align-items:flex-end;gap:2px;height:14px}
.vt-audio-zone-bars span{width:3px;border-radius:2px;background:var(--orange);animation:vtAudioBar 1.2s ease-in-out infinite}
.vt-audio-zone-bars span:nth-child(1){height:6px;animation-delay:0s}
.vt-audio-zone-bars span:nth-child(2){height:10px;animation-delay:.2s}
.vt-audio-zone-bars span:nth-child(3){height:8px;animation-delay:.4s}
.vt-audio-zone-bars span:nth-child(4){height:12px;animation-delay:.1s}
@keyframes vtAudioBar{0%,100%{height:4px}50%{height:14px}}
.vt-audio-zone-label{font-size:10px;color:#fff;font-weight:600}
.vt-audio-zone-label small{display:block;font-size:8px;color:rgba(255,255,255,.4);font-weight:400}

.vt-identify-card{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);background:rgba(13,27,42,.95);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-radius:20px;padding:24px;width:300px;border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 64px rgba(0,0,0,.5);z-index:15;opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.25,.46,.45,.94)}
.vt-identify-card.show{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}
.vt-identify-card-close{position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.6);font-size:10px;border:none}
.vt-identify-emoji{font-size:40px;text-align:center;margin-bottom:12px}
.vt-identify-name{font-size:16px;font-weight:700;color:#fff;text-align:center;margin-bottom:4px}
.vt-identify-latin{font-size:11px;color:rgba(255,255,255,.4);text-align:center;font-style:italic;margin-bottom:16px}
.vt-identify-facts{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.vt-identify-fact{display:flex;align-items:flex-start;gap:8px;font-size:11px;color:rgba(255,255,255,.65);line-height:1.5}
.vt-identify-fact i{color:var(--orange);font-size:10px;margin-top:3px;flex-shrink:0}
.vt-identify-buy{width:100%;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--orange),#e8842d);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.vt-identify-buy:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(239,135,49,.3)}

.vt-group-room{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .25s}
.vt-group-room:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.1)}
.vt-group-room-avatar{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,rgba(239,135,49,.15),rgba(239,135,49,.05));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.vt-group-room-info{flex:1;min-width:0}
.vt-group-room-info strong{display:block;font-size:13px;color:#fff;font-weight:600;margin-bottom:2px}
.vt-group-room-info span{font-size:11px;color:rgba(255,255,255,.4)}
.vt-group-room-members{display:flex;margin-left:auto}
.vt-group-room-members div{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.1);border:2px solid rgba(13,27,42,.8);margin-left:-8px;display:flex;align-items:center;justify-content:center;font-size:9px;color:rgba(255,255,255,.6);font-weight:700}
.vt-group-room-members div:first-child{margin-left:0}
.vt-group-room-badge{padding:4px 10px;border-radius:8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.vt-group-room-badge.live{background:rgba(239,68,68,.15);color:#ef4444}
.vt-group-room-badge.open{background:rgba(34,197,94,.1);color:#22c55e}
.vt-create-room-btn{width:100%;padding:14px;border:2px dashed rgba(255,255,255,.1);border-radius:16px;background:transparent;color:rgba(255,255,255,.5);font-size:13px;font-weight:600;cursor:pointer;transition:all .25s;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px}
.vt-create-room-btn:hover{border-color:var(--orange);color:var(--orange);background:rgba(239,135,49,.04)}

.vt-nft-stamp{position:relative}
.vt-nft-badge{position:absolute;top:-4px;right:-4px;width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;box-shadow:0 4px 12px rgba(139,92,246,.3)}
.vt-nft-mint-btn{margin-top:6px;padding:4px 10px;border:1px solid rgba(139,92,246,.25);border-radius:8px;background:rgba(139,92,246,.08);color:#8b5cf6;font-size:9px;font-weight:700;cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:.3px;display:inline-block}
.vt-nft-mint-btn:hover{background:rgba(139,92,246,.15);border-color:rgba(139,92,246,.4)}

.vt-auction-overlay{position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:20;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:all .35s}
.vt-auction-overlay.show{opacity:1;pointer-events:auto}
.vt-auction-card{background:rgba(13,27,42,.95);backdrop-filter:blur(30px);border-radius:24px;padding:28px;width:340px;max-width:90%;border:1px solid rgba(255,255,255,.08);box-shadow:0 32px 80px rgba(0,0,0,.5);transform:translateY(20px);transition:transform .4s cubic-bezier(.25,.46,.45,.94)}
.vt-auction-overlay.show .vt-auction-card{transform:translateY(0)}
.vt-auction-close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.5);font-size:11px;border:none;transition:all .2s}
.vt-auction-close:hover{background:rgba(255,255,255,.15);color:#fff}
.vt-auction-img{width:100%;height:160px;border-radius:16px;background:linear-gradient(135deg,rgba(239,135,49,.1),rgba(239,135,49,.03));display:flex;align-items:center;justify-content:center;font-size:56px;margin-bottom:16px}
.vt-auction-title{font-size:17px;font-weight:700;color:#fff;margin-bottom:4px}
.vt-auction-artist{font-size:12px;color:rgba(255,255,255,.4);margin-bottom:16px}
.vt-auction-bids{display:flex;justify-content:space-between;margin-bottom:16px;padding:14px;background:rgba(255,255,255,.04);border-radius:14px}
.vt-auction-bid-col{text-align:center}
.vt-auction-bid-col strong{display:block;font-size:18px;color:#fff;font-weight:700}
.vt-auction-bid-col span{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px}
.vt-auction-bid-col.time strong{color:var(--orange)}
.vt-auction-bid-input{display:flex;gap:8px;margin-bottom:12px}
.vt-auction-bid-input input{flex:1;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:14px;font-family:inherit;outline:none}
.vt-auction-bid-input input:focus{border-color:var(--orange)}
.vt-auction-bid-btn{padding:12px 24px;border:none;border-radius:14px;background:linear-gradient(135deg,var(--orange),#e8842d);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap}
.vt-auction-bid-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(239,135,49,.3)}
.vt-auction-watchers{text-align:center;font-size:11px;color:rgba(255,255,255,.35)}

.vt-splits-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:24px;margin-bottom:16px}
.vt-splits-title{font-size:13px;font-weight:700;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.vt-splits-title i{color:var(--orange)}
.vt-splits-bar{height:12px;border-radius:6px;background:rgba(255,255,255,.06);overflow:hidden;display:flex;margin-bottom:16px}
.vt-splits-bar div{height:100%;transition:width .6s}
.vt-splits-bar .guide{background:linear-gradient(90deg,var(--orange),#e8842d)}
.vt-splits-bar .platform{background:linear-gradient(90deg,#3b82f6,#2563eb)}
.vt-splits-bar .local{background:linear-gradient(90deg,#22c55e,#16a34a)}
.vt-splits-legend{display:flex;gap:16px;flex-wrap:wrap}
.vt-splits-legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,.6)}
.vt-splits-legend-item .dot{width:8px;height:8px;border-radius:50%}
.vt-splits-legend-item .dot.guide{background:var(--orange)}
.vt-splits-legend-item .dot.platform{background:#3b82f6}
.vt-splits-legend-item .dot.local{background:#22c55e}
.vt-splits-legend-item strong{color:#fff}

.vt-mood-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px;margin-bottom:12px}
.vt-mood-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.vt-mood-header strong{font-size:12px;color:#fff}
.vt-mood-header span{font-size:11px;color:rgba(255,255,255,.4)}
.vt-mood-meter{height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden;margin-bottom:12px}
.vt-mood-meter div{height:100%;border-radius:4px;transition:width .8s}
.vt-mood-suggestion{display:flex;align-items:flex-start;gap:10px;padding:12px;border-radius:12px;background:rgba(239,135,49,.06);border:1px solid rgba(239,135,49,.1)}
.vt-mood-suggestion i{color:var(--orange);font-size:14px;margin-top:2px;flex-shrink:0}
.vt-mood-suggestion div{font-size:11px;color:rgba(255,255,255,.7);line-height:1.5}
.vt-mood-suggestion strong{display:block;color:var(--orange);font-size:12px;margin-bottom:2px}

.vt-haptic-toggle{display:flex;align-items:center;gap:8px;padding:6px 12px;background:rgba(0,0,0,.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:10px;border:1px solid rgba(255,255,255,.1);position:absolute;bottom:36px;right:12px;z-index:8;cursor:pointer;font-size:10px;color:rgba(255,255,255,.7);font-weight:600}
.vt-haptic-toggle i{color:var(--orange);font-size:12px}

.vt-dash-light .vt-ai-clone-card{background:linear-gradient(135deg,rgba(239,135,49,.06),rgba(239,135,49,.02));border-color:rgba(239,135,49,.1)}
.vt-dash-light .vt-ai-clone-info h3{color:var(--navy)}
.vt-dash-light .vt-ai-clone-info span{color:#617087}
.vt-dash-light .vt-ai-clone-stat{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.04)}
.vt-dash-light .vt-ai-clone-stat strong{color:var(--navy)}
.vt-dash-light .vt-ai-clone-stat span{color:#99a3b0}
.vt-dash-light .vt-ai-clone-lang{background:rgba(0,0,0,.04);color:#617087;border-color:rgba(0,0,0,.06)}
.vt-dash-light .vt-ai-clone-btn.secondary{background:rgba(0,0,0,.04);color:var(--navy);border-color:rgba(0,0,0,.06)}
.vt-dash-light .vt-group-room{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.06)}
.vt-dash-light .vt-group-room:hover{background:rgba(0,0,0,.04)}
.vt-dash-light .vt-group-room-info strong{color:var(--navy)}
.vt-dash-light .vt-group-room-info span{color:#99a3b0}
.vt-dash-light .vt-group-room-members div{background:rgba(0,0,0,.06);border-color:#fff;color:#617087}
.vt-dash-light .vt-create-room-btn{border-color:rgba(0,0,0,.1);color:#617087}
.vt-dash-light .vt-create-room-btn:hover{border-color:var(--orange);color:var(--orange)}
.vt-dash-light .vt-splits-card{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.06)}
.vt-dash-light .vt-splits-title{color:var(--navy)}
.vt-dash-light .vt-splits-bar{background:rgba(0,0,0,.06)}
.vt-dash-light .vt-splits-legend-item{color:#617087}
.vt-dash-light .vt-splits-legend-item strong{color:var(--navy)}
.vt-dash-light .vt-mood-card{background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.06)}
.vt-dash-light .vt-mood-header strong{color:var(--navy)}
.vt-dash-light .vt-mood-header span{color:#99a3b0}
.vt-dash-light .vt-mood-meter{background:rgba(0,0,0,.06)}
.vt-dash-light .vt-mood-suggestion{background:rgba(239,135,49,.04);border-color:rgba(239,135,49,.1)}
.vt-dash-light .vt-mood-suggestion div{color:#617087}
"""

c = sr(c,
    '/* ═══════ OCEAN WAVE AMBIENT SOUND ═══════ */',
    new_css + '/* ═══════ OCEAN WAVE AMBIENT SOUND ═══════ */',
    "Add all 2040 feature CSS")

# ═══════════════════════════════════════════════════════
# 2. EXPLORER PORTAL - Add sidebar items
# ═══════════════════════════════════════════════════════
print("\n=== EXPLORER SIDEBAR ===")

c = sr(c,
    """<a href="#" onclick="vtExpNav('replays',this);return false"><i class="fas fa-play-circle"></i> Replays</a>""",
    """<a href="#" onclick="vtExpNav('replays',this);return false"><i class="fas fa-play-circle"></i> Replays</a>
                <a href="#" onclick="vtExpNav('watchrooms',this);return false"><i class="fas fa-users-rectangle"></i> Watch Rooms</a>""",
    "Explorer: Add Watch Rooms nav")

# ═══════════════════════════════════════════════════════
# 3. EXPLORER PORTAL - Add content panels
# ═══════════════════════════════════════════════════════
print("\n=== EXPLORER CONTENT ===")

# Add Watch Rooms + NFT Passport views before the session
watch_rooms_html = """
              <!-- VIEW: Watch Rooms -->
              <div class="vt-dash-view" id="vt-exp-watchrooms">
                <div class="vt-dash-header"><h2>Group Watch Rooms</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <p style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:16px">Watch tours together with friends. See reactions, vote on where to go next.</p>
                <div class="vt-group-room" onclick="vtToast('<i class=\\'fas fa-door-open\\'></i> Joining Beach Vibes room...')">
                  <div class="vt-group-room-avatar">&#127754;</div>
                  <div class="vt-group-room-info"><strong>Beach Vibes Crew</strong><span>Blue Lagoon &middot; Started 12 min ago</span></div>
                  <div class="vt-group-room-members"><div>JM</div><div>KA</div><div>+3</div></div>
                  <div class="vt-group-room-badge live">LIVE</div>
                </div>
                <div class="vt-group-room" onclick="vtToast('<i class=\\'fas fa-door-open\\'></i> Joining Sunset Explorers...')">
                  <div class="vt-group-room-avatar">&#127773;</div>
                  <div class="vt-group-room-info"><strong>Sunset Explorers</strong><span>Negril Cliffs &middot; Starts in 20 min</span></div>
                  <div class="vt-group-room-members"><div>RL</div><div>TS</div></div>
                  <div class="vt-group-room-badge open">OPEN</div>
                </div>
                <div class="vt-group-room" onclick="vtToast('<i class=\\'fas fa-door-open\\'></i> Joining Culture Walk...')">
                  <div class="vt-group-room-avatar">&#127928;</div>
                  <div class="vt-group-room-info"><strong>Culture Walk</strong><span>Port Antonio Market &middot; 8 watching</span></div>
                  <div class="vt-group-room-members"><div>AB</div><div>CD</div><div>EF</div><div>+5</div></div>
                  <div class="vt-group-room-badge live">LIVE</div>
                </div>
                <button class="vt-create-room-btn" onclick="vtToast('<i class=\\'fas fa-plus-circle\\'></i> Creating your watch room...')"><i class="fas fa-plus"></i> Create New Room</button>
              </div>

"""

c = sr(c,
    '                <!-- Active Session -->',
    watch_rooms_html + '                <!-- Active Session -->',
    "Explorer: Add Watch Rooms panel")

# ═══════════════════════════════════════════════════════
# 4. SESSION - Add Weather, Audio Zones, Haptic, Identify
# ═══════════════════════════════════════════════════════
print("\n=== SESSION ENHANCEMENTS ===")

session_widgets = """
                        <!-- Weather Sync -->
                        <div class="vt-weather-widget"><span class="vt-weather-icon">&#9728;&#65039;</span><div class="vt-weather-info">29&deg;C Sunny<small>Port Antonio &middot; Live</small></div></div>

                        <!-- Spatial Audio Zone -->
                        <div class="vt-audio-zone"><div class="vt-audio-zone-bars"><span></span><span></span><span></span><span></span></div><div class="vt-audio-zone-label">Ocean Waves<small>Spatial Audio</small></div></div>

                        <!-- Haptic Toggle -->
                        <div class="vt-haptic-toggle" onclick="vtToggleHaptic(this)"><i class="fas fa-hand-point-up"></i> Haptic ON</div>

                        <!-- AI Identify Card -->
                        <div class="vt-identify-card" id="vt-identify-card">
                          <button class="vt-identify-card-close" onclick="document.getElementById('vt-identify-card').classList.remove('show')"><i class="fas fa-times"></i></button>
                          <div class="vt-identify-emoji">&#127796;</div>
                          <div class="vt-identify-name">Blue Mahoe Tree</div>
                          <div class="vt-identify-latin">Talipariti elatum</div>
                          <div class="vt-identify-facts">
                            <div class="vt-identify-fact"><i class="fas fa-leaf"></i> Jamaica's national tree, growing up to 25 meters tall</div>
                            <div class="vt-identify-fact"><i class="fas fa-palette"></i> Wood changes color from blue-green to deep purple over time</div>
                            <div class="vt-identify-fact"><i class="fas fa-map-marker-alt"></i> Endemic to Jamaica and Cuba, found in wet limestone forests</div>
                          </div>
                          <button class="vt-identify-buy" onclick="vtAddToCart(this,'Blue Mahoe Seedling',35);document.getElementById('vt-identify-card').classList.remove('show')"><i class="fas fa-seedling" style="margin-right:6px"></i>Buy Seedling &mdash; USD $35</button>
                        </div>

                        <!-- Live Auction Overlay -->
                        <div class="vt-auction-overlay" id="vt-auction-overlay" onclick="this.classList.remove('show')">
                          <div class="vt-auction-card" onclick="event.stopPropagation()">
                            <button class="vt-auction-close" onclick="document.getElementById('vt-auction-overlay').classList.remove('show')"><i class="fas fa-times"></i></button>
                            <div class="vt-auction-img">&#127912;</div>
                            <div class="vt-auction-title">Hand-Painted Blue Mountain Sunset</div>
                            <div class="vt-auction-artist">by Marcus Johnson &middot; Portland, Jamaica</div>
                            <div class="vt-auction-bids">
                              <div class="vt-auction-bid-col"><strong>$85</strong><span>Current Bid</span></div>
                              <div class="vt-auction-bid-col"><strong>12</strong><span>Bids</span></div>
                              <div class="vt-auction-bid-col time"><strong>4:32</strong><span>Time Left</span></div>
                            </div>
                            <div class="vt-auction-bid-input"><input type="number" placeholder="$90 or more" min="90" value="90"><button class="vt-auction-bid-btn" onclick="vtToast('<i class=\\'fas fa-gavel\\'></i> Bid placed! You are the highest bidder');document.getElementById('vt-auction-overlay').classList.remove('show')">Place Bid</button></div>
                            <div class="vt-auction-watchers"><i class="fas fa-eye" style="margin-right:4px"></i> 34 people watching this auction</div>
                          </div>
                        </div>
"""

c = sr(c,
    '                        <!-- Live Indicator -->',
    session_widgets + '                        <!-- Live Indicator -->',
    "Session: Add weather, audio, haptic, identify, auction")

# ═══════════════════════════════════════════════════════
# 5. GUIDE PORTAL - Add sidebar items
# ═══════════════════════════════════════════════════════
print("\n=== GUIDE SIDEBAR ===")

c = sr(c,
    """<a href="#" onclick="vtGuideNav('multicam',this);return false"><i class="fas fa-video"></i> Multi-Cam</a>""",
    """<a href="#" onclick="vtGuideNav('multicam',this);return false"><i class="fas fa-video"></i> Multi-Cam</a>
                <a href="#" onclick="vtGuideNav('aiclone',this);return false"><i class="fas fa-robot"></i> AI Clone</a>
                <a href="#" onclick="vtGuideNav('mood',this);return false"><i class="fas fa-brain"></i> Mood AI</a>""",
    "Guide: Add AI Clone + Mood AI nav")

# ═══════════════════════════════════════════════════════
# 6. GUIDE PORTAL - Add content panels
# ═══════════════════════════════════════════════════════
print("\n=== GUIDE CONTENT ===")

guide_panels = """
              <!-- VIEW: AI Guide Clone -->
              <div class="vt-dash-view" id="vt-guide-aiclone">
                <div class="vt-dash-header"><h2>AI Guide Clone</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-ai-clone-card">
                  <div class="vt-ai-clone-header">
                    <div class="vt-ai-clone-avatar"><i class="fas fa-robot"></i><div class="vt-ai-pulse"></div></div>
                    <div class="vt-ai-clone-info"><h3>Marcus AI</h3><span class="vt-ai-live"><i class="fas fa-circle" style="font-size:6px"></i> Active &mdash; Running 2 tours now</span></div>
                  </div>
                  <div class="vt-ai-clone-stats">
                    <div class="vt-ai-clone-stat"><strong>847</strong><span>AI Tours Run</span></div>
                    <div class="vt-ai-clone-stat"><strong>4.8</strong><span>AI Rating</span></div>
                    <div class="vt-ai-clone-stat"><strong>$2,340</strong><span>AI Revenue</span></div>
                  </div>
                  <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;font-weight:700">AI Languages</div>
                  <div class="vt-ai-clone-langs">
                    <div class="vt-ai-clone-lang active">&#127482;&#127480; English</div>
                    <div class="vt-ai-clone-lang active">&#127466;&#127480; Espa&ntilde;ol</div>
                    <div class="vt-ai-clone-lang active">&#127467;&#127479; Fran&ccedil;ais</div>
                    <div class="vt-ai-clone-lang active">&#127465;&#127466; Deutsch</div>
                    <div class="vt-ai-clone-lang">&#127471;&#127477; &#26085;&#26412;&#35486;</div>
                    <div class="vt-ai-clone-lang">&#127464;&#127475; &#20013;&#25991;</div>
                    <div class="vt-ai-clone-lang">&#127470;&#127475; &#2361;&#2367;&#2344;&#2381;&#2342;&#2368;</div>
                    <div class="vt-ai-clone-lang">&#127480;&#127462; &#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</div>
                  </div>
                  <div class="vt-ai-clone-actions">
                    <div class="vt-ai-clone-btn primary" onclick="vtToast('<i class=\\'fas fa-microphone\\'></i> Starting AI training session...')"><i class="fas fa-microphone" style="margin-right:6px"></i>Retrain Voice</div>
                    <div class="vt-ai-clone-btn secondary" onclick="vtToast('<i class=\\'fas fa-cog\\'></i> Opening AI personality settings...')"><i class="fas fa-sliders-h" style="margin-right:6px"></i>Settings</div>
                  </div>
                </div>
                <div class="vt-splits-card">
                  <div class="vt-splits-title"><i class="fas fa-clock"></i> AI Clone Schedule</div>
                  <p style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:12px">Your AI clone runs tours while you sleep. It has your personality, your knowledge, and speaks 8 languages.</p>
                  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center">
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(239,135,49,.1);border:1px solid rgba(239,135,49,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">MON</div><div style="font-size:10px;color:var(--orange);font-weight:700">24h</div></div>
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(239,135,49,.1);border:1px solid rgba(239,135,49,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">TUE</div><div style="font-size:10px;color:var(--orange);font-weight:700">24h</div></div>
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(239,135,49,.1);border:1px solid rgba(239,135,49,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">WED</div><div style="font-size:10px;color:var(--orange);font-weight:700">24h</div></div>
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(239,135,49,.1);border:1px solid rgba(239,135,49,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">THU</div><div style="font-size:10px;color:var(--orange);font-weight:700">24h</div></div>
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">FRI</div><div style="font-size:10px;color:#22c55e;font-weight:700">OFF</div></div>
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">SAT</div><div style="font-size:10px;color:#22c55e;font-weight:700">OFF</div></div>
                    <div style="padding:8px 4px;border-radius:10px;background:rgba(239,135,49,.1);border:1px solid rgba(239,135,49,.15)"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px">SUN</div><div style="font-size:10px;color:var(--orange);font-weight:700">24h</div></div>
                  </div>
                </div>
              </div>

              <!-- VIEW: Mood-Adaptive AI -->
              <div class="vt-dash-view" id="vt-guide-mood">
                <div class="vt-dash-header"><h2>Mood-Adaptive AI</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats"><div class="vt-dash-stat"><strong>&#128522;</strong><span>Current Mood</span><small>Highly engaged</small></div><div class="vt-dash-stat"><strong>94%</strong><span>Engagement</span><small>Above avg</small></div><div class="vt-dash-stat"><strong>12</strong><span>AI Nudges</span><small>This session</small></div><div class="vt-dash-stat"><strong>+23%</strong><span>Retention Lift</span><small>vs. no AI</small></div></div>
                <div class="vt-mood-card">
                  <div class="vt-mood-header"><strong>&#127754; Excitement Level</strong><span>High</span></div>
                  <div class="vt-mood-meter"><div style="width:82%;background:linear-gradient(90deg,#22c55e,#16a34a)"></div></div>
                  <div class="vt-mood-suggestion"><i class="fas fa-lightbulb"></i><div><strong>AI Suggestion</strong>Viewers are loving the water views. Zoom in on the lagoon and mention the depth &mdash; 3 people just asked about it in chat.</div></div>
                </div>
                <div class="vt-mood-card">
                  <div class="vt-mood-header"><strong>&#128172; Chat Engagement</strong><span>Very Active</span></div>
                  <div class="vt-mood-meter"><div style="width:91%;background:linear-gradient(90deg,var(--orange),#e8842d)"></div></div>
                  <div class="vt-mood-suggestion"><i class="fas fa-lightbulb"></i><div><strong>AI Suggestion</strong>5 viewers mentioned wanting to buy local crafts. Consider walking to the craft market stall next &mdash; shop conversion opportunity.</div></div>
                </div>
                <div class="vt-mood-card">
                  <div class="vt-mood-header"><strong>&#9200; Pace &amp; Pacing</strong><span>Perfect</span></div>
                  <div class="vt-mood-meter"><div style="width:76%;background:linear-gradient(90deg,#3b82f6,#2563eb)"></div></div>
                  <div class="vt-mood-suggestion"><i class="fas fa-lightbulb"></i><div><strong>AI Suggestion</strong>You've been at this spot for 8 minutes. Average attention drops after 10. Consider transitioning to the next point of interest soon.</div></div>
                </div>
              </div>

"""

# Insert before Analytics view
c = sr(c,
    '              <!-- VIEW: Profile -->',
    guide_panels + '              <!-- VIEW: Profile -->',
    "Guide: Add AI Clone + Mood panels")

# ═══════════════════════════════════════════════════════
# 7. GUIDE PORTAL - Add Revenue Splits to Earnings
# ═══════════════════════════════════════════════════════
print("\n=== GUIDE SPLITS ===")

# Find the earnings view and add splits after the stats
splits_html = """
                <div class="vt-splits-card">
                  <div class="vt-splits-title"><i class="fas fa-chart-pie"></i> Revenue Split &mdash; This Month</div>
                  <div class="vt-splits-bar"><div class="guide" style="width:70%"></div><div class="platform" style="width:15%"></div><div class="local" style="width:15%"></div></div>
                  <div class="vt-splits-legend">
                    <div class="vt-splits-legend-item"><span class="dot guide"></span> Guide <strong>70%</strong> &mdash; $1,820</div>
                    <div class="vt-splits-legend-item"><span class="dot platform"></span> Platform <strong>15%</strong> &mdash; $390</div>
                    <div class="vt-splits-legend-item"><span class="dot local"></span> Local Biz <strong>15%</strong> &mdash; $390</div>
                  </div>
                </div>
"""

c = sr(c,
    '<div class="vt-empty-state" style="padding:30px"><i class="fas fa-wallet"></i><h4>Earnings Dashboard</h4>',
    splits_html + '<div class="vt-empty-state" style="padding:30px"><i class="fas fa-wallet"></i><h4>Earnings Dashboard</h4>',
    "Guide: Add revenue splits to Earnings")

# ═══════════════════════════════════════════════════════
# 8. SESSION - Update Point & Ask to trigger identify
# ═══════════════════════════════════════════════════════
print("\n=== POINT & ASK ===")

c = sr(c,
    """onclick="vtSessionAction(this,'pointask')""",
    """onclick="vtPointAndIdentify()" """,
    "Point & Ask triggers AI identify card")

# ═══════════════════════════════════════════════════════
# 9. HOTSPOT - Make shirt hotspot trigger auction
# ═══════════════════════════════════════════════════════
print("\n=== AUCTION HOTSPOT ===")

# Find the shirt/gift hotspot and make it open the auction
c = sr(c,
    """<div class="vt-hotspot-dot"><i class="fas fa-tshirt"></i></div>""",
    """<div class="vt-hotspot-dot" onclick="event.stopPropagation();document.getElementById('vt-auction-overlay').classList.add('show')"><i class="fas fa-tshirt"></i></div>""",
    "Shirt hotspot opens live auction")

# ═══════════════════════════════════════════════════════
# 10. JS - Add functions
# ═══════════════════════════════════════════════════════
print("\n=== JS FUNCTIONS ===")

js_functions = """

/* ═══════ 2040 NEXT-GEN JS ═══════ */
function vtPointAndIdentify(){
  var card=document.getElementById('vt-identify-card');
  if(card)card.classList.toggle('show');
}

function vtToggleHaptic(el){
  var on=el.textContent.indexOf('ON')>-1;
  if(on){
    el.innerHTML='<i class="fas fa-hand-point-up"></i> Haptic OFF';
    vtToast('<i class="fas fa-bell-slash"></i> Haptic feedback disabled');
  }else{
    el.innerHTML='<i class="fas fa-hand-point-up"></i> Haptic ON';
    vtToast('<i class="fas fa-bell"></i> Haptic feedback enabled');
    if(navigator.vibrate)navigator.vibrate(50);
  }
}

function vtGuideNav(view,el){
  document.querySelectorAll('#vt-guide-sidebar a').forEach(function(a){a.classList.remove('active')});
  if(el)el.classList.add('active');
  var main=document.getElementById('vt-guide-frame');if(!main)return;
  main.querySelectorAll('.vt-dash-view').forEach(function(v){v.classList.remove('active')});
  var target=document.getElementById('vt-guide-'+view);
  if(target)target.classList.add('active');
}

"""

c = sr(c,
    '/* ═══════ OCEAN WAVE AMBIENT SOUND ═══════ */',
    js_functions + '/* ═══════ OCEAN WAVE AMBIENT SOUND ═══════ */',
    "Add 2040 JS functions")

# ═══════════════════════════════════════════════════════
# 11. NFT BADGES - Add to first passport stamp
# ═══════════════════════════════════════════════════════
print("\n=== NFT STAMPS ===")

c = sr(c,
    """<span>Blue Lagoon</span></div>""",
    """<span>Blue Lagoon</span><div class="vt-nft-mint-btn" onclick="event.stopPropagation();vtToast('<i class=\\'fas fa-gem\\'></i> Minting NFT stamp to your wallet...')">&#9830; Mint NFT</div></div>""",
    "NFT mint button on first stamp")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes applied.")
