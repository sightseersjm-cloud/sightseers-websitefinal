#!/usr/bin/env python3
"""
Mega update: All new features for Explorer + Guide dashboards,
hover hotspots, working cart, Point and Ask, everything functional.
"""

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    c = f.read()

n = 0
def sr(c, old, new, desc=""):
    global n
    if old not in c:
        print(f"  WARN: {desc}")
        return c
    c = c.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return c

# ================================================================
# 1. EXPLORER SIDEBAR — Add new feature nav items
# ================================================================
print("=== 1. EXPLORER SIDEBAR ===")

c = sr(c,
    """<a href="#" onclick="vtExpNav('favorites',this);return false"><i class="fas fa-heart"></i> Favorites</a>
    <a href="#" onclick="vtExpNav('history',this);return false"><i class="fas fa-history"></i> History</a>
  </div>
  <div class="vt-dash-sidebar-section">
    <div class="vt-dash-sidebar-label">Account</div>
    <a href="#" onclick="vtExpNav('profile',this);return false"><i class="fas fa-user"></i> Profile</a>
    <a href="#" onclick="vtExpNav('settings',this);return false"><i class="fas fa-cog"></i> Settings</a>""",
    """<a href="#" onclick="vtExpNav('favorites',this);return false"><i class="fas fa-heart"></i> Favorites</a>
  </div>
  <div class="vt-dash-sidebar-section">
    <div class="vt-dash-sidebar-label">Smart</div>
    <a href="#" onclick="vtExpNav('concierge',this);return false"><i class="fas fa-robot"></i> AI Concierge</a>
    <a href="#" onclick="vtExpNav('passport',this);return false"><i class="fas fa-passport"></i> Passport</a>
    <a href="#" onclick="vtExpNav('social',this);return false"><i class="fas fa-users"></i> Social</a>
    <a href="#" onclick="vtExpNav('replays',this);return false"><i class="fas fa-play-circle"></i> Replays</a>
  </div>
  <div class="vt-dash-sidebar-section">
    <div class="vt-dash-sidebar-label">Account</div>
    <a href="#" onclick="vtExpNav('history',this);return false"><i class="fas fa-history"></i> History</a>
    <a href="#" onclick="vtExpNav('profile',this);return false"><i class="fas fa-user"></i> Profile</a>
    <a href="#" onclick="vtExpNav('settings',this);return false"><i class="fas fa-cog"></i> Settings</a>""",
    "Explorer sidebar new items")

# ================================================================
# 2. GUIDE SIDEBAR — Add new feature nav items
# ================================================================
print("\n=== 2. GUIDE SIDEBAR ===")

c = sr(c,
    """<a href="#" onclick="vtGuideNav('shopitems',this);return false"><i class="fas fa-tags"></i> Shop Items</a>
  </div>
  <div class="vt-dash-sidebar-section">
    <div class="vt-dash-sidebar-label">Business</div>
    <a href="#" onclick="vtGuideNav('earnings',this);return false"><i class="fas fa-wallet"></i> Earnings</a>
    <a href="#" onclick="vtGuideNav('reviews',this);return false"><i class="fas fa-star"></i> Reviews <span class="badge">4</span></a>
    <a href="#" onclick="vtGuideNav('analytics',this);return false"><i class="fas fa-chart-line"></i> Analytics</a>""",
    """<a href="#" onclick="vtGuideNav('shopitems',this);return false"><i class="fas fa-tags"></i> Shop Items</a>
  </div>
  <div class="vt-dash-sidebar-section">
    <div class="vt-dash-sidebar-label">Live Tools</div>
    <a href="#" onclick="vtGuideNav('sentiment',this);return false"><i class="fas fa-smile-beam"></i> Sentiment</a>
    <a href="#" onclick="vtGuideNav('tips',this);return false"><i class="fas fa-gift"></i> Tips &amp; Gifts</a>
    <a href="#" onclick="vtGuideNav('multicam',this);return false"><i class="fas fa-video"></i> Multi-Cam</a>
  </div>
  <div class="vt-dash-sidebar-section">
    <div class="vt-dash-sidebar-label">Business</div>
    <a href="#" onclick="vtGuideNav('earnings',this);return false"><i class="fas fa-wallet"></i> Earnings</a>
    <a href="#" onclick="vtGuideNav('aieditor',this);return false"><i class="fas fa-magic"></i> AI Editor</a>
    <a href="#" onclick="vtGuideNav('pricing',this);return false"><i class="fas fa-tags"></i> Pricing</a>
    <a href="#" onclick="vtGuideNav('reviews',this);return false"><i class="fas fa-star"></i> Reviews <span class="badge">4</span></a>
    <a href="#" onclick="vtGuideNav('analytics',this);return false"><i class="fas fa-chart-line"></i> Analytics</a>""",
    "Guide sidebar new items")

# ================================================================
# 3. EXPLORER — Add new view HTML
# ================================================================
print("\n=== 3. EXPLORER NEW VIEWS ===")

