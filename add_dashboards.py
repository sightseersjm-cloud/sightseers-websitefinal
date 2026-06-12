#!/usr/bin/env python3
"""Add Explorer Dashboard and Guide Portal mockups to VTours page."""

with open("/home/user/sightseers-websitefinal/Design_Reference.html", "r") as f:
    content = f.read()

# ══════════════════════════════════════════════════
# CSS for both dashboards
# ══════════════════════════════════════════════════
dashboard_css = """
/* ======== V-TOURS DASHBOARD MOCKUPS ======== */
.vt-dash-showcase{margin-top:48px}
.vt-dash-frame{background:#f0f2f5;border-radius:18px;overflow:hidden;border:1px solid rgba(0,0,0,.08);box-shadow:0 20px 60px rgba(0,0,0,.1)}
.vt-dash-topbar{display:flex;align-items:center;justify-content:space-between;background:var(--navy);padding:10px 20px;color:#fff;font-size:13px;font-weight:700}
.vt-dash-topbar .vt-logo{font-size:15px;letter-spacing:1px}
.vt-dash-topbar .vt-portal-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.5)}
.vt-dash-body{display:grid;grid-template-columns:220px 1fr;min-height:560px}
@media(max-width:900px){.vt-dash-body{grid-template-columns:1fr}.vt-dash-sidebar{display:none}}

.vt-dash-sidebar{background:#fff;border-right:1px solid rgba(0,0,0,.06);padding:24px 0}
.vt-dash-sidebar-section{padding:0 16px;margin-bottom:20px}
.vt-dash-sidebar-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#99a3b0;font-weight:700;padding:0 12px;margin-bottom:8px}
.vt-dash-sidebar a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;font-size:13px;color:#617087;font-weight:500;text-decoration:none;transition:background .2s,color .2s;position:relative}
.vt-dash-sidebar a:hover{background:rgba(6,58,99,.04);color:var(--navy)}
.vt-dash-sidebar a.active{background:rgba(239,135,49,.08);color:var(--orange);font-weight:600}
.vt-dash-sidebar a .badge{background:var(--orange);color:#fff;font-size:10px;font-weight:700;border-radius:999px;padding:1px 7px;margin-left:auto}
.vt-dash-avatar{display:flex;align-items:center;gap:10px;padding:16px;border-top:1px solid rgba(0,0,0,.06);margin-top:auto}
.vt-dash-avatar-circle{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--orange),#ff8d47);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff}
.vt-dash-avatar-info{font-size:13px;font-weight:600;color:var(--navy);line-height:1.3}
.vt-dash-avatar-info span{display:block;font-size:10px;color:#99a3b0;font-weight:500}

.vt-dash-main{padding:24px;overflow-x:auto}
.vt-dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.vt-dash-header h2{font-size:20px;font-weight:700;color:var(--navy);margin:0}
.vt-dash-header-actions{display:flex;gap:8px}
.vt-dash-header-btn{padding:8px 16px;border-radius:10px;border:1px solid rgba(0,0,0,.08);background:#fff;font-size:12px;font-weight:600;color:var(--navy);cursor:default}
.vt-dash-header-btn.primary{background:var(--orange);color:#fff;border-color:var(--orange)}
.vt-dash-live-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;animation:vtPulse 2s infinite}
@keyframes vtPulse{0%,100%{opacity:1}50%{opacity:.4}}

.vt-dash-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:28px}
.vt-dash-stat{background:#fff;border-radius:14px;padding:18px 16px;border:1px solid rgba(0,0,0,.04)}
.vt-dash-stat strong{display:block;font-family:'Playfair Display',serif;font-size:26px;color:var(--navy);margin-bottom:2px}
.vt-dash-stat span{font-size:11px;color:#99a3b0;font-weight:500}
.vt-dash-stat small{display:block;font-size:10px;color:#617087;margin-top:2px}

/* Live session cards */
.vt-live-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.vt-live-header h3{font-size:15px;font-weight:700;color:var(--navy);margin:0}
.vt-live-header a{font-size:12px;color:var(--orange);font-weight:600;text-decoration:none}
.vt-live-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:28px}
.vt-live-card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid rgba(0,0,0,.04);transition:transform .3s,box-shadow .3s}
.vt-live-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.08)}
.vt-live-card-img{height:110px;background:linear-gradient(135deg,#0d5371,#1a7a9e);position:relative;display:flex;align-items:flex-end;padding:10px}
.vt-live-card-badge{position:absolute;top:8px;left:8px;background:rgba(239,68,68,.9);color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:4px}
.vt-live-card-badge.scheduled{background:rgba(59,130,246,.9)}
.vt-live-card-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;animation:vtPulse 1.5s infinite}
.vt-live-card-cat{font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1px;font-weight:600}
.vt-live-card-body{padding:12px 14px}
.vt-live-card-title{font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px}
.vt-live-card-guide{font-size:11px;color:#617087;margin-bottom:8px}
.vt-live-card-foot{display:flex;align-items:center;justify-content:space-between}
.vt-live-card-price{font-size:14px;font-weight:700;color:var(--navy)}
.vt-live-card-btn{font-size:10px;font-weight:700;color:#fff;background:var(--orange);padding:6px 14px;border-radius:8px;text-transform:uppercase;letter-spacing:.5px;border:none;cursor:default}
.vt-live-card-btn.alt{background:var(--navy)}

/* Active session mockup */
.vt-session{background:#1a1a2e;border-radius:14px;overflow:hidden;margin-bottom:20px}
.vt-session-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(0,0,0,.3)}
.vt-session-bar-left{display:flex;align-items:center;gap:8px;color:#fff;font-size:12px;font-weight:600}
.vt-session-bar-right{display:flex;gap:8px}
.vt-session-bar-btn{padding:5px 12px;border-radius:8px;font-size:10px;font-weight:700;border:none;cursor:default;color:#fff;text-transform:uppercase;letter-spacing:.5px}
.vt-session-bar-btn.leave{background:rgba(239,68,68,.8)}
.vt-session-content{display:grid;grid-template-columns:1fr 260px;min-height:280px}
@media(max-width:768px){.vt-session-content{grid-template-columns:1fr}.vt-session-side{display:none}}
.vt-session-video{position:relative;background:linear-gradient(160deg,#0b3d5e 0%,#145a7a 40%,#1a8a6e 100%);display:flex;align-items:center;justify-content:center;padding:20px}
.vt-session-video-label{color:rgba(255,255,255,.3);font-size:14px;text-align:center;line-height:1.6}
.vt-session-video-overlay{position:absolute;bottom:0;left:0;right:0;padding:12px 16px;background:linear-gradient(transparent,rgba(0,0,0,.6));display:flex;align-items:center;justify-content:space-between}
.vt-session-location{font-size:10px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1.5px;font-weight:600}
.vt-session-viewers{font-size:10px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:4px}
.vt-session-actions{display:flex;gap:8px;padding:12px 16px;background:rgba(0,0,0,.2);justify-content:center}
.vt-session-action{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;cursor:default;transition:background .2s}
.vt-session-action i{font-size:16px;color:var(--orange)}
.vt-session-side{display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.06)}
.vt-session-chat{flex:1;padding:12px;overflow:hidden}
.vt-session-chat-title{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.vt-session-chat-msg{display:flex;gap:8px;margin-bottom:8px}
.vt-session-chat-avatar{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.6);font-weight:700;flex-shrink:0}
.vt-session-chat-avatar.guide{background:rgba(239,135,49,.2);color:var(--orange)}
.vt-session-chat-text{font-size:12px;color:rgba(255,255,255,.65);line-height:1.5}
.vt-session-shop{border-top:1px solid rgba(255,255,255,.06);padding:12px}
.vt-session-shop-title{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:10px}
.vt-session-shop-item{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.vt-session-shop-item-name{font-size:11px;color:rgba(255,255,255,.7);font-weight:500}
.vt-session-shop-item-price{font-size:11px;color:rgba(255,255,255,.5)}
.vt-session-shop-add{font-size:9px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.5px;cursor:default;padding:3px 8px;border:1px solid rgba(239,135,49,.3);border-radius:6px}

/* Guide portal table */
.vt-guide-table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
.vt-guide-table th{text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#99a3b0;font-weight:700;border-bottom:1px solid rgba(0,0,0,.06)}
.vt-guide-table td{padding:12px;border-bottom:1px solid rgba(0,0,0,.03);color:#617087}
.vt-guide-table td:first-child{font-weight:600;color:var(--navy)}
.vt-status{display:inline-block;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.vt-status.live{background:rgba(34,197,94,.1);color:#16a34a}
.vt-status.scheduled{background:rgba(59,130,246,.1);color:#2563eb}
.vt-status.draft{background:rgba(156,163,175,.1);color:#6b7280}

/* Earnings chart placeholder */
.vt-earnings-chart{background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.04);padding:20px;margin-top:20px}
.vt-earnings-chart h4{font-size:14px;font-weight:700;color:var(--navy);margin-bottom:4px}
.vt-earnings-chart .vt-chart-sub{font-size:11px;color:#99a3b0;margin-bottom:16px}
.vt-chart-bars{display:flex;align-items:flex-end;gap:12px;height:100px}
.vt-chart-bar{flex:1;border-radius:6px 6px 0 0;background:linear-gradient(180deg,var(--orange),#ff8d47);position:relative;min-width:0;transition:opacity .3s}
.vt-chart-bar:hover{opacity:.8}
.vt-chart-bar span{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:9px;color:#99a3b0;font-weight:600}
.vt-chart-note{font-size:10px;color:#99a3b0;margin-top:24px;text-align:center}

/* Schedule cards */
.vt-schedule{margin-top:20px}
.vt-schedule h4{font-size:14px;font-weight:700;color:var(--navy);margin-bottom:12px}
.vt-schedule-item{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.vt-schedule-day{min-width:40px;text-align:center}
.vt-schedule-day strong{display:block;font-size:13px;font-weight:700;color:var(--navy)}
.vt-schedule-day span{font-size:9px;color:#99a3b0;text-transform:uppercase}
.vt-schedule-info{flex:1}
.vt-schedule-info h5{font-size:13px;font-weight:600;color:var(--navy);margin:0 0 2px}
.vt-schedule-info p{font-size:11px;color:#99a3b0;margin:0}
.vt-schedule-tag{font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.5px;align-self:center}
.vt-schedule-tag.live{background:rgba(34,197,94,.1);color:#16a34a}
.vt-schedule-tag.group{background:rgba(59,130,246,.1);color:#2563eb}
.vt-schedule-tag.vip{background:rgba(168,85,247,.1);color:#7c3aed}

body.theme-night .vt-dash-frame{background:#0d1b2a;border-color:rgba(255,255,255,.06)}
body.theme-night .vt-dash-sidebar{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.04)}
body.theme-night .vt-dash-sidebar a{color:rgba(255,255,255,.5)}
body.theme-night .vt-dash-sidebar a:hover{background:rgba(255,255,255,.04);color:#fff}
body.theme-night .vt-dash-sidebar a.active{color:var(--orange)}
body.theme-night .vt-dash-main{background:#0d1b2a}
body.theme-night .vt-dash-stat,body.theme-night .vt-live-card,body.theme-night .vt-earnings-chart{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.06)}
body.theme-night .vt-dash-stat strong,body.theme-night .vt-live-card-title,body.theme-night .vt-live-card-price,body.theme-night .vt-dash-header h2,body.theme-night .vt-earnings-chart h4,body.theme-night .vt-schedule h4,body.theme-night .vt-schedule-day strong,body.theme-night .vt-schedule-info h5,body.theme-night .vt-guide-table td:first-child{color:#fff}
body.theme-night .vt-live-card-guide,body.theme-night .vt-dash-stat span,body.theme-night .vt-guide-table td{color:rgba(255,255,255,.45)}
body.theme-night .vt-guide-table th{color:rgba(255,255,255,.3);border-color:rgba(255,255,255,.06)}
body.theme-night .vt-guide-table td{border-color:rgba(255,255,255,.03)}
body.theme-night .vt-dash-avatar-info{color:#fff}
"""

