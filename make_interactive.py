#!/usr/bin/env python3
"""Make the Explorer Dashboard and Guide Portal fully interactive."""

path = 'Design_Reference.html'
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. Additional CSS for interactive states ───────────────────────
extra_css = """
/* ======== INTERACTIVE DASHBOARD ENHANCEMENTS ======== */
.vt-dash-sidebar a{cursor:pointer;transition:all .25s ease}
.vt-dash-sidebar a:hover{background:rgba(239,135,49,.08);color:var(--orange)!important}
.vt-dash-sidebar a.active{pointer-events:auto}
.vt-dash-header-btn{cursor:pointer;transition:all .25s}
.vt-dash-header-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
.vt-dash-header-btn.primary:hover{box-shadow:0 4px 16px rgba(239,135,49,.35)}
.vt-live-card{cursor:pointer;transition:transform .35s cubic-bezier(.25,.46,.45,.94),box-shadow .35s}
.vt-live-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.12)}
.vt-live-card-btn{cursor:pointer;transition:all .25s}
.vt-live-card-btn:hover{transform:scale(1.05);box-shadow:0 4px 12px rgba(239,135,49,.3)}
.vt-session-action{cursor:pointer;transition:all .3s cubic-bezier(.25,.46,.45,.94)}
.vt-session-action:hover{transform:translateY(-4px);box-shadow:0 8px 20px rgba(0,0,0,.1);background:var(--orange)!important;color:#fff!important}
.vt-session-action:hover i{color:#fff!important}
.vt-session-action.clicked{animation:vtActionPulse .5s ease}
@keyframes vtActionPulse{0%{transform:scale(1)}50%{transform:scale(.92);opacity:.7}100%{transform:scale(1);opacity:1}}
.vt-session-shop-add{cursor:pointer;transition:all .25s}
.vt-session-shop-add:hover{background:var(--orange);color:#fff;transform:scale(1.08)}
.vt-session-shop-add.added{background:#22c55e!important;color:#fff!important}
.vt-session-bar-btn{cursor:pointer;transition:all .25s}
.vt-session-bar-btn:hover{opacity:.85;transform:scale(1.04)}

.vt-chat-input-wrap{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.06);background:#fff}
.vt-chat-input{flex:1;border:1px solid rgba(0,0,0,.1);border-radius:20px;padding:8px 16px;font-size:12px;outline:none;font-family:inherit;transition:border-color .2s}
.vt-chat-input:focus{border-color:var(--orange)}
.vt-chat-send{width:32px;height:32px;border-radius:50%;background:var(--orange);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .2s;flex-shrink:0}
.vt-chat-send:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(239,135,49,.4)}
body.theme-night .vt-chat-input-wrap{background:#0d1b2a;border-color:rgba(255,255,255,.06)}
body.theme-night .vt-chat-input{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);color:#fff}

.vt-toast{position:fixed;bottom:30px;right:30px;background:var(--navy);color:#fff;padding:14px 24px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;transform:translateY(80px);opacity:0;transition:all .4s cubic-bezier(.25,.46,.45,.94);pointer-events:none;box-shadow:0 12px 32px rgba(0,0,0,.2)}
.vt-toast.show{transform:translateY(0);opacity:1}
.vt-toast i{margin-right:8px;color:var(--orange)}

.vt-session-video-label{transition:opacity .3s}
.vt-video-playing .vt-session-video-label{opacity:.15}
.vt-video-playing{background:linear-gradient(135deg,#0b4d3a,#1a8a6e,#0b4d3a)!important;background-size:300% 300%!important;animation:vtVideoShimmer 4s ease infinite!important}
@keyframes vtVideoShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.vt-video-playing .vt-session-video-overlay{opacity:1!important}
.vt-video-playing::after{content:'';position:absolute;top:12px;right:12px;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.3);animation:vtRecPulse 1.5s ease infinite}
@keyframes vtRecPulse{0%,100%{opacity:1}50%{opacity:.4}}

.vt-viewer-count{transition:all .3s}
.vt-guide-table tr{cursor:pointer;transition:background .2s}
.vt-guide-table tbody tr:hover{background:rgba(239,135,49,.06)}
.vt-status{cursor:pointer;transition:transform .2s}
.vt-status:hover{transform:scale(1.08)}

.vt-chart-bar{cursor:pointer;transition:all .3s;position:relative}
.vt-chart-bar:hover{opacity:.8;transform:scaleY(1.05)}
.vt-chart-bar-tip{position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:10px;padding:3px 8px;border-radius:6px;white-space:nowrap;opacity:0;transition:opacity .2s;pointer-events:none}
.vt-chart-bar:hover .vt-chart-bar-tip{opacity:1}

.vt-schedule-item{cursor:pointer;transition:all .25s}
.vt-schedule-item:hover{background:rgba(239,135,49,.04);transform:translateX(4px)}

.vt-dash-view{display:none;animation:vtFadeIn .4s ease}
.vt-dash-view.active{display:block}

.vt-empty-state{text-align:center;padding:60px 20px;color:#94a3b8}
.vt-empty-state i{font-size:48px;margin-bottom:16px;opacity:.3;display:block}
.vt-empty-state h4{font-size:16px;color:var(--navy);margin-bottom:8px}
.vt-empty-state p{font-size:13px}
body.theme-night .vt-empty-state h4{color:#fff}
"""

css_marker = '/* ======== V-TOURS DASHBOARD TABS ======== */'
src = src.replace(css_marker, extra_css + '\n' + css_marker)