explorer_new_views = """
              <!-- VIEW: AI Concierge -->
              <div class="vt-dash-view" id="vt-exp-concierge">
                <div class="vt-dash-header"><h2><i class="fas fa-robot" style="color:var(--orange);margin-right:8px"></i>AI Trip Concierge</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-concierge">
                  <div class="vt-concierge-chat" id="vt-concierge-chat">
                    <div class="vt-ai-msg bot"><div class="vt-ai-avatar"><i class="fas fa-robot"></i></div><div class="vt-ai-bubble">Hi Sarah! I am your V-Tours AI concierge. I can help you find the perfect tour, plan your Caribbean adventure, or answer questions about any destination. What sounds good today?</div></div>
                    <div class="vt-ai-chips"><div class="vt-ai-chip" onclick="vtAskAI(this.textContent)">Food tours under $40</div><div class="vt-ai-chip" onclick="vtAskAI(this.textContent)">Best nature experiences</div><div class="vt-ai-chip" onclick="vtAskAI(this.textContent)">Weekend tours available</div><div class="vt-ai-chip" onclick="vtAskAI(this.textContent)">Family-friendly options</div></div>
                  </div>
                  <div class="vt-ai-input-wrap"><input type="text" class="vt-ai-input" id="vt-ai-field" placeholder="Ask me anything about tours, destinations, or planning..." onkeydown="if(event.key==='Enter')vtSendAI()"><button class="vt-ai-send" onclick="vtSendAI()"><i class="fas fa-paper-plane"></i></button></div>
                </div>
              </div>

              <!-- VIEW: Virtual Passport -->
              <div class="vt-dash-view" id="vt-exp-passport">
                <div class="vt-dash-header"><h2><i class="fas fa-passport" style="color:var(--orange);margin-right:8px"></i>Virtual Passport</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-passport-tier"><div class="vt-passport-tier-icon gold"><i class="fas fa-award"></i></div><div class="vt-passport-tier-info"><strong>Gold Explorer</strong><span>12 tours completed</span></div><div class="vt-passport-xp"><div class="vt-passport-xp-fill" style="width:72%"></div></div><span class="vt-passport-xp-label">720 / 1,000 XP to Platinum</span></div>
                <h4 style="color:rgba(255,255,255,.5);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:20px 0 12px">Tour Stamps</h4>
                <div class="vt-passport-stamps">
                  <div class="vt-stamp collected" onclick="vtToast('<i class=\\'fas fa-check-circle\\'></i> Blue Lagoon — Earned Jun 2')"><div class="vt-stamp-icon"><i class="fas fa-water"></i></div><span>Blue Lagoon</span><small>Portland</small></div>
                  <div class="vt-stamp collected" onclick="vtToast('<i class=\\'fas fa-check-circle\\'></i> Kingston Jerk — Earned May 28')"><div class="vt-stamp-icon"><i class="fas fa-utensils"></i></div><span>Jerk Kitchen</span><small>Kingston</small></div>
                  <div class="vt-stamp collected" onclick="vtToast('<i class=\\'fas fa-check-circle\\'></i> Devon House — Earned May 15')"><div class="vt-stamp-icon"><i class="fas fa-landmark"></i></div><span>Devon House</span><small>Kingston</small></div>
                  <div class="vt-stamp collected" onclick="vtToast('<i class=\\'fas fa-check-circle\\'></i> Craft Market — Earned May 10')"><div class="vt-stamp-icon"><i class="fas fa-store"></i></div><span>Craft Market</span><small>Falmouth</small></div>
                  <div class="vt-stamp collected" onclick="vtToast('<i class=\\'fas fa-check-circle\\'></i> Blue Mountain — Earned Apr 22')"><div class="vt-stamp-icon"><i class="fas fa-mountain"></i></div><span>Blue Mountain</span><small>Portland</small></div>
                  <div class="vt-stamp" onclick="vtToast('<i class=\\'fas fa-lock\\'></i> Complete a Bridgetown tour to unlock')"><div class="vt-stamp-icon locked"><i class="fas fa-lock"></i></div><span>Bridgetown</span><small>Barbados</small></div>
                  <div class="vt-stamp" onclick="vtToast('<i class=\\'fas fa-lock\\'></i> Complete a Havana tour to unlock')"><div class="vt-stamp-icon locked"><i class="fas fa-lock"></i></div><span>Havana</span><small>Cuba</small></div>
                  <div class="vt-stamp" onclick="vtToast('<i class=\\'fas fa-lock\\'></i> Complete a Castries tour to unlock')"><div class="vt-stamp-icon locked"><i class="fas fa-lock"></i></div><span>Castries</span><small>St. Lucia</small></div>
                </div>
                <h4 style="color:rgba(255,255,255,.5);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:24px 0 12px">Achievements</h4>
                <div class="vt-passport-badges">
                  <div class="vt-badge earned" onclick="vtToast('<i class=\\'fas fa-trophy\\'></i> First Tour: Completed your first live virtual tour')"><i class="fas fa-flag-checkered"></i><span>First Tour</span></div>
                  <div class="vt-badge earned" onclick="vtToast('<i class=\\'fas fa-trophy\\'></i> Shopaholic: Bought 5+ items in sessions')"><i class="fas fa-shopping-cart"></i><span>Shopaholic</span></div>
                  <div class="vt-badge earned" onclick="vtToast('<i class=\\'fas fa-trophy\\'></i> Social Butterfly: Sent 50+ chat messages')"><i class="fas fa-comments"></i><span>Social Butterfly</span></div>
                  <div class="vt-badge earned" onclick="vtToast('<i class=\\'fas fa-trophy\\'></i> Globe Trotter: Visited 5 destinations')"><i class="fas fa-globe-americas"></i><span>Globe Trotter</span></div>
                  <div class="vt-badge" onclick="vtToast('<i class=\\'fas fa-lock\\'></i> Night Owl: Join 3 tours after 8 PM')"><i class="fas fa-moon"></i><span>Night Owl</span></div>
                  <div class="vt-badge" onclick="vtToast('<i class=\\'fas fa-lock\\'></i> VIP: Attend a private VIP session')"><i class="fas fa-crown"></i><span>VIP</span></div>
                </div>
              </div>

              <!-- VIEW: Social Feed -->
              <div class="vt-dash-view" id="vt-exp-social">
                <div class="vt-dash-header"><h2><i class="fas fa-users" style="color:var(--orange);margin-right:8px"></i>Social</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-social-online"><div class="vt-social-online-label"><span class="vt-dash-live-dot"></span> Friends Online Now</div>
                  <div class="vt-social-friends">
                    <div class="vt-social-friend" onclick="vtToast('<i class=\\'fas fa-eye\\'></i> Joining Kevin in Blue Lagoon...')"><div class="vt-social-friend-avatar">KJ</div><div class="vt-social-friend-info"><strong>Kevin J.</strong><span class="live">Watching Blue Lagoon</span></div><div class="vt-social-friend-action">Join</div></div>
                    <div class="vt-social-friend" onclick="vtToast('<i class=\\'fas fa-eye\\'></i> Joining Mia in Jerk Class...')"><div class="vt-social-friend-avatar">MR</div><div class="vt-social-friend-info"><strong>Mia R.</strong><span class="live">In Kingston Jerk Class</span></div><div class="vt-social-friend-action">Join</div></div>
                    <div class="vt-social-friend"><div class="vt-social-friend-avatar off">TW</div><div class="vt-social-friend-info"><strong>Tyler W.</strong><span>Last online 2h ago</span></div></div>
                  </div>
                </div>
                <div class="vt-social-feed-label">Recent Activity</div>
                <div class="vt-social-feed">
                  <div class="vt-social-post"><div class="vt-social-post-avatar">KJ</div><div class="vt-social-post-body"><strong>Kevin J.</strong> completed <em>Blue Lagoon Morning Walk</em> and rated it <span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><div class="vt-social-post-time">12 minutes ago</div><div class="vt-social-post-text">"Absolutely incredible. The guide Marcus made us feel like we were really there. Bought a Blue Mahoe seedling!"</div></div></div>
                  <div class="vt-social-post"><div class="vt-social-post-avatar">MR</div><div class="vt-social-post-body"><strong>Mia R.</strong> earned the <em>Shopaholic</em> badge <i class="fas fa-shopping-cart" style="color:var(--orange)"></i><div class="vt-social-post-time">45 minutes ago</div></div></div>
                  <div class="vt-social-post"><div class="vt-social-post-avatar">TW</div><div class="vt-social-post-body"><strong>Tyler W.</strong> booked <em>Rio Grande River Raft Tour</em> for Saturday<div class="vt-social-post-time">2 hours ago</div><div class="vt-social-post-actions"><div class="vt-social-post-btn" onclick="vtToast('<i class=\\'fas fa-check\\'></i> You are booked for Rio Grande too!')">Join trip</div><div class="vt-social-post-btn sec" onclick="vtToast('<i class=\\'fas fa-heart\\'></i> Liked!')"><i class="fas fa-heart"></i></div></div></div></div>
                </div>
              </div>

              <!-- VIEW: Tour Replays -->
              <div class="vt-dash-view" id="vt-exp-replays">
                <div class="vt-dash-header"><h2><i class="fas fa-play-circle" style="color:var(--orange);margin-right:8px"></i>Tour Replays</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-live-grid">
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-play\\'></i> Loading replay: Blue Lagoon Jun 10...')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-live-card-badge">Replay</div><div class="vt-live-card-cat">Nature</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Blue Lagoon Morning Walk</div><div class="vt-live-card-guide">Jun 10 — 58 min — Marcus T.</div><div class="vt-live-card-foot"><span class="vt-live-card-price"><i class="fas fa-play-circle"></i> Watch</span><div class="vt-live-card-btn">Replay</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-play\\'></i> Loading replay: Jerk Class May 28...')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#8b4513,#d2691e)"><div class="vt-live-card-badge">Replay</div><div class="vt-live-card-cat">Food</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Kingston Jerk and Ackee Class</div><div class="vt-live-card-guide">May 28 — 45 min — Chef Anita M.</div><div class="vt-live-card-foot"><span class="vt-live-card-price"><i class="fas fa-play-circle"></i> Watch</span><div class="vt-live-card-btn">Replay</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-play\\'></i> Loading highlight reel: Devon House...')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#7c3aed,#a855f7)"><div class="vt-live-card-badge" style="background:var(--orange)">Highlights</div><div class="vt-live-card-cat">Culture</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Devon House Heritage Tour</div><div class="vt-live-card-guide">AI-generated 5-min highlights</div><div class="vt-live-card-foot"><span class="vt-live-card-price"><i class="fas fa-magic"></i> AI Reel</span><div class="vt-live-card-btn alt">Watch</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-play\\'></i> Loading replay: Craft Market May 10...')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#dc2626,#f97316)"><div class="vt-live-card-badge">Replay</div><div class="vt-live-card-cat">Shopping</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Falmouth Craft Market Walk</div><div class="vt-live-card-guide">May 10 — 62 min — Marcus T.</div><div class="vt-live-card-foot"><span class="vt-live-card-price"><i class="fas fa-play-circle"></i> Watch</span><div class="vt-live-card-btn">Replay</div></div></div></div>
                </div>
              </div>

"""