# ══════════════════════════════════════════════════
# Explorer Dashboard HTML
# ══════════════════════════════════════════════════
explorer_html = """
  <!-- EXPLORER DASHBOARD -->
  <section class="vt-sec vt-sec--alt">
    <div class="vt-wrap">
      <div class="sec-head center reveal">
        <span class="sec-pre">Explorer Experience</span>
        <h2 class="sec-title">The Explorer Dashboard</h2>
        <p class="sec-sub center">Browse live sessions, join an active stream, interact with a guide, and shop in real time. This is what the V-Tours experience looks like.</p>
      </div>
      <div class="vt-dash-showcase reveal">
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
      </div>
    </div>
  </section>
"""

# ══════════════════════════════════════════════════
# Guide Portal HTML
# ══════════════════════════════════════════════════
guide_html = """
  <!-- GUIDE PORTAL -->
  <section class="vt-sec">
    <div class="vt-wrap">
      <div class="sec-head center reveal">
        <span class="sec-pre">Guide Experience</span>
        <h2 class="sec-title">The Guide Portal</h2>
        <p class="sec-sub center">Independent tour guides self-register, manage their tours, set availability, tag shop items, and track earnings from a single clean dashboard.</p>
      </div>
      <div class="vt-dash-showcase reveal">
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
      </div>
    </div>
  </section>
"""

# ══════════════════════════════════════════════════
# Insert CSS into the VTours page style block
# ══════════════════════════════════════════════════
css_marker = "body.theme-night .vt-cat-card p,body.theme-night .vt-step p,body.theme-night .vt-rev-card span{color:rgba(255,255,255,.55)}"
if css_marker in content:
    content = content.replace(css_marker, css_marker + dashboard_css, 1)
    print("OK: Dashboard CSS inserted")
else:
    print("WARN: CSS marker not found")

# ══════════════════════════════════════════════════
# Insert Explorer Dashboard after "How It Works" section, before Device Tiers
# ══════════════════════════════════════════════════
device_marker = """  <!-- DEVICE TIERS -->
  <section class="vt-sec vt-sec--dark">"""

if device_marker in content:
    content = content.replace(device_marker, explorer_html + "\n" + guide_html + "\n" + device_marker, 1)
    print("OK: Explorer Dashboard and Guide Portal inserted")
else:
    print("WARN: Device tiers marker not found")

with open("/home/user/sightseers-websitefinal/Design_Reference.html", "w") as f:
    f.write(content)

print("\nDone.")