# ── 2. Replace Explorer Dashboard HTML with interactive version ────
old_explorer = '''<div class="vt-dash-showcase reveal">
        <div class="vt-dash-frame">
          <div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Explorer Portal</div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar">
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Main</div>
                <a href="#" class="active" onclick="return false"><i class="fas fa-compass"></i> Explore</a>
                <a href="#" onclick="return false"><i class="fas fa-binoculars"></i> Browse Tours</a>
                <a href="#" onclick="return false"><i class="fas fa-calendar-check"></i> My Bookings <span class="badge">3</span></a>
                <a href="#" onclick="return false"><i class="fas fa-heart"></i> Favorites</a>
                <a href="#" onclick="return false"><i class="fas fa-history"></i> History</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Account</div>
                <a href="#" onclick="return false"><i class="fas fa-user"></i> Profile</a>
                <a href="#" onclick="return false"><i class="fas fa-cog"></i> Settings</a>
              </div>
              <div class="vt-dash-avatar">
                <div class="vt-dash-avatar-circle">SA</div>
                <div class="vt-dash-avatar-info">Sarah A.<span>Explorer Member</span></div>
              </div>
            </div>
            <div class="vt-dash-main">
              <div class="vt-dash-header">
                <h2>Explore / Live Now</h2>
                <div class="vt-dash-header-actions">
                  <div class="vt-dash-header-btn">Browse All</div>
                  <div class="vt-dash-header-btn primary">Schedule Tour</div>
                </div>
              </div>
              <div class="vt-dash-stats">
                <div class="vt-dash-stat"><strong>12</strong><span>Tours Taken</span><small>2 this month</small></div>
                <div class="vt-dash-stat"><strong>5</strong><span>Countries Visited</span><small>3 Caribbean</small></div>
                <div class="vt-dash-stat"><strong>7</strong><span>Items Purchased</span><small>via in-session shop</small></div>
                <div class="vt-dash-stat"><strong>2</strong><span>Upcoming</span><small>Next: Thu 10am</small></div>
              </div>
              <div class="vt-live-header"><h3><span class="vt-dash-live-dot"></span>Live Right Now</h3><a href="#" onclick="return false">See all 8 live sessions</a></div>
              <div class="vt-live-grid">
                <div class="vt-live-card">
                  <div class="vt-live-card-img" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Nature and Outdoors</div></div>
                  <div class="vt-live-card-body"><div class="vt-live-card-title">Blue Lagoon Morning Walk</div><div class="vt-live-card-guide">Marcus Thompson, Portland, Jamaica</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $42</span><div class="vt-live-card-btn">Join Live</div></div></div>
                </div>
                <div class="vt-live-card">
                  <div class="vt-live-card-img" style="background:linear-gradient(135deg,#8b4513,#d2691e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Food and Drink</div></div>
                  <div class="vt-live-card-body"><div class="vt-live-card-title">Kingston Jerk and Ackee Class</div><div class="vt-live-card-guide">Chef Anita Murray, Kingston, Jamaica</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $38</span><div class="vt-live-card-btn">Join Live</div></div></div>
                </div>
                <div class="vt-live-card">
                  <div class="vt-live-card-img" style="background:linear-gradient(135deg,#2563eb,#7c3aed)"><div class="vt-live-card-badge scheduled">3:00 PM</div><div class="vt-live-card-cat">Personal Shopping</div></div>
                  <div class="vt-live-card-body"><div class="vt-live-card-title">Bridgetown Market Tour</div><div class="vt-live-card-guide">Sandra Browne, Bridgetown, Barbados</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $28</span><div class="vt-live-card-btn alt">Book Seat</div></div></div>
                </div>
              </div>

              <!-- Active Session -->
              <div class="vt-live-header"><h3>Your Active Session</h3></div>
              <div class="vt-session">
                <div class="vt-session-bar">
                  <div class="vt-session-bar-left"><span class="vt-dash-live-dot"></span>Blue Lagoon Morning Walk &mdash; Marcus Thompson</div>
                  <div class="vt-session-bar-right"><div class="vt-session-bar-btn leave">Leave Session</div></div>
                </div>
                <div class="vt-session-content">
                  <div>
                    <div class="vt-session-video">
                      <div class="vt-session-video-label">
                        <i class="fas fa-video" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>
                        Live Guide POV Stream<br><small style="opacity:.5">Port Antonio, Portland, Jamaica</small>
                      </div>
                      <div class="vt-session-video-overlay">
                        <div class="vt-session-location">Port Antonio &bull; Portland &bull; Jamaica</div>
                        <div class="vt-session-viewers"><i class="fas fa-eye"></i> 247 watching</div>
                      </div>
                    </div>
                    <div class="vt-session-actions">
                      <div class="vt-session-action"><i class="fas fa-shopping-bag"></i>Shop Now</div>
                      <div class="vt-session-action"><i class="fas fa-camera"></i>Capture Photo</div>
                      <div class="vt-session-action"><i class="fas fa-hand-pointer"></i>Point and Ask</div>
                      <div class="vt-session-action"><i class="fas fa-user-plus"></i>Invite Friend</div>
                    </div>
                  </div>
                  <div class="vt-session-side">
                    <div class="vt-session-chat">
                      <div class="vt-session-chat-title">Live Chat <span>247 watching</span></div>
                      <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">S</div><div class="vt-session-chat-text">What is that blue plant? Beautiful!</div></div>
                      <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar guide">M</div><div class="vt-session-chat-text">That is Blue Mahoe, Jamaica's national tree!</div></div>
                      <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">J</div><div class="vt-session-chat-text">Can I buy that woven basket behind you?</div></div>
                      <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">R</div><div class="vt-session-chat-text">This feels like I am really there</div></div>
                    </div>
                    <div class="vt-session-shop">
                      <div class="vt-session-shop-title">In-Session Shop</div>
                      <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Handwoven Market Basket</div><div class="vt-session-shop-item-price">USD $28.00</div></div><div class="vt-session-shop-add">Add</div></div>
                      <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Blue Mahoe Botanical Print</div><div class="vt-session-shop-item-price">USD $45.00</div></div><div class="vt-session-shop-add">Add</div></div>
                      <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Jamaican Spice Collection</div><div class="vt-session-shop-item-price">USD $22.00</div></div><div class="vt-session-shop-add">Add</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>'''