c = sr(c,
    """              <!-- VIEW: Settings -->
              <div class="vt-dash-view" id="vt-exp-settings">""",
    explorer_new_views + """              <!-- VIEW: Settings -->
              <div class="vt-dash-view" id="vt-exp-settings">""",
    "Explorer new views HTML")

# ================================================================
# 4. GUIDE PORTAL — Add new view HTML
# ================================================================
print("\n=== 4. GUIDE NEW VIEWS ===")

guide_new_views = """
              <!-- VIEW: Live Sentiment -->
              <div class="vt-dash-view" id="vt-guide-sentiment">
                <div class="vt-dash-header"><h2><i class="fas fa-smile-beam" style="color:var(--orange);margin-right:8px"></i>Live Sentiment</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats">
                  <div class="vt-dash-stat"><strong style="font-size:28px">&#128522;</strong><span>Current Mood</span><small>Positive 94%</small></div>
                  <div class="vt-dash-stat"><strong>247</strong><span>Active Viewers</span><small>Peak: 312</small></div>
                  <div class="vt-dash-stat"><strong>8.7</strong><span>Engagement Score</span><small>Above avg</small></div>
                  <div class="vt-dash-stat"><strong>42</strong><span>Chat Messages/Min</span><small>High activity</small></div>
                </div>
                <div class="vt-sentiment-meter"><div class="vt-sentiment-label">Crowd Mood</div><div class="vt-sentiment-bar"><div class="vt-sentiment-fill" style="width:94%"><span>94% Positive</span></div></div></div>
                <div class="vt-sentiment-emojis"><span class="vt-emoji-float" style="animation-delay:0s">&#128525;</span><span class="vt-emoji-float" style="animation-delay:.3s">&#128079;</span><span class="vt-emoji-float" style="animation-delay:.6s">&#10084;</span><span class="vt-emoji-float" style="animation-delay:.9s">&#128293;</span><span class="vt-emoji-float" style="animation-delay:1.2s">&#127796;</span><span class="vt-emoji-float" style="animation-delay:1.5s">&#128247;</span><span class="vt-emoji-float" style="animation-delay:1.8s">&#128588;</span></div>
                <div class="vt-sentiment-keywords"><div class="vt-sentiment-kw-title">Top Chat Keywords</div><span class="vt-kw" style="font-size:18px">beautiful</span> <span class="vt-kw" style="font-size:14px">amazing</span> <span class="vt-kw" style="font-size:16px">wow</span> <span class="vt-kw" style="font-size:12px">Jamaica</span> <span class="vt-kw" style="font-size:15px">love this</span> <span class="vt-kw" style="font-size:13px">want to buy</span> <span class="vt-kw" style="font-size:11px">can you show</span> <span class="vt-kw" style="font-size:17px">stunning</span></div>
              </div>

              <!-- VIEW: Tips & Gifts -->
              <div class="vt-dash-view" id="vt-guide-tips">
                <div class="vt-dash-header"><h2><i class="fas fa-gift" style="color:var(--orange);margin-right:8px"></i>Tips &amp; Gifts</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats">
                  <div class="vt-dash-stat"><strong>$284</strong><span>Today's Tips</span><small>32 gifts</small></div>
                  <div class="vt-dash-stat"><strong>$1,420</strong><span>This Week</span><small>+38% vs last</small></div>
                  <div class="vt-dash-stat"><strong>$5,840</strong><span>All Time Tips</span><small>Since Jan 2025</small></div>
                  <div class="vt-dash-stat"><strong>&#127796;</strong><span>Top Gift</span><small>Palm Tree ($10)</small></div>
                </div>
                <h4 style="color:rgba(255,255,255,.5);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:20px 0 12px">Recent Gift Stream</h4>
                <div class="vt-gift-stream">
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Kevin J.</strong> sent a Palm Tree<small>$10.00 — 2 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#11088;</span><div class="vt-gift-info"><strong>Mia R.</strong> sent a Gold Star<small>$5.00 — 5 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#128026;</span><div class="vt-gift-info"><strong>Tyler W.</strong> sent a Conch Shell<small>$25.00 — 8 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#127796;</span><div class="vt-gift-info"><strong>Lisa M.</strong> sent a Palm Tree<small>$10.00 — 12 min ago</small></div></div>
                  <div class="vt-gift-item"><span class="vt-gift-emoji">&#128142;</span><div class="vt-gift-info"><strong>James P.</strong> sent a Diamond<small>$50.00 — 15 min ago</small></div></div>
                </div>
              </div>

              <!-- VIEW: Multi-Cam -->
              <div class="vt-dash-view" id="vt-guide-multicam">
                <div class="vt-dash-header"><h2><i class="fas fa-video" style="color:var(--orange);margin-right:8px"></i>Multi-Cam Setup</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <p style="color:rgba(255,255,255,.5);font-size:12px;margin-bottom:16px">Switch between camera angles during your live session. Viewers see the active camera.</p>
                <div class="vt-multicam-grid">
                  <div class="vt-multicam-card active" onclick="vtSelectCam(this,1)"><div class="vt-multicam-preview" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-multicam-live">ACTIVE</div><i class="fas fa-mobile-alt" style="font-size:24px;color:rgba(255,255,255,.4)"></i></div><div class="vt-multicam-label"><strong>Handheld</strong><span>iPhone 15 Pro — 4K 60fps</span></div></div>
                  <div class="vt-multicam-card" onclick="vtSelectCam(this,2)"><div class="vt-multicam-preview" style="background:linear-gradient(135deg,#1a3a5c,#0d5371)"><i class="fas fa-camera-retro" style="font-size:24px;color:rgba(255,255,255,.4)"></i></div><div class="vt-multicam-label"><strong>Chest Mount</strong><span>GoPro Hero 12 — 360° POV</span></div></div>
                  <div class="vt-multicam-card" onclick="vtSelectCam(this,3)"><div class="vt-multicam-preview" style="background:linear-gradient(135deg,#4a2818,#8b5230)"><i class="fas fa-helicopter" style="font-size:24px;color:rgba(255,255,255,.4)"></i></div><div class="vt-multicam-label"><strong>Drone</strong><span>DJI Mini 4 Pro — Aerial</span></div></div>
                </div>
                <div class="vt-multicam-settings"><h4 style="color:#fff;font-size:13px;margin-bottom:12px">Stream Settings</h4><div class="vt-multicam-setting"><span>Resolution</span><select style="background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.1);padding:6px 12px;border-radius:8px;font-size:12px"><option>4K (2160p)</option><option>1080p</option><option>720p</option></select></div><div class="vt-multicam-setting"><span>Bitrate</span><select style="background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.1);padding:6px 12px;border-radius:8px;font-size:12px"><option>High (15 Mbps)</option><option>Medium (8 Mbps)</option><option>Low (4 Mbps)</option></select></div></div>
              </div>

              <!-- VIEW: AI Editor -->
              <div class="vt-dash-view" id="vt-guide-aieditor">
                <div class="vt-dash-header"><h2><i class="fas fa-magic" style="color:var(--orange);margin-right:8px"></i>AI Tour Editor</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div><div class="vt-dash-header-btn primary" onclick="vtToast('<i class=\\'fas fa-magic\\'></i> Generating new highlight reel...')">Generate Reel</div></div></div>
                <div class="vt-dash-stats"><div class="vt-dash-stat"><strong>6</strong><span>Auto Highlights</span><small>AI-generated</small></div><div class="vt-dash-stat"><strong>18</strong><span>Social Posts</span><small>Ready to share</small></div><div class="vt-dash-stat"><strong>4</strong><span>Thumbnails</span><small>Auto-created</small></div></div>
                <h4 style="color:rgba(255,255,255,.5);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:20px 0 12px">AI-Generated Clips</h4>
                <div class="vt-live-grid">
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-play\\'></i> Playing highlight reel...')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-live-card-badge" style="background:var(--orange)">AI Reel</div><div class="vt-live-card-cat">5:32</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Blue Lagoon Best Moments</div><div class="vt-live-card-guide">Auto-edited from Jun 10 session</div><div class="vt-live-card-foot"><span class="vt-live-card-price"><i class="fas fa-share"></i> Share</span><div class="vt-live-card-btn" onclick="event.stopPropagation();vtToast('<i class=\\'fas fa-download\\'></i> Downloading clip...')">Download</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-play\\'></i> Playing social clip...')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#8b4513,#d2691e)"><div class="vt-live-card-badge" style="background:var(--orange)">Social</div><div class="vt-live-card-cat">0:30</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Jerk Seasoning Close-Up</div><div class="vt-live-card-guide">Instagram/TikTok ready — 9:16</div><div class="vt-live-card-foot"><span class="vt-live-card-price"><i class="fas fa-share"></i> Share</span><div class="vt-live-card-btn" onclick="event.stopPropagation();vtToast('<i class=\\'fas fa-download\\'></i> Downloading clip...')">Download</div></div></div></div>
                </div>
              </div>

              <!-- VIEW: Dynamic Pricing -->
              <div class="vt-dash-view" id="vt-guide-pricing">
                <div class="vt-dash-header"><h2><i class="fas fa-tags" style="color:var(--orange);margin-right:8px"></i>Dynamic Pricing</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats"><div class="vt-dash-stat"><strong>$42</strong><span>Current Price</span><small>Blue Lagoon</small></div><div class="vt-dash-stat"><strong>HIGH</strong><span>Demand Level</span><small style="color:#22c55e">+28% bookings</small></div><div class="vt-dash-stat"><strong>$48</strong><span>AI Suggested</span><small>Surge pricing</small></div><div class="vt-dash-stat"><strong>$55</strong><span>VIP Price</span><small>Private sessions</small></div></div>
                <div class="vt-pricing-ctrl">
                  <h4 style="color:#fff;font-size:13px;margin-bottom:16px">Blue Lagoon Morning Walk</h4>
                  <div class="vt-pricing-row"><span>Base Price</span><div class="vt-pricing-val"><strong>$42</strong></div></div>
                  <div class="vt-pricing-row"><span>Min Price</span><input type="range" min="15" max="100" value="25" class="vt-pricing-slider" oninput="this.nextElementSibling.textContent='$'+this.value"><span class="vt-pricing-num">$25</span></div>
                  <div class="vt-pricing-row"><span>Max Price</span><input type="range" min="15" max="150" value="75" class="vt-pricing-slider" oninput="this.nextElementSibling.textContent='$'+this.value"><span class="vt-pricing-num">$75</span></div>
                  <div class="vt-pricing-row"><span>Auto-Surge</span><label class="vt-toggle" onclick="vtToast('<i class=\\'fas fa-bolt\\'></i> Auto-surge pricing '+(this.querySelector('input').checked?'disabled':'enabled'))"><input type="checkbox" checked><span class="vt-toggle-slider"></span></label></div>
                  <div class="vt-pricing-row"><span>Group Discount</span><label class="vt-toggle" onclick="vtToast('<i class=\\'fas fa-users\\'></i> Group discount '+(this.querySelector('input').checked?'disabled':'enabled'))"><input type="checkbox" checked><span class="vt-toggle-slider"></span></label></div>
                </div>
              </div>

"""

