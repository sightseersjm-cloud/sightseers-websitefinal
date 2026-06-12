#!/usr/bin/env python3
"""Move Explorer Dashboard & Guide Portal to top of V-Tours page with clickable tabs."""

import re

path = 'Design_Reference.html'
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. Extract the two dashboard sections ──────────────────────────
explorer_start = '  <!-- EXPLORER DASHBOARD -->'
guide_end_marker = '  <!-- DEVICE TIERS -->'

idx_exp = src.index(explorer_start)
idx_dev = src.index(guide_end_marker)

# Grab the full block (both sections including the blank lines between)
dashboard_block = src[idx_exp:idx_dev].rstrip('\n')

# Remove the block from its current position (keep device tiers in place)
src = src[:idx_exp] + '\n' + src[idx_dev:]

# ── 2. Build the new tabbed dashboard section ──────────────────────
tab_css = """
/* ======== V-TOURS DASHBOARD TABS ======== */
.vt-dash-tabs{display:flex;justify-content:center;gap:12px;margin-bottom:36px}
.vt-dash-tab{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;transition:all .35s cubic-bezier(.25,.46,.45,.94);border:2px solid rgba(0,0,0,.08);background:#fff;color:var(--navy);user-select:none}
.vt-dash-tab i{font-size:16px;transition:color .3s}
.vt-dash-tab:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.vt-dash-tab.active{background:var(--navy);color:#fff;border-color:var(--navy);box-shadow:0 8px 28px rgba(6,58,99,.25)}
.vt-dash-tab.active i{color:var(--orange)}
.vt-dash-panel{display:none;animation:vtFadeIn .5s ease}
.vt-dash-panel.active{display:block}
@keyframes vtFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
body.theme-night .vt-dash-tab{background:#0d1b2a;color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.08)}
body.theme-night .vt-dash-tab:hover{box-shadow:0 8px 24px rgba(0,0,0,.3)}
body.theme-night .vt-dash-tab.active{background:var(--orange);color:#fff;border-color:var(--orange)}
"""

# Build the tabbed HTML wrapper
tab_html = """
  <!-- DASHBOARD SHOWCASE (TABBED) -->
  <section class="vt-sec vt-sec--alt">
    <div class="vt-wrap">
      <div class="sec-head center reveal">
        <span class="sec-pre">Platform Preview</span>
        <h2 class="sec-title">See the V-Tours Experience</h2>
        <p class="sec-sub center">Click below to explore both sides of the platform: the Explorer view for guests, and the Guide Portal for tour operators.</p>
      </div>
      <div class="vt-dash-tabs reveal">
        <div class="vt-dash-tab active" onclick="vtSwitchTab('explorer')"><i class="fas fa-compass"></i> Explorer Dashboard</div>
        <div class="vt-dash-tab" onclick="vtSwitchTab('guide')"><i class="fas fa-user-tie"></i> Guide Portal</div>
      </div>
      <div class="vt-dash-panel active" id="vt-panel-explorer">
        <div class="vt-dash-showcase reveal">
"""

# Now we need to extract just the inner frame from each section
# Explorer: everything inside the vt-dash-showcase div
exp_frame_start = dashboard_block.index('<div class="vt-dash-frame">')
# Find the closing of the explorer section
exp_section_end = dashboard_block.index('<!-- GUIDE PORTAL -->')
# Walk back to find the closing tags
exp_inner = dashboard_block[exp_frame_start:exp_section_end]
# Trim trailing whitespace and closing tags from explorer
exp_inner = exp_inner.strip()
# We need to find the actual frame content - from the first <div class="vt-dash-frame"> to its matching close
# Let's just extract the frame div properly

# Simpler approach: extract from first <div class="vt-dash-frame"> to before <!-- GUIDE PORTAL -->
# and strip the wrapper section/div tags
lines = dashboard_block.split('\n')
explorer_lines = []
guide_lines = []
in_guide = False
for line in lines:
    if '<!-- GUIDE PORTAL -->' in line:
        in_guide = True
        continue
    if '<!-- EXPLORER DASHBOARD -->' in line:
        continue
    if in_guide:
        guide_lines.append(line)
    else:
        explorer_lines.append(line)

# Strip the outer section/wrap/sec-head wrappers from explorer
# Find the vt-dash-frame start
exp_text = '\n'.join(explorer_lines)
exp_frame_idx = exp_text.index('<div class="vt-dash-frame">')
exp_frame_end = exp_text.rindex('</div>\n      </div>\n    </div>\n  </section>')
exp_frame_content = exp_text[exp_frame_idx:exp_frame_end].rstrip()
# Actually, let's just grab the vt-dash-frame div itself
# Find the matching closing: it's the content between the showcase div

# Even simpler: just grab from <div class="vt-dash-frame"> through the end of the section
# and remove the wrapper closing tags
exp_content_start = exp_text.index('<div class="vt-dash-frame">')
# Find where the section closes: </div></div></div></section>
# Count from the frame div
exp_section = exp_text[exp_content_start:]
# Remove trailing section closers: we need just the frame
# The structure is: <section><div vt-wrap><div sec-head>...</div><div showcase><div frame>...</div></div></div></section>
# So we want everything from <div class="vt-dash-frame"> to just before </div></div></div></section>
# Let's strip the trailing closers
exp_section = exp_section.rstrip()
# Remove trailing </div> </div> </div> </section> (the showcase, wrap, and section closers)
for _ in range(4):
    last_close = exp_section.rstrip().rindex('</div>')
    exp_section = exp_section[:last_close].rstrip()