new_explorer = '''<div class="vt-dash-showcase reveal">
        <div class="vt-dash-frame" id="vt-explorer-frame">
          <div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Explorer Portal</div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-exp-sidebar">
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Main</div>
                <a href="#" class="active" onclick="vtExpNav('explore',this);return false"><i class="fas fa-compass"></i> Explore</a>
                <a href="#" onclick="vtExpNav('browse',this);return false"><i class="fas fa-binoculars"></i> Browse Tours</a>
                <a href="#" onclick="vtExpNav('bookings',this);return false"><i class="fas fa-calendar-check"></i> My Bookings <span class="badge">3</span></a>
                <a href="#" onclick="vtExpNav('favorites',this);return false"><i class="fas fa-heart"></i> Favorites</a>
                <a href="#" onclick="vtExpNav('history',this);return false"><i class="fas fa-history"></i> History</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Account</div>
                <a href="#" onclick="vtExpNav('profile',this);return false"><i class="fas fa-user"></i> Profile</a>
                <a href="#" onclick="vtExpNav('settings',this);return false"><i class="fas fa-cog"></i> Settings</a>
              </div>
              <div class="vt-dash-avatar">
                <div class="vt-dash-avatar-circle">SA</div>
                <div class="vt-dash-avatar-info">Sarah A.<span>Explorer Member</span></div>
              </div>
            </div>
            <div class="vt-dash-main" id="vt-exp-main">

              <!-- VIEW: Explore (default) -->
              <div class="vt-dash-view active" id="vt-exp-explore">
                <div class="vt-dash-header">
                  <h2>Explore / Live Now</h2>
                  <div class="vt-dash-header-actions">
                    <div class="vt-dash-header-btn" onclick="vtExpNav('browse',document.querySelector('#vt-exp-sidebar a:nth-child(3)'))">Browse All</div>
                    <div class="vt-dash-header-btn primary" onclick="vtToast('<i class=\\'fas fa-calendar-check\\'></i> Tour scheduler coming soon!')">Schedule Tour</div>
                  </div>
                </div>
                <div class="vt-dash-stats">
                  <div class="vt-dash-stat"><strong>12</strong><span>Tours Taken</span><small>2 this month</small></div>
                  <div class="vt-dash-stat"><strong>5</strong><span>Countries Visited</span><small>3 Caribbean</small></div>
                  <div class="vt-dash-stat"><strong id="vt-exp-items">7</strong><span>Items Purchased</span><small>via in-session shop</small></div>
                  <div class="vt-dash-stat"><strong>2</strong><span>Upcoming</span><small>Next: Thu 10am</small></div>
                </div>
                <div class="vt-live-header"><h3><span class="vt-dash-live-dot"></span>Live Right Now</h3><a href="#" onclick="vtExpNav('browse',document.querySelector('#vt-exp-sidebar a:nth-child(3)'));return false">See all 8 live sessions</a></div>
                <div class="vt-live-grid">
                  <div class="vt-live-card" onclick="vtJoinSession('blue-lagoon')">
                    <div class="vt-live-card-img" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Nature and Outdoors</div></div>
                    <div class="vt-live-card-body"><div class="vt-live-card-title">Blue Lagoon Morning Walk</div><div class="vt-live-card-guide">Marcus Thompson, Portland, Jamaica</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $42</span><div class="vt-live-card-btn" onclick="event.stopPropagation();vtJoinSession('blue-lagoon')">Join Live</div></div></div>
                  </div>
                  <div class="vt-live-card" onclick="vtJoinSession('kingston-jerk')">
                    <div class="vt-live-card-img" style="background:linear-gradient(135deg,#8b4513,#d2691e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Food and Drink</div></div>
                    <div class="vt-live-card-body"><div class="vt-live-card-title">Kingston Jerk and Ackee Class</div><div class="vt-live-card-guide">Chef Anita Murray, Kingston, Jamaica</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $38</span><div class="vt-live-card-btn" onclick="event.stopPropagation();vtJoinSession('kingston-jerk')">Join Live</div></div></div>
                  </div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Session starts at 3:00 PM. Seat reserved!')">
                    <div class="vt-live-card-img" style="background:linear-gradient(135deg,#2563eb,#7c3aed)"><div class="vt-live-card-badge scheduled">3:00 PM</div><div class="vt-live-card-cat">Personal Shopping</div></div>
                    <div class="vt-live-card-body"><div class="vt-live-card-title">Bridgetown Market Tour</div><div class="vt-live-card-guide">Sandra Browne, Bridgetown, Barbados</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $28</span><div class="vt-live-card-btn alt" onclick="event.stopPropagation();vtToast('<i class=\\'fas fa-check-circle\\'></i> Seat booked for 3:00 PM!')">Book Seat</div></div></div>
                  </div>
                </div>

                <!-- Active Session -->
                <div class="vt-live-header"><h3>Your Active Session</h3></div>
                <div class="vt-session" id="vt-active-session">
                  <div class="vt-session-bar">
                    <div class="vt-session-bar-left"><span class="vt-dash-live-dot"></span><span id="vt-session-title">Blue Lagoon Morning Walk</span> &mdash; <span id="vt-session-guide">Marcus Thompson</span></div>
                    <div class="vt-session-bar-right"><div class="vt-session-bar-btn leave" onclick="vtLeaveSession()">Leave Session</div></div>
                  </div>
                  <div class="vt-session-content">
                    <div>
                      <div class="vt-session-video" id="vt-session-video" onclick="vtToggleVideo()" style="cursor:pointer">
                        <div class="vt-session-video-label">
                          <i class="fas fa-video" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>
                          Live Guide POV Stream<br><small style="opacity:.5">Click to simulate live feed</small>
                        </div>
                        <div class="vt-session-video-overlay">
                          <div class="vt-session-location" id="vt-session-loc">Port Antonio &bull; Portland &bull; Jamaica</div>
                          <div class="vt-session-viewers"><i class="fas fa-eye"></i> <span id="vt-viewer-count">247</span> watching</div>
                        </div>
                      </div>
                      <div class="vt-session-actions">
                        <div class="vt-session-action" onclick="vtSessionAction(this,'shop')"><i class="fas fa-shopping-bag"></i>Shop Now</div>
                        <div class="vt-session-action" onclick="vtSessionAction(this,'capture')"><i class="fas fa-camera"></i>Capture Photo</div>
                        <div class="vt-session-action" onclick="vtSessionAction(this,'point')"><i class="fas fa-hand-pointer"></i>Point and Ask</div>
                        <div class="vt-session-action" onclick="vtSessionAction(this,'invite')"><i class="fas fa-user-plus"></i>Invite Friend</div>
                      </div>
                    </div>
                    <div class="vt-session-side">
                      <div class="vt-session-chat" id="vt-chat-box">
                        <div class="vt-session-chat-title">Live Chat <span id="vt-chat-viewers">247 watching</span></div>
                        <div id="vt-chat-messages">
                          <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">S</div><div class="vt-session-chat-text">What is that blue plant? Beautiful!</div></div>
                          <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar guide">M</div><div class="vt-session-chat-text">That is Blue Mahoe, Jamaica's national tree!</div></div>
                          <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">J</div><div class="vt-session-chat-text">Can I buy that woven basket behind you?</div></div>
                          <div class="vt-session-chat-msg"><div class="vt-session-chat-avatar">R</div><div class="vt-session-chat-text">This feels like I am really there</div></div>
                        </div>
                        <div class="vt-chat-input-wrap">
                          <input type="text" class="vt-chat-input" id="vt-chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')vtSendChat()">
                          <button class="vt-chat-send" onclick="vtSendChat()"><i class="fas fa-paper-plane"></i></button>
                        </div>
                      </div>
                      <div class="vt-session-shop">
                        <div class="vt-session-shop-title">In-Session Shop</div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Handwoven Market Basket</div><div class="vt-session-shop-item-price">USD $28.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Handwoven Market Basket')">Add</div></div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Blue Mahoe Botanical Print</div><div class="vt-session-shop-item-price">USD $45.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Blue Mahoe Botanical Print')">Add</div></div>
                        <div class="vt-session-shop-item"><div><div class="vt-session-shop-item-name">Jamaican Spice Collection</div><div class="vt-session-shop-item-price">USD $22.00</div></div><div class="vt-session-shop-add" onclick="vtAddToCart(this,'Jamaican Spice Collection')">Add</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- VIEW: Browse Tours -->
              <div class="vt-dash-view" id="vt-exp-browse">
                <div class="vt-dash-header"><h2>Browse Tours</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-live-grid">
                  <div class="vt-live-card" onclick="vtJoinSession('blue-lagoon')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Nature</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Blue Lagoon Morning Walk</div><div class="vt-live-card-guide">Marcus Thompson, Portland</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $42</span><div class="vt-live-card-btn">Join</div></div></div></div>
                  <div class="vt-live-card" onclick="vtJoinSession('kingston-jerk')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#8b4513,#d2691e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Food</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Kingston Jerk and Ackee Class</div><div class="vt-live-card-guide">Chef Anita Murray, Kingston</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $38</span><div class="vt-live-card-btn">Join</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Starts 3:00 PM. Seat reserved!')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#2563eb,#7c3aed)"><div class="vt-live-card-badge scheduled">3:00 PM</div><div class="vt-live-card-cat">Shopping</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Bridgetown Market Tour</div><div class="vt-live-card-guide">Sandra Browne, Barbados</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $28</span><div class="vt-live-card-btn alt">Book</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Starts Tomorrow 8 AM')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#7c3aed,#a855f7)"><div class="vt-live-card-badge scheduled">Tomorrow</div><div class="vt-live-card-cat">Culture</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Devon House Heritage Tour</div><div class="vt-live-card-guide">Keisha Brown, Kingston</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $35</span><div class="vt-live-card-btn alt">Book</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Starts Saturday 7:30 AM')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#059669,#34d399)"><div class="vt-live-card-badge scheduled">Sat</div><div class="vt-live-card-cat">Nature</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Rio Grande River Raft Tour</div><div class="vt-live-card-guide">Marcus Thompson, Portland</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $55</span><div class="vt-live-card-btn alt">Book</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Starts Sunday 10 AM')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#dc2626,#f97316)"><div class="vt-live-card-badge scheduled">Sun</div><div class="vt-live-card-cat">Learning</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Reggae Music Production Class</div><div class="vt-live-card-guide">DJ Crucial, Kingston</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $30</span><div class="vt-live-card-btn alt">Book</div></div></div></div>
                </div>
              </div>

              <!-- VIEW: Bookings -->
              <div class="vt-dash-view" id="vt-exp-bookings">
                <div class="vt-dash-header"><h2>My Bookings</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-live-grid">
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Session starts at 3:00 PM today')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#2563eb,#7c3aed)"><div class="vt-live-card-badge scheduled">Today 3PM</div><div class="vt-live-card-cat">Shopping</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Bridgetown Market Tour</div><div class="vt-live-card-guide">Sandra Browne, Barbados</div><div class="vt-live-card-foot"><span class="vt-live-card-price">Booked</span><div class="vt-live-card-btn alt">View</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Session starts Thursday 10 AM')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#7c3aed,#a855f7)"><div class="vt-live-card-badge scheduled">Thu 10AM</div><div class="vt-live-card-cat">Culture</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Devon House Heritage Tour</div><div class="vt-live-card-guide">Keisha Brown, Kingston</div><div class="vt-live-card-foot"><span class="vt-live-card-price">Booked</span><div class="vt-live-card-btn alt">View</div></div></div></div>
                  <div class="vt-live-card" onclick="vtToast('<i class=\\'fas fa-clock\\'></i> Session starts Saturday 7:30 AM')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#059669,#34d399)"><div class="vt-live-card-badge scheduled">Sat 7:30AM</div><div class="vt-live-card-cat">Nature</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Rio Grande River Raft Tour</div><div class="vt-live-card-guide">Marcus Thompson, Portland</div><div class="vt-live-card-foot"><span class="vt-live-card-price">Booked</span><div class="vt-live-card-btn alt">View</div></div></div></div>
                </div>
              </div>

              <!-- VIEW: Favorites -->
              <div class="vt-dash-view" id="vt-exp-favorites">
                <div class="vt-dash-header"><h2>Favorites</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-live-grid">
                  <div class="vt-live-card" onclick="vtJoinSession('blue-lagoon')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#0b4d3a,#1a8a6e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Nature</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Blue Lagoon Morning Walk</div><div class="vt-live-card-guide">Marcus Thompson, Portland</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $42</span><div class="vt-live-card-btn"><i class="fas fa-heart" style="margin-right:4px"></i>Saved</div></div></div></div>
                  <div class="vt-live-card" onclick="vtJoinSession('kingston-jerk')"><div class="vt-live-card-img" style="background:linear-gradient(135deg,#8b4513,#d2691e)"><div class="vt-live-card-badge">Live</div><div class="vt-live-card-cat">Food</div></div><div class="vt-live-card-body"><div class="vt-live-card-title">Kingston Jerk and Ackee Class</div><div class="vt-live-card-guide">Chef Anita Murray, Kingston</div><div class="vt-live-card-foot"><span class="vt-live-card-price">USD $38</span><div class="vt-live-card-btn"><i class="fas fa-heart" style="margin-right:4px"></i>Saved</div></div></div></div>
                </div>
              </div>

              <!-- VIEW: History -->
              <div class="vt-dash-view" id="vt-exp-history">
                <div class="vt-dash-header"><h2>Tour History</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-empty-state"><i class="fas fa-history"></i><h4>12 Past Tours</h4><p>Your completed virtual tour sessions will appear here with replay options and purchase history.</p></div>
              </div>

              <!-- VIEW: Profile -->
              <div class="vt-dash-view" id="vt-exp-profile">
                <div class="vt-dash-header"><h2>My Profile</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-empty-state"><i class="fas fa-user-circle"></i><h4>Sarah Anderson</h4><p>Explorer Member since January 2025. 12 tours completed across 5 Caribbean destinations.</p></div>
              </div>

              <!-- VIEW: Settings -->
              <div class="vt-dash-view" id="vt-exp-settings">
                <div class="vt-dash-header"><h2>Settings</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtExpNav('explore',document.querySelector('#vt-exp-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-empty-state"><i class="fas fa-cog"></i><h4>Account Settings</h4><p>Manage notifications, payment methods, streaming quality, and language preferences.</p></div>
              </div>

            </div>
          </div>
        </div>
      </div>'''