c = sr(c,
    """              <!-- VIEW: Analytics -->
              <div class="vt-dash-view" id="vt-guide-analytics">""",
    guide_new_views + """              <!-- VIEW: Analytics -->
              <div class="vt-dash-view" id="vt-guide-analytics">""",
    "Guide new views HTML")

# ================================================================
# 5. HOTSPOTS → HOVER INSTEAD OF CLICK
# ================================================================
print("\n=== 5. HOTSPOT HOVER ===")

# Blue Lagoon hotspots (YouTube scene)
for hs_id in ['hs1','hs2','hs3']:
    c = sr(c,
        f"onclick=\"vtShowHotspot(event,'{hs_id}')\"",
        f"onmouseenter=\"vtShowHotspot(event,'{hs_id}')\" onmouseleave=\"vtHideHotspot()\" onclick=\"vtToggleHotspot(event,'{hs_id}')\"",
        f"Hotspot {hs_id} → hover")

# Market scene hotspots
for hs_id in ['hs4','hs5','hs6','hs7']:
    c = sr(c,
        f"onclick=\"vtShowHotspot(event,'{hs_id}')\"",
        f"onmouseenter=\"vtShowHotspot(event,'{hs_id}')\" onmouseleave=\"vtHideHotspot()\" onclick=\"vtToggleHotspot(event,'{hs_id}')\"",
        f"Hotspot {hs_id} → hover")

