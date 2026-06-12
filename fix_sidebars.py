#!/usr/bin/env python3
"""Fix sidebar nav items for Explorer and Guide dashboards."""

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

# Explorer sidebar - add Smart section between Favorites and Account
c = sr(c,
    """                <a href="#" onclick="vtExpNav('favorites',this);return false"><i class="fas fa-heart"></i> Favorites</a>
                <a href="#" onclick="vtExpNav('history',this);return false"><i class="fas fa-history"></i> History</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Account</div>""",
    """                <a href="#" onclick="vtExpNav('favorites',this);return false"><i class="fas fa-heart"></i> Favorites</a>
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
                <a href="#" onclick="vtExpNav('history',this);return false"><i class="fas fa-history"></i> History</a>""",
    "Explorer sidebar + Smart section")

# Guide sidebar - add Live Tools section
c = sr(c,
    """                <a href="#" onclick="vtGuideNav('shopitems',this);return false"><i class="fas fa-tags"></i> Shop Items</a>
              </div>
              <div class="vt-dash-sidebar-section">
                <div class="vt-dash-sidebar-label">Business</div>
                <a href="#" onclick="vtGuideNav('earnings',this);return false"><i class="fas fa-wallet"></i> Earnings</a>
                <a href="#" onclick="vtGuideNav('reviews',this);return false"><i class="fas fa-star"></i> Reviews <span class="badge">4</span></a>
                <a href="#" onclick="vtGuideNav('analytics',this);return false"><i class="fas fa-chart-line"></i> Analytics</a>""",
    """                <a href="#" onclick="vtGuideNav('shopitems',this);return false"><i class="fas fa-tags"></i> Shop Items</a>
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
                <a href="#" onclick="vtGuideNav('pricing',this);return false"><i class="fas fa-chart-bar"></i> Pricing</a>
                <a href="#" onclick="vtGuideNav('reviews',this);return false"><i class="fas fa-star"></i> Reviews <span class="badge">4</span></a>
                <a href="#" onclick="vtGuideNav('analytics',this);return false"><i class="fas fa-chart-line"></i> Analytics</a>""",
    "Guide sidebar + Live Tools + Business expanded")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} sidebar changes.")