src = src.replace(old_explorer, new_explorer)

# ── 3. Replace Guide Portal HTML with interactive version ──────────
old_guide = '''<div class="vt-dash-showcase reveal">
        <div class="vt-dash-frame">
          <div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Guide Portal</div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar">
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Management</div>
                <a href="#" class="active" onclick="return false"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                <a href="#" onclick="return false"><i class="fas fa-route"></i> My Tours</a>
                <a href="#" onclick="return false"><i class="fas fa-calendar-alt"></i> Schedule</a>
                <a href="#" onclick="return false"><i class="fas fa-tags"></i> Shop Items</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Business</div>
                <a href="#" onclick="return false"><i class="fas fa-wallet"></i> Earnings</a>
                <a href="#" onclick="return false"><i class="fas fa-star"></i> Reviews <span class="badge">4</span></a>
                <a href="#" onclick="return false"><i class="fas fa-chart-line"></i> Analytics</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Account</div>
                <a href="#" onclick="return false"><i class="fas fa-user"></i> Profile</a>
                <a href="#" onclick="return false"><i class="fas fa-cog"></i> Settings</a>
              </div>
              <div class="vt-dash-avatar">
                <div class="vt-dash-avatar-circle">MT</div>
                <div class="vt-dash-avatar-info">Marcus T.<span>Verified Guide</span></div>
              </div>
            </div>
            <div class="vt-dash-main">
              <div class="vt-dash-header">
                <h2><span class="vt-dash-live-dot"></span>Guide Dashboard</h2>
                <div class="vt-dash-header-actions">
                  <div class="vt-dash-header-btn">Add Tour</div>
                  <div class="vt-dash-header-btn primary">Go Live Now</div>
                </div>
              </div>
              <div class="vt-dash-stats">
                <div class="vt-dash-stat"><strong>6</strong><span>Sessions This Week</span><small>+2 from last week</small></div>
                <div class="vt-dash-stat"><strong>$1,840</strong><span>Total Earnings</span><small>This month</small></div>
                <div class="vt-dash-stat"><strong>4.9</strong><span>Average Rating</span><small>from 48 reviews</small></div>
                <div class="vt-dash-stat"><strong>3,218</strong><span>Total Viewers</span><small>All time</small></div>
              </div>

              <!-- My Tours Table -->
              <div class="vt-live-header"><h3>My Tours</h3><a href="#" onclick="return false">Create New Tour</a></div>
              <div style="overflow-x:auto">
                <table class="vt-guide-table">
                  <thead><tr><th>Tour Name</th><th>Category</th><th>Next Session</th><th>Price</th><th>Bookings</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr><td>Blue Lagoon Morning Walk</td><td>Nature and Outdoors</td><td>Today 9:00 AM</td><td>USD $42</td><td>247 total</td><td><span class="vt-status live">Live Now</span></td></tr>
                    <tr><td>Devon House Heritage Walk</td><td>Culture and Landmarks</td><td>Thu 10:00 AM</td><td>USD $35</td><td>18 booked</td><td><span class="vt-status scheduled">Scheduled</span></td></tr>
                    <tr><td>Rio Grande River Raft Tour</td><td>Nature and Outdoors</td><td>Sat 7:30 AM</td><td>USD $55</td><td>9 booked</td><td><span class="vt-status scheduled">Scheduled</span></td></tr>
                    <tr><td>Portland Waterfalls and Pools</td><td>Nature and Outdoors</td><td>Not set</td><td>USD $38</td><td>0 booked</td><td><span class="vt-status draft">Draft</span></td></tr>
                  </tbody>
                </table>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                <!-- Earnings Chart -->
                <div class="vt-earnings-chart">
                  <h4>Monthly Earnings</h4>
                  <div class="vt-chart-sub">$1,840 MTD</div>
                  <div class="vt-chart-bars">
                    <div class="vt-chart-bar" style="height:45%"><span>Jan</span></div>
                    <div class="vt-chart-bar" style="height:62%"><span>Feb</span></div>
                    <div class="vt-chart-bar" style="height:55%"><span>Mar</span></div>
                    <div class="vt-chart-bar" style="height:78%"><span>Apr</span></div>
                    <div class="vt-chart-bar" style="height:88%"><span>May</span></div>
                    <div class="vt-chart-bar" style="height:100%"><span>Jun</span></div>
                  </div>
                  <div class="vt-chart-note">Platform payout processed every Friday</div>
                </div>

                <!-- Upcoming Schedule -->
                <div class="vt-schedule">
                  <h4>Upcoming Schedule</h4>
                  <div class="vt-schedule-item">
                    <div class="vt-schedule-day"><strong>Today</strong></div>
                    <div class="vt-schedule-info"><h5>Blue Lagoon Morning Walk</h5><p>9:00 AM, 60 minutes</p></div>
                    <div class="vt-schedule-tag live">Live</div>
                  </div>
                  <div class="vt-schedule-item">
                    <div class="vt-schedule-day"><strong>Thu</strong></div>
                    <div class="vt-schedule-info"><h5>Devon House Heritage Walk</h5><p>10:00 AM, 90 minutes</p></div>
                    <div class="vt-schedule-tag group">Group</div>
                  </div>
                  <div class="vt-schedule-item">
                    <div class="vt-schedule-day"><strong>Fri</strong></div>
                    <div class="vt-schedule-info"><h5>Private Session, Corporate</h5><p>2:00 PM, 120 minutes</p></div>
                    <div class="vt-schedule-tag vip">VIP</div>
                  </div>
                  <div class="vt-schedule-item">
                    <div class="vt-schedule-day"><strong>Sat</strong></div>
                    <div class="vt-schedule-info"><h5>Rio Grande River Raft Tour</h5><p>7:30 AM, 90 minutes</p></div>
                    <div class="vt-schedule-tag group">Group</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>'''