# ================================================================
# 6. POINT AND ASK — Make it functional
# ================================================================
print("\n=== 6. POINT AND ASK ===")

c = sr(c,
    "<div class=\"vt-session-action\" onclick=\"vtSessionAction(this,'point')\"><i class=\"fas fa-hand-pointer\"></i>Point and Ask</div>",
    "<div class=\"vt-session-action\" id=\"vt-point-ask-btn\" onclick=\"vtTogglePointAsk(this)\"><i class=\"fas fa-hand-pointer\"></i>Point and Ask</div>",
    "Point and Ask button")

# ================================================================
# 7. ADD ALL NEW CSS
# ================================================================
print("\n=== 7. NEW FEATURE CSS ===")

new_css = """
/* ======== AI CONCIERGE ======== */
.vt-concierge{display:flex;flex-direction:column;height:400px;background:rgba(255,255,255,.02);border-radius:14px;border:1px solid rgba(255,255,255,.06);overflow:hidden}
.vt-concierge-chat{flex:1;overflow-y:auto;padding:16px}
.vt-ai-msg{display:flex;gap:10px;margin-bottom:14px}
.vt-ai-msg.user{flex-direction:row-reverse}
.vt-ai-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--orange),#ff8d47);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;flex-shrink:0}
.vt-ai-msg.user .vt-ai-avatar{background:linear-gradient(135deg,#1a3a5c,#0d5371)}
.vt-ai-bubble{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:10px 14px;color:rgba(255,255,255,.8);font-size:12px;line-height:1.6;max-width:80%}
.vt-ai-msg.user .vt-ai-bubble{background:rgba(239,135,49,.12);border-color:rgba(239,135,49,.15)}
.vt-ai-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 0}
.vt-ai-chip{padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;color:var(--orange);background:rgba(239,135,49,.08);border:1px solid rgba(239,135,49,.15);cursor:pointer;transition:all .2s}
.vt-ai-chip:hover{background:rgba(239,135,49,.15)}
.vt-ai-input-wrap{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.15)}
.vt-ai-input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:10px 18px;color:#fff;font-size:12px;outline:none;font-family:inherit}
.vt-ai-input:focus{border-color:var(--orange)}
.vt-ai-send{width:36px;height:36px;border-radius:50%;background:var(--orange);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .2s;flex-shrink:0}
.vt-ai-send:hover{transform:scale(1.1)}
.vt-ai-typing{display:flex;gap:4px;padding:8px 14px}.vt-ai-typing span{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.3);animation:vtTypeDot 1.2s ease infinite}.vt-ai-typing span:nth-child(2){animation-delay:.2s}.vt-ai-typing span:nth-child(3){animation-delay:.4s}
@keyframes vtTypeDot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}

/* ======== VIRTUAL PASSPORT ======== */
.vt-passport-tier{display:flex;align-items:center;gap:14px;padding:16px;background:rgba(255,255,255,.03);border-radius:14px;border:1px solid rgba(255,255,255,.06);margin-bottom:8px;flex-wrap:wrap}
.vt-passport-tier-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px}
.vt-passport-tier-icon.gold{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff}
.vt-passport-tier-info{flex:1;min-width:120px}
.vt-passport-tier-info strong{color:#fff;font-size:15px;display:block}
.vt-passport-tier-info span{color:rgba(255,255,255,.4);font-size:11px}
.vt-passport-xp{flex-basis:100%;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;margin-top:8px}
.vt-passport-xp-fill{height:100%;background:linear-gradient(90deg,var(--orange),#f59e0b);border-radius:3px;transition:width .6s}
.vt-passport-xp-label{flex-basis:100%;font-size:10px;color:rgba(255,255,255,.35);margin-top:4px}
.vt-passport-stamps{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px}
.vt-stamp{text-align:center;padding:14px 8px;background:rgba(255,255,255,.02);border-radius:12px;border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s;opacity:.4}
.vt-stamp.collected{opacity:1;border-color:rgba(239,135,49,.2)}
.vt-stamp:hover{transform:translateY(-2px);border-color:rgba(239,135,49,.3)}
.vt-stamp-icon{width:40px;height:40px;border-radius:50%;background:rgba(239,135,49,.12);margin:0 auto 6px;display:flex;align-items:center;justify-content:center;color:var(--orange);font-size:16px}
.vt-stamp-icon.locked{background:rgba(255,255,255,.04);color:rgba(255,255,255,.2)}
.vt-stamp span{display:block;color:#fff;font-size:10px;font-weight:600}
.vt-stamp small{color:rgba(255,255,255,.35);font-size:9px}
.vt-passport-badges{display:flex;flex-wrap:wrap;gap:10px}
.vt-badge{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 16px;background:rgba(255,255,255,.02);border-radius:12px;border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s;opacity:.35;min-width:70px}
.vt-badge.earned{opacity:1;border-color:rgba(239,135,49,.2)}
.vt-badge:hover{transform:translateY(-2px)}
.vt-badge i{font-size:18px;color:var(--orange)}
.vt-badge span{font-size:9px;color:rgba(255,255,255,.6);font-weight:600;text-align:center}

/* ======== SOCIAL FEED ======== */
.vt-social-online{margin-bottom:20px}
.vt-social-online-label{font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.vt-social-friends{display:flex;flex-direction:column;gap:6px}
.vt-social-friend{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.03);border-radius:10px;border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s}
.vt-social-friend:hover{background:rgba(255,255,255,.06)}
.vt-social-friend-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--orange),#ff8d47);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}
.vt-social-friend-avatar.off{background:rgba(255,255,255,.1);color:rgba(255,255,255,.4)}
.vt-social-friend-info{flex:1}
.vt-social-friend-info strong{color:#fff;font-size:12px;display:block}
.vt-social-friend-info span{color:rgba(255,255,255,.35);font-size:10px}
.vt-social-friend-info span.live{color:#22c55e}
.vt-social-friend-action{padding:4px 12px;border-radius:8px;background:var(--orange);color:#fff;font-size:10px;font-weight:700;cursor:pointer}
.vt-social-feed-label{font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px}
.vt-social-feed{display:flex;flex-direction:column;gap:8px}
.vt-social-post{display:flex;gap:10px;padding:12px;background:rgba(255,255,255,.02);border-radius:10px;border:1px solid rgba(255,255,255,.04)}
.vt-social-post-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1a3a5c,#0d5371);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0}
.vt-social-post-body{flex:1}
.vt-social-post-body strong{color:#fff;font-size:12px}
.vt-social-post-body em{color:var(--orange);font-style:normal;font-weight:600}
.vt-social-post-body .stars{color:#f59e0b}
.vt-social-post-time{font-size:10px;color:rgba(255,255,255,.25);margin-top:2px}
.vt-social-post-text{color:rgba(255,255,255,.5);font-size:11px;margin-top:6px;line-height:1.5;font-style:italic}
.vt-social-post-actions{display:flex;gap:6px;margin-top:8px}
.vt-social-post-btn{padding:5px 14px;border-radius:8px;font-size:10px;font-weight:700;background:var(--orange);color:#fff;cursor:pointer;transition:all .2s}
.vt-social-post-btn.sec{background:rgba(255,255,255,.06);color:rgba(255,255,255,.6)}
.vt-social-post-btn:hover{transform:translateY(-1px)}

/* ======== SENTIMENT METER ======== */
.vt-sentiment-meter{margin:20px 0 12px;padding:16px;background:rgba(255,255,255,.03);border-radius:12px;border:1px solid rgba(255,255,255,.06)}
.vt-sentiment-label{font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px}
.vt-sentiment-bar{height:24px;background:rgba(255,255,255,.06);border-radius:12px;overflow:hidden}
.vt-sentiment-fill{height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:12px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width .5s}
.vt-sentiment-fill span{color:#fff;font-size:10px;font-weight:700}
.vt-sentiment-emojis{display:flex;flex-wrap:wrap;gap:12px;padding:16px 0;justify-content:center}
.vt-emoji-float{font-size:24px;animation:vtEmojiPop 2s ease infinite}
@keyframes vtEmojiPop{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.15)}}
.vt-sentiment-keywords{padding:16px;background:rgba(255,255,255,.02);border-radius:12px;border:1px solid rgba(255,255,255,.04);text-align:center}
.vt-sentiment-kw-title{font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:12px}
.vt-kw{display:inline-block;color:rgba(255,255,255,.6);margin:4px 8px;font-weight:600}

/* ======== TIP/GIFT STREAM ======== */
.vt-gift-stream{display:flex;flex-direction:column;gap:6px}
.vt-gift-item{display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,.02);border-radius:10px;border:1px solid rgba(255,255,255,.04);transition:all .2s}
.vt-gift-item:hover{background:rgba(255,255,255,.04)}
.vt-gift-emoji{font-size:24px}
.vt-gift-info{flex:1}
.vt-gift-info strong{color:#fff;font-size:12px}
.vt-gift-info small{display:block;color:rgba(255,255,255,.35);font-size:10px;margin-top:2px}

/* ======== MULTI-CAM ======== */
.vt-multicam-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:20px}
.vt-multicam-card{border-radius:12px;overflow:hidden;border:2px solid rgba(255,255,255,.06);cursor:pointer;transition:all .25s}
.vt-multicam-card:hover{border-color:rgba(255,255,255,.15);transform:translateY(-2px)}
.vt-multicam-card.active{border-color:var(--orange);box-shadow:0 0 20px rgba(239,135,49,.2)}
.vt-multicam-preview{height:100px;display:flex;align-items:center;justify-content:center;position:relative}
.vt-multicam-live{position:absolute;top:8px;right:8px;background:#ef4444;color:#fff;font-size:8px;font-weight:800;padding:3px 8px;border-radius:6px;text-transform:uppercase}
.vt-multicam-label{padding:10px;background:rgba(0,0,0,.2)}
.vt-multicam-label strong{color:#fff;font-size:12px;display:block}
.vt-multicam-label span{color:rgba(255,255,255,.4);font-size:10px}
.vt-multicam-settings{padding:16px;background:rgba(255,255,255,.02);border-radius:12px;border:1px solid rgba(255,255,255,.06)}
.vt-multicam-setting{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.vt-multicam-setting:last-child{border:none}
.vt-multicam-setting span{color:rgba(255,255,255,.5);font-size:12px}

/* ======== PRICING CONTROLS ======== */
.vt-pricing-ctrl{padding:20px;background:rgba(255,255,255,.03);border-radius:14px;border:1px solid rgba(255,255,255,.06);margin-top:16px}
.vt-pricing-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.vt-pricing-row:last-child{border:none}
.vt-pricing-row span{color:rgba(255,255,255,.5);font-size:12px;min-width:80px}
.vt-pricing-val strong{color:#fff;font-size:18px;font-weight:800}
.vt-pricing-slider{flex:1;margin:0 12px;accent-color:var(--orange)}
.vt-pricing-num{color:var(--orange);font-size:13px;font-weight:700;min-width:30px;text-align:right}
.vt-toggle{position:relative;width:40px;height:22px;display:inline-block;cursor:pointer}
.vt-toggle input{display:none}
.vt-toggle-slider{position:absolute;inset:0;background:rgba(255,255,255,.15);border-radius:11px;transition:all .3s}
.vt-toggle-slider::after{content:'';position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:all .3s}
.vt-toggle input:checked+.vt-toggle-slider{background:var(--orange)}
.vt-toggle input:checked+.vt-toggle-slider::after{left:21px}

/* ======== POINT AND ASK ======== */
.vt-point-ask-active .vt-session-video{cursor:crosshair!important}
.vt-point-ask-active .vt-yt-iframe{pointer-events:none}
.vt-point-pin{position:absolute;z-index:18;transform:translate(-50%,-100%);animation:vtPinDrop .4s cubic-bezier(.34,1.56,.64,1)}
.vt-point-pin i{font-size:24px;color:var(--orange);filter:drop-shadow(0 2px 8px rgba(0,0,0,.5))}
@keyframes vtPinDrop{0%{opacity:0;transform:translate(-50%,-100%) translateY(-20px)}100%{opacity:1;transform:translate(-50%,-100%) translateY(0)}}
.vt-point-ask-box{position:absolute;z-index:19;background:rgba(13,27,42,.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;width:240px;box-shadow:0 12px 32px rgba(0,0,0,.4)}
.vt-point-ask-box input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 12px;color:#fff;font-size:12px;outline:none;font-family:inherit;margin-bottom:8px}
.vt-point-ask-box input:focus{border-color:var(--orange)}
.vt-point-ask-box .vt-point-response{color:rgba(255,255,255,.7);font-size:11px;line-height:1.5}
.vt-point-ask-box .vt-point-close{position:absolute;top:6px;right:8px;color:rgba(255,255,255,.4);cursor:pointer;font-size:11px}

"""