# Hmm this is getting complicated. Let me just use the full sections but wrap them differently.

# MUCH SIMPLER APPROACH: keep the full section HTML but remove the outer <section> wrappers
# and replace with tab panels

# Reset - let's work with the raw dashboard block and just restructure it
# Split at the GUIDE PORTAL comment
parts = dashboard_block.split('<!-- GUIDE PORTAL -->')
explorer_section = parts[0].strip()
guide_section = parts[1].strip() if len(parts) > 1 else ''

# For explorer: remove outer section wrapper, keep inner content
# Structure: <section class="vt-sec vt-sec--alt"><div class="vt-wrap"><div sec-head>...<div showcase>..frame..</div></div></section>
# We want just: <div class="vt-dash-showcase reveal"><div class="vt-dash-frame">...</div></div>

def extract_showcase(section_html):
    """Extract from <div class='vt-dash-showcase' to matching end."""
    start = section_html.index('<div class="vt-dash-showcase')
    # Find the end - it's the content between showcase and the section close
    # The showcase div closes right before </div></div></section>
    # Let's find the last occurrence of </div> repeated
    end = section_html.rstrip()
    # Remove trailing </section>
    if end.endswith('</section>'):
        end = end[:-len('</section>')].rstrip()
    # Remove trailing </div> for vt-wrap
    if end.endswith('</div>'):
        end = end[:-len('</div>')].rstrip()
    # Now we have from section start through showcase close
    return section_html[start:len(end) + len('</div>')]

# Actually, let me just use regex to be safe
def extract_between(html, start_tag_class, end_count=2):
    """Get the showcase div including its content."""
    idx = html.index(f'class="{start_tag_class}"')
    # Go back to the <div
    div_start = html.rindex('<div ', 0, idx)
    return html[div_start:]

# Simplest approach: just use the full HTML blocks and wrap them in panels
# Remove the outer <section> and <div class="vt-wrap"> and <div class="sec-head"...> wrappers

def get_showcase_div(section_html):
    start = section_html.find('<div class="vt-dash-showcase')
    if start == -1:
        return section_html
    # Get from showcase div to just before the closing </div></div></section>
    content = section_html[start:]
    # Remove trailing section/wrap closers
    # Count: we need to remove </div> (for vt-wrap) and </section>
    content = content.rstrip()
    # The structure ends with: </div>\n      </div>\n    </div>\n  </section>
    # which is: frame-close, showcase-close, wrap-close, section-close
    # We want to keep through showcase-close
    # So remove the last </div>\n  </section> or </div></section>

    # Find </section> and remove it plus the </div> before it (vt-wrap close)
    sec_idx = content.rfind('</section>')
    if sec_idx != -1:
        content = content[:sec_idx].rstrip()
    # Remove the vt-wrap closing </div>
    wrap_close = content.rfind('</div>')
    if wrap_close != -1:
        content = content[:wrap_close].rstrip()
    return content

explorer_showcase = get_showcase_div(explorer_section)
guide_showcase = get_showcase_div('<!-- GUIDE PORTAL -->\n' + guide_section)

# Build the complete new section
new_section = f"""
  <!-- DASHBOARD SHOWCASE (TABBED) -->
  <section class="vt-sec vt-sec--alt">
    <div class="vt-wrap">
      <div class="sec-head center reveal">
        <span class="sec-pre">Platform Preview</span>
        <h2 class="sec-title">See the V-Tours Experience</h2>
        <p class="sec-sub center">Click below to explore both sides of the platform: the Explorer view for guests, and the Guide Portal for tour operators.</p>
      </div>
      <div class="vt-dash-tabs reveal">
        <div class="vt-dash-tab active" onclick="vtSwitchTab('explorer')"><i class="fas fa-compass"></i> Explorer Dashboard</div>
        <div class="vt-dash-tab" onclick="vtSwitchTab('guide')"><i class="fas fa-user-tie"></i> Guide Portal</div>
      </div>
      <div class="vt-dash-panel active" id="vt-panel-explorer">
{explorer_showcase}
      </div>
      <div class="vt-dash-panel" id="vt-panel-guide">
{guide_showcase}
      </div>
    </div>
  </section>
"""

# Tab switch JS
tab_js = """
<script>
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
</script>
"""

# ── 3. Insert CSS ──────────────────────────────────────────────────
css_marker = '/* ======== V-TOURS DASHBOARD MOCKUPS ======== */'
src = src.replace(css_marker, css_marker + tab_css)

# ── 4. Insert the tabbed section after the hero ────────────────────
hero_end = '  <!-- WHAT IS V-TOURS -->'
src = src.replace(hero_end, new_section + '\n' + hero_end)

# ── 5. Insert tab JS before closing </div> of vtours page ─────────
# Find the end of the vtours page - it's before the next page or the global footer
# Insert the script just before the closing style+sections
# Actually, put it right before </div> that closes p-vtours
# Let's put it at the end of the vtours page, before its closing tag

# Find the pricing/CTA section end and the page close
cta_marker = '  <!-- CTA -->'
cta_idx = src.index(cta_marker)
# Find the </div> that closes p-vtours after the CTA
page_close_pattern = '</div>\n\n<!-- '
page_close_idx = src.index(page_close_pattern, cta_idx)
src = src[:page_close_idx] + tab_js + '\n' + src[page_close_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done: Dashboards moved to top with clickable tabs.')