new_guide = '''<div class="vt-dash-showcase reveal">
        <div class="vt-dash-frame" id="vt-guide-frame">
          <div class="vt-dash-topbar">
            <div><span class="vt-logo">VTours</span></div>
            <div class="vt-portal-label">Guide Portal</div>
          </div>
          <div class="vt-dash-body">
            <div class="vt-dash-sidebar" id="vt-guide-sidebar">
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Management</div>
                <a href="#" class="active" onclick="vtGuideNav('dashboard',this);return false"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                <a href="#" onclick="vtGuideNav('tours',this);return false"><i class="fas fa-route"></i> My Tours</a>
                <a href="#" onclick="vtGuideNav('schedule',this);return false"><i class="fas fa-calendar-alt"></i> Schedule</a>
                <a href="#" onclick="vtGuideNav('shopitems',this);return false"><i class="fas fa-tags"></i> Shop Items</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Business</div>
                <a href="#" onclick="vtGuideNav('earnings',this);return false"><i class="fas fa-wallet"></i> Earnings</a>
                <a href="#" onclick="vtGuideNav('reviews',this);return false"><i class="fas fa-star"></i> Reviews <span class="badge">4</span></a>
                <a href="#" onclick="vtGuideNav('analytics',this);return false"><i class="fas fa-chart-line"></i> Analytics</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Account</div>
                <a href="#" onclick="vtGuideNav('gprofile',this);return false"><i class="fas fa-user"></i> Profile</a>
                <a href="#" onclick="vtGuideNav('gsettings',this);return false"><i class="fas fa-cog"></i> Settings</a>
              </div>
              <div class="vt-dash-avatar">
                <div class="vt-dash-avatar-circle">MT</div>
                <div class="vt-dash-avatar-info">Marcus T.<span>Verified Guide</span></div>
              </div>
            </div>
            <div class="vt-dash-main" id="vt-guide-main">

              <!-- VIEW: Dashboard (default) -->
              <div class="vt-dash-view active" id="vt-guide-dashboard">
                <div class="vt-dash-header">
                  <h2><span class="vt-dash-live-dot"></span>Guide Dashboard</h2>
                  <div class="vt-dash-header-actions">
                    <div class="vt-dash-header-btn" onclick="vtGuideNav('tours',document.querySelector('#vt-guide-sidebar a:nth-child(3)'))">Add Tour</div>
                    <div class="vt-dash-header-btn primary" onclick="vtGoLive()">Go Live Now</div>
                  </div>
                </div>
                <div class="vt-dash-stats">
                  <div class="vt-dash-stat"><strong id="vt-guide-sessions">6</strong><span>Sessions This Week</span><small>+2 from last week</small></div>
                  <div class="vt-dash-stat"><strong>$1,840</strong><span>Total Earnings</span><small>This month</small></div>
                  <div class="vt-dash-stat"><strong>4.9</strong><span>Average Rating</span><small>from 48 reviews</small></div>
                  <div class="vt-dash-stat"><strong>3,218</strong><span>Total Viewers</span><small>All time</small></div>
                </div>

                <div class="vt-live-header"><h3>My Tours</h3><a href="#" onclick="vtToast('<i class=\\'fas fa-plus-circle\\'></i> Create New Tour form opening...');return false">Create New Tour</a></div>
                <div style="overflow-x:auto">
                  <table class="vt-guide-table">
                    <thead><tr><th>Tour Name</th><th>Category</th><th>Next Session</th><th>Price</th><th>Bookings</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr onclick="vtToast('<i class=\\'fas fa-broadcast-tower\\'></i> Blue Lagoon is streaming live now!')"><td>Blue Lagoon Morning Walk</td><td>Nature and Outdoors</td><td>Today 9:00 AM</td><td>USD $42</td><td>247 total</td><td><span class="vt-status live">Live Now</span></td></tr>
                      <tr onclick="vtToast('<i class=\\'fas fa-calendar\\'></i> Devon House: Thursday 10 AM, 18 booked')"><td>Devon House Heritage Walk</td><td>Culture and Landmarks</td><td>Thu 10:00 AM</td><td>USD $35</td><td>18 booked</td><td><span class="vt-status scheduled">Scheduled</span></td></tr>
                      <tr onclick="vtToast('<i class=\\'fas fa-calendar\\'></i> Rio Grande: Saturday 7:30 AM, 9 booked')"><td>Rio Grande River Raft Tour</td><td>Nature and Outdoors</td><td>Sat 7:30 AM</td><td>USD $55</td><td>9 booked</td><td><span class="vt-status scheduled">Scheduled</span></td></tr>
                      <tr onclick="vtToast('<i class=\\'fas fa-edit\\'></i> Opening Portland Waterfalls editor...')"><td>Portland Waterfalls and Pools</td><td>Nature and Outdoors</td><td>Not set</td><td>USD $38</td><td>0 booked</td><td><span class="vt-status draft">Draft</span></td></tr>
                    </tbody>
                  </table>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                  <div class="vt-earnings-chart">
                    <h4>Monthly Earnings</h4>
                    <div class="vt-chart-sub">$1,840 MTD</div>
                    <div class="vt-chart-bars">
                      <div class="vt-chart-bar" style="height:45%"><div class="vt-chart-bar-tip">$820</div><span>Jan</span></div>
                      <div class="vt-chart-bar" style="height:62%"><div class="vt-chart-bar-tip">$1,130</div><span>Feb</span></div>
                      <div class="vt-chart-bar" style="height:55%"><div class="vt-chart-bar-tip">$1,005</div><span>Mar</span></div>
                      <div class="vt-chart-bar" style="height:78%"><div class="vt-chart-bar-tip">$1,425</div><span>Apr</span></div>
                      <div class="vt-chart-bar" style="height:88%"><div class="vt-chart-bar-tip">$1,608</div><span>May</span></div>
                      <div class="vt-chart-bar" style="height:100%"><div class="vt-chart-bar-tip">$1,840</div><span>Jun</span></div>
                    </div>
                    <div class="vt-chart-note">Platform payout processed every Friday</div>
                  </div>
                  <div class="vt-schedule">
                    <h4>Upcoming Schedule</h4>
                    <div class="vt-schedule-item" onclick="vtToast('<i class=\\'fas fa-broadcast-tower\\'></i> Blue Lagoon is live now!')"><div class="vt-schedule-day"><strong>Today</strong></div><div class="vt-schedule-info"><h5>Blue Lagoon Morning Walk</h5><p>9:00 AM, 60 minutes</p></div><div class="vt-schedule-tag live">Live</div></div>
                    <div class="vt-schedule-item" onclick="vtToast('<i class=\\'fas fa-calendar\\'></i> Devon House: 18 seats booked')"><div class="vt-schedule-day"><strong>Thu</strong></div><div class="vt-schedule-info"><h5>Devon House Heritage Walk</h5><p>10:00 AM, 90 minutes</p></div><div class="vt-schedule-tag group">Group</div></div>
                    <div class="vt-schedule-item" onclick="vtToast('<i class=\\'fas fa-gem\\'></i> VIP Corporate: confirmed and paid')"><div class="vt-schedule-day"><strong>Fri</strong></div><div class="vt-schedule-info"><h5>Private Session, Corporate</h5><p>2:00 PM, 120 minutes</p></div><div class="vt-schedule-tag vip">VIP</div></div>
                    <div class="vt-schedule-item" onclick="vtToast('<i class=\\'fas fa-calendar\\'></i> Rio Grande: 9 seats booked')"><div class="vt-schedule-day"><strong>Sat</strong></div><div class="vt-schedule-info"><h5>Rio Grande River Raft Tour</h5><p>7:30 AM, 90 minutes</p></div><div class="vt-schedule-tag group">Group</div></div>
                  </div>
                </div>
              </div>

              <!-- VIEW: My Tours -->
              <div class="vt-dash-view" id="vt-guide-tours">
                <div class="vt-dash-header"><h2>My Tours</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div><div class="vt-dash-header-btn primary" onclick="vtToast('<i class=\\'fas fa-plus-circle\\'></i> New tour creation wizard opening...')">Create Tour</div></div></div>
                <div style="overflow-x:auto"><table class="vt-guide-table"><thead><tr><th>Tour Name</th><th>Category</th><th>Next Session</th><th>Price</th><th>Bookings</th><th>Status</th></tr></thead><tbody><tr onclick="vtToast('<i class=\\'fas fa-broadcast-tower\\'></i> Blue Lagoon is streaming live!')"><td>Blue Lagoon Morning Walk</td><td>Nature and Outdoors</td><td>Today 9:00 AM</td><td>USD $42</td><td>247 total</td><td><span class="vt-status live">Live Now</span></td></tr><tr onclick="vtToast('<i class=\\'fas fa-edit\\'></i> Opening Devon House editor...')"><td>Devon House Heritage Walk</td><td>Culture and Landmarks</td><td>Thu 10:00 AM</td><td>USD $35</td><td>18 booked</td><td><span class="vt-status scheduled">Scheduled</span></td></tr><tr onclick="vtToast('<i class=\\'fas fa-edit\\'></i> Opening Rio Grande editor...')"><td>Rio Grande River Raft Tour</td><td>Nature and Outdoors</td><td>Sat 7:30 AM</td><td>USD $55</td><td>9 booked</td><td><span class="vt-status scheduled">Scheduled</span></td></tr><tr onclick="vtToast('<i class=\\'fas fa-edit\\'></i> Opening Portland Waterfalls editor...')"><td>Portland Waterfalls and Pools</td><td>Nature and Outdoors</td><td>Not set</td><td>USD $38</td><td>0 booked</td><td><span class="vt-status draft">Draft</span></td></tr></tbody></table></div>
              </div>

              <!-- VIEW: Schedule -->
              <div class="vt-dash-view" id="vt-guide-schedule">
                <div class="vt-dash-header"><h2>Schedule</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-schedule" style="max-width:100%">
                  <div class="vt-schedule-item" onclick="vtToast('<i class=\\'fas fa-broadcast-tower\\'></i> Currently live!')"><div class="vt-schedule-day"><strong>Today</strong></div><div class="vt-schedule-info"><h5>Blue Lagoon Morning Walk</h5><p>9:00 AM, 60 min, 247 viewers</p></div><div class="vt-schedule-tag live">Live</div></div>
                  <div class="vt-schedule-item"><div class="vt-schedule-day"><strong>Thu</strong></div><div class="vt-schedule-info"><h5>Devon House Heritage Walk</h5><p>10:00 AM, 90 min, 18 booked</p></div><div class="vt-schedule-tag group">Group</div></div>
                  <div class="vt-schedule-item"><div class="vt-schedule-day"><strong>Fri</strong></div><div class="vt-schedule-info"><h5>Private Session, Corporate</h5><p>2:00 PM, 120 min, confirmed</p></div><div class="vt-schedule-tag vip">VIP</div></div>
                  <div class="vt-schedule-item"><div class="vt-schedule-day"><strong>Sat</strong></div><div class="vt-schedule-info"><h5>Rio Grande River Raft Tour</h5><p>7:30 AM, 90 min, 9 booked</p></div><div class="vt-schedule-tag group">Group</div></div>
                </div>
              </div>

              <!-- VIEW: Shop Items -->
              <div class="vt-dash-view" id="vt-guide-shopitems">
                <div class="vt-dash-header"><h2>Shop Items</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div><div class="vt-dash-header-btn primary" onclick="vtToast('<i class=\\'fas fa-plus-circle\\'></i> Add new shop item...')">Add Item</div></div></div>
                <div style="overflow-x:auto"><table class="vt-guide-table"><thead><tr><th>Item</th><th>Price</th><th>Sold</th><th>Revenue</th><th>Status</th></tr></thead><tbody><tr><td>Handwoven Market Basket</td><td>USD $28.00</td><td>34</td><td>$952</td><td><span class="vt-status live">Active</span></td></tr><tr><td>Blue Mahoe Botanical Print</td><td>USD $45.00</td><td>18</td><td>$810</td><td><span class="vt-status live">Active</span></td></tr><tr><td>Jamaican Spice Collection</td><td>USD $22.00</td><td>52</td><td>$1,144</td><td><span class="vt-status live">Active</span></td></tr><tr><td>Portland Parish Art Map</td><td>USD $35.00</td><td>0</td><td>$0</td><td><span class="vt-status draft">Draft</span></td></tr></tbody></table></div>
              </div>

              <!-- VIEW: Earnings -->
              <div class="vt-dash-view" id="vt-guide-earnings">
                <div class="vt-dash-header"><h2>Earnings</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats"><div class="vt-dash-stat"><strong>$1,840</strong><span>This Month</span><small>+23% vs last</small></div><div class="vt-dash-stat"><strong>$8,828</strong><span>All Time</span><small>Since Jan 2025</small></div><div class="vt-dash-stat"><strong>$2,906</strong><span>Shop Revenue</span><small>104 items sold</small></div><div class="vt-dash-stat"><strong>$307</strong><span>Avg / Session</span><small>Tips + shop</small></div></div>
                <div class="vt-earnings-chart" style="margin-top:20px"><h4>Monthly Earnings</h4><div class="vt-chart-sub">$1,840 MTD</div><div class="vt-chart-bars"><div class="vt-chart-bar" style="height:45%"><div class="vt-chart-bar-tip">$820</div><span>Jan</span></div><div class="vt-chart-bar" style="height:62%"><div class="vt-chart-bar-tip">$1,130</div><span>Feb</span></div><div class="vt-chart-bar" style="height:55%"><div class="vt-chart-bar-tip">$1,005</div><span>Mar</span></div><div class="vt-chart-bar" style="height:78%"><div class="vt-chart-bar-tip">$1,425</div><span>Apr</span></div><div class="vt-chart-bar" style="height:88%"><div class="vt-chart-bar-tip">$1,608</div><span>May</span></div><div class="vt-chart-bar" style="height:100%"><div class="vt-chart-bar-tip">$1,840</div><span>Jun</span></div></div><div class="vt-chart-note">Platform payout processed every Friday</div></div>
              </div>

              <!-- VIEW: Reviews -->
              <div class="vt-dash-view" id="vt-guide-reviews">
                <div class="vt-dash-header"><h2>Reviews</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats"><div class="vt-dash-stat"><strong>4.9</strong><span>Average Rating</span><small>48 reviews</small></div><div class="vt-dash-stat"><strong>96%</strong><span>Would Recommend</span><small>46 of 48</small></div></div>
                <div class="vt-empty-state" style="padding:30px"><i class="fas fa-star"></i><h4>Top Reviews</h4><p>Your latest 5-star reviews and guest feedback will appear here.</p></div>
              </div>

              <!-- VIEW: Analytics -->
              <div class="vt-dash-view" id="vt-guide-analytics">
                <div class="vt-dash-header"><h2>Analytics</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-dash-stats"><div class="vt-dash-stat"><strong>3,218</strong><span>Total Viewers</span><small>All time</small></div><div class="vt-dash-stat"><strong>42 min</strong><span>Avg Session</span><small>Duration</small></div><div class="vt-dash-stat"><strong>73%</strong><span>Return Rate</span><small>Repeat viewers</small></div><div class="vt-dash-stat"><strong>Jamaica</strong><span>Top Region</span><small>68% of tours</small></div></div>
                <div class="vt-empty-state" style="padding:30px"><i class="fas fa-chart-line"></i><h4>Detailed Analytics</h4><p>Viewer demographics, peak hours, conversion rates, and engagement metrics will appear here.</p></div>
              </div>

              <!-- VIEW: Profile -->
              <div class="vt-dash-view" id="vt-guide-gprofile">
                <div class="vt-dash-header"><h2>Guide Profile</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-empty-state"><i class="fas fa-user-circle"></i><h4>Marcus Thompson</h4><p>Verified Guide since December 2024. Based in Portland, Jamaica. Specializing in Nature and Outdoors experiences. 4.9 rating from 48 reviews.</p></div>
              </div>

              <!-- VIEW: Settings -->
              <div class="vt-dash-view" id="vt-guide-gsettings">
                <div class="vt-dash-header"><h2>Settings</h2><div class="vt-dash-header-actions"><div class="vt-dash-header-btn" onclick="vtGuideNav('dashboard',document.querySelector('#vt-guide-sidebar a:nth-child(2)'))"><i class="fas fa-arrow-left" style="margin-right:6px"></i>Back</div></div></div>
                <div class="vt-empty-state"><i class="fas fa-cog"></i><h4>Guide Settings</h4><p>Manage payout info, streaming equipment, availability calendar, notification preferences, and shop fulfillment settings.</p></div>
              </div>

            </div>
          </div>
        </div>
      </div>'''