c = sr(c,
    '/* ======== V-TOURS RESPONSIVE ======== */',
    new_css + '/* ======== V-TOURS RESPONSIVE ======== */',
    "Insert all new feature CSS")

# ================================================================
# 8. ADD ALL NEW JS
# ================================================================
print("\n=== 8. NEW FEATURE JS ===")

new_js = """
/* ═══════ AI CONCIERGE ═══════ */
var vtAIResponses={
  'food tours under $40':['Great pick! Here are your options:','<strong>Kingston Jerk and Ackee Class</strong> — USD $38 with Chef Anita. Live now!<br><strong>Bridgetown Market Tour</strong> — USD $28 with Sandra Browne. Today 3 PM.<br><br>Want me to book one of these for you?'],
  'best nature experiences':['Nature is our specialty! Top picks:','<strong>Blue Lagoon Morning Walk</strong> — USD $42, stunning 360° lagoon views<br><strong>Rio Grande River Raft Tour</strong> — USD $55, bamboo rafting through rainforest<br><strong>Portland Waterfalls</strong> — USD $38, hidden waterfalls and swimming holes<br><br>The Blue Lagoon tour is live right now — want to join?'],
  'weekend tours available':['This weekend looks packed! Here is what is open:','<strong>Saturday 7:30 AM</strong> — Rio Grande River Raft Tour ($55, 9 seats left)<br><strong>Sunday 10 AM</strong> — Reggae Music Production Class ($30, 20 seats)<br><br>Want me to reserve a spot?'],
  'family-friendly options':['Perfect for families! These tours are rated all-ages:','<strong>Devon House Heritage Tour</strong> — $35, ice cream tasting included!<br><strong>Blue Lagoon Morning Walk</strong> — $42, gentle pace, safe for all ages<br><strong>Craft Market Tour</strong> — $28, hands-on shopping experience<br><br>Kids under 12 get 50% off!']
};
function vtAskAI(text){
  var chat=document.getElementById('vt-concierge-chat');if(!chat)return;
  chat.innerHTML+='<div class="vt-ai-msg user"><div class="vt-ai-avatar"><i class="fas fa-user"></i></div><div class="vt-ai-bubble">'+text+'</div></div>';
  chat.innerHTML+='<div class="vt-ai-msg bot" id="vt-ai-typing"><div class="vt-ai-avatar"><i class="fas fa-robot"></i></div><div class="vt-ai-bubble"><div class="vt-ai-typing"><span></span><span></span><span></span></div></div></div>';
  chat.scrollTop=chat.scrollHeight;
  var key=text.toLowerCase();
  var resp=vtAIResponses[key]||['Interesting question!','I would recommend checking out our <strong>Browse Tours</strong> section for the latest options. You can filter by price, category, and availability. Would you like me to help narrow it down?'];
  setTimeout(function(){
    var t=document.getElementById('vt-ai-typing');if(t)t.remove();
    chat.innerHTML+='<div class="vt-ai-msg bot"><div class="vt-ai-avatar"><i class="fas fa-robot"></i></div><div class="vt-ai-bubble">'+resp[0]+'<br><br>'+resp[1]+'</div></div>';
    chat.scrollTop=chat.scrollHeight;
  },1200);
}
function vtSendAI(){
  var f=document.getElementById('vt-ai-field');if(!f||!f.value.trim())return;
  vtAskAI(f.value.trim());f.value='';
}

/* ═══════ HOTSPOT HOVER ═══════ */
var vtHotspotTimer=null;
function vtHideHotspot(){
  vtHotspotTimer=setTimeout(function(){
    document.getElementById('vt-hotspot-popup').classList.remove('show');vtCurrentHotspot=null;
  },300);
}
function vtToggleHotspot(e,id){
  e.stopPropagation();
  var popup=document.getElementById('vt-hotspot-popup');
  if(popup.classList.contains('show')&&vtCurrentHotspot===id){vtCloseHotspot();return}
  vtShowHotspot(e,id);
}
(function(){
  var popup=document.getElementById('vt-hotspot-popup');
  if(popup){popup.addEventListener('mouseenter',function(){if(vtHotspotTimer)clearTimeout(vtHotspotTimer)});popup.addEventListener('mouseleave',function(){vtHideHotspot()})}
})();

/* ═══════ MULTI-CAM SELECT ═══════ */
function vtSelectCam(el,num){
  document.querySelectorAll('.vt-multicam-card').forEach(function(c){c.classList.remove('active');var lv=c.querySelector('.vt-multicam-live');if(lv)lv.remove()});
  el.classList.add('active');
  var prev=el.querySelector('.vt-multicam-preview');
  var lv=document.createElement('div');lv.className='vt-multicam-live';lv.textContent='ACTIVE';
  prev.appendChild(lv);
  var names=['','Handheld','Chest Mount','Drone'];
  vtToast('<i class="fas fa-video"></i> Switched to '+names[num]+' camera');
}

/* ═══════ POINT AND ASK ═══════ */
var vtPointAskMode=false;
function vtTogglePointAsk(btn){
  vtPointAskMode=!vtPointAskMode;
  var session=document.getElementById('vt-active-session');
  if(vtPointAskMode){
    session.classList.add('vt-point-ask-active');
    btn.style.background='var(--orange)';btn.style.color='#fff';
    vtToast('<i class="fas fa-crosshairs"></i> Point and Ask mode ON — click anywhere on the tour to ask a question');
  } else {
    session.classList.remove('vt-point-ask-active');
    btn.style.background='';btn.style.color='';
    document.querySelectorAll('.vt-point-pin,.vt-point-ask-box').forEach(function(e){e.remove()});
    vtToast('<i class="fas fa-times"></i> Point and Ask mode OFF');
  }
}
document.addEventListener('click',function(e){
  if(!vtPointAskMode)return;
  var vid=e.target.closest('.vt-session-video');
  if(!vid||e.target.closest('.vt-hotspot')||e.target.closest('.vt-point-ask-box')||e.target.closest('.vt-scene-btn'))return;
  document.querySelectorAll('.vt-point-pin,.vt-point-ask-box').forEach(function(el){el.remove()});
  var rect=vid.getBoundingClientRect();
  var x=e.clientX-rect.left;var y=e.clientY-rect.top;
  var pin=document.createElement('div');pin.className='vt-point-pin';pin.style.left=x+'px';pin.style.top=y+'px';
  pin.innerHTML='<i class="fas fa-map-pin"></i>';vid.appendChild(pin);
  var box=document.createElement('div');box.className='vt-point-ask-box';
  box.style.left=Math.min(x+20,vid.offsetWidth-260)+'px';box.style.top=Math.max(y-60,10)+'px';
  box.innerHTML='<div class="vt-point-close" onclick="this.parentElement.remove();document.querySelector(\\'.vt-point-pin\\').remove()"><i class="fas fa-times"></i></div><input type="text" placeholder="What is this? Ask anything..." onkeydown="if(event.key===\\'Enter\\')vtPointAnswer(this)"><div class="vt-point-response"></div>';
  vid.appendChild(box);
  box.querySelector('input').focus();
});
var vtPointAnswers=['That looks like a Blue Mahoe tree, Jamaica\\'s national tree. They grow up to 25 meters tall and produce beautiful blue-green wood!','This is a typical Jamaican fishing beach. Local fishermen launch their boats here every morning around 5 AM.','You are looking at the famous Blue Lagoon — the water appears turquoise because of a mix of fresh spring water and warm Caribbean seawater.','That structure is a traditional Jamaican jerk pit, where meat is slow-smoked over pimento wood for hours.','Those are sea grape trees along the shoreline. The leaves are used in traditional Caribbean cooking.'];
function vtPointAnswer(input){
  var resp=input.nextElementSibling;
  resp.innerHTML='<div class="vt-ai-typing" style="padding:4px 0"><span></span><span></span><span></span></div>';
  setTimeout(function(){
    resp.innerHTML=vtPointAnswers[Math.floor(Math.random()*vtPointAnswers.length)];
  },1000);
}

"""

c = sr(c,
    '/* ═══════ AUTO-START STREAM ON PAGE LOAD ═══════ */',
    new_js + '/* ═══════ AUTO-START STREAM ON PAGE LOAD ═══════ */',
    "Insert all new feature JS")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes applied.")