src = src.replace(old_guide, new_guide)

# ── 4. Replace the old simple tab JS with full interactive JS ──────
old_js = '''<script>
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
</script>'''

new_js = '''<script>
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

/* ── Toast notifications ── */
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

/* ── Join session (explorer) ── */
var vtSessions={
  'blue-lagoon':{title:'Blue Lagoon Morning Walk',guide:'Marcus Thompson',loc:'Port Antonio &bull; Portland &bull; Jamaica',viewers:247},
  'kingston-jerk':{title:'Kingston Jerk and Ackee Class',guide:'Chef Anita Murray',loc:'Kingston &bull; St Andrew &bull; Jamaica',viewers:183}
};
function vtJoinSession(id){
  var s=vtSessions[id];if(!s)return;
  document.getElementById('vt-session-title').textContent=s.title;
  document.getElementById('vt-session-guide').textContent=s.guide;
  document.getElementById('vt-session-loc').innerHTML=s.loc;
  document.getElementById('vt-viewer-count').textContent=s.viewers;
  document.getElementById('vt-chat-viewers').textContent=s.viewers+' watching';
  var vid=document.getElementById('vt-session-video');vid.classList.add('vt-video-playing');
  document.getElementById('vt-active-session').scrollIntoView({behavior:'smooth',block:'center'});
  vtToast('<i class="fas fa-broadcast-tower"></i> Joined: '+s.title);
  vtAnimateViewers();
}

/* ── Animate viewer count ── */
var vtViewerInterval;
function vtAnimateViewers(){
  clearInterval(vtViewerInterval);
  vtViewerInterval=setInterval(function(){
    var el=document.getElementById('vt-viewer-count');if(!el)return;
    var v=parseInt(el.textContent)||247;
    v+=Math.floor(Math.random()*5)-2;
    if(v<200)v=200;if(v>350)v=350;
    el.textContent=v;
    var cv=document.getElementById('vt-chat-viewers');if(cv)cv.textContent=v+' watching';
  },3000);
}

/* ── Toggle video simulation ── */
function vtToggleVideo(){
  var v=document.getElementById('vt-session-video');
  v.classList.toggle('vt-video-playing');
  if(v.classList.contains('vt-video-playing')){vtAnimateViewers();vtToast('<i class="fas fa-play-circle"></i> Live stream connected')}
  else{clearInterval(vtViewerInterval);vtToast('<i class="fas fa-pause-circle"></i> Stream paused')}
}

/* ── Leave session ── */
function vtLeaveSession(){
  var v=document.getElementById('vt-session-video');v.classList.remove('vt-video-playing');
  clearInterval(vtViewerInterval);
  vtToast('<i class="fas fa-sign-out-alt"></i> Session ended. Thanks for watching!');
}

/* ── Session action buttons ── */
function vtSessionAction(el,type){
  el.classList.add('clicked');setTimeout(function(){el.classList.remove('clicked')},500);
  var msgs={'shop':'<i class="fas fa-shopping-bag"></i> Shop panel highlighted below','capture':'<i class="fas fa-camera"></i> Screenshot captured!','point':'<i class="fas fa-hand-pointer"></i> Point mode active. Click anywhere on the stream.','invite':'<i class="fas fa-user-plus"></i> Share link copied to clipboard!'};
  vtToast(msgs[type]||'Action triggered');
}

/* ── Live chat ── */
var vtBotReplies=['Amazing view!','How much is that?','I want to visit Jamaica so badly','This is incredible technology','Can the guide show us the beach?','Wow, the water is so blue!','Adding that to my wishlist','Best virtual tour ever','Is that a hummingbird?','The colors are breathtaking'];
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
  },1200+Math.random()*1500);
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
  vtToast('<i class="fas fa-broadcast-tower"></i> You are now live! 0 viewers watching...');
}
</script>'''

src = src.replace(old_js, new_js)

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done: Both dashboards are now fully interactive.')
