#!/usr/bin/env python3
"""
Fix hotspot popups:
1. Move popup to document.body to escape transform stacking context
2. Add photo capture experience for Photo Print hotspot
3. Clean positioning to prevent overlap
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

# ========== 1. MOVE POPUP TO BODY + PHOTO CAPTURE ==========
print("=== MOVE POPUP TO BODY ===")

# Remove popup from inside the session video
c = sr(c,
    """                        <!-- Hotspot Purchase Popup -->
                        <div class="vt-hotspot-popup" id="vt-hotspot-popup">
                          <div class="vt-hotspot-popup-close" onclick="vtCloseHotspot()"><i class="fas fa-times"></i></div>
                          <h4 id="vt-hs-name"></h4>
                          <p id="vt-hs-desc"></p>
                          <div class="vt-hotspot-popup-price" id="vt-hs-price"></div>
                          <button class="vt-hotspot-popup-buy" onclick="vtBuyHotspot()"><i class="fas fa-shopping-cart" style="margin-right:6px"></i>Buy Now</button>
                        </div>""",
    """                        <!-- Hotspot popup moved to body via JS -->""",
    "Remove inline popup HTML")

# Update vtShowHotspot to create popup on body if not exists
print("\n=== UPDATE JS ===")

c = sr(c,
    """var vtCurrentHotspot=null;
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
  var hs=e.target.closest('.vt-hotspot');
  var rect=hs.getBoundingClientRect();
  popup.style.top=Math.max(10,Math.min(rect.top-10,window.innerHeight-260))+'px';
  popup.style.left=Math.max(10,Math.min(rect.right+10,window.innerWidth-250))+'px';
  popup.classList.add('show');
}
function vtCloseHotspot(){document.getElementById('vt-hotspot-popup').classList.remove('show');vtCurrentHotspot=null}
function vtBuyHotspot(){
  if(!vtCurrentHotspot)return;
  var d=vtHotspotData[vtCurrentHotspot];
  var btn=document.querySelector('.vt-hotspot-popup-buy');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding to cart...';
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle"></i> Added to Cart!';btn.classList.add('bought');
    vtEnsureCart();vtCart.push({name:d.name,price:d.priceNum,id:'hs-'+vtCurrentHotspot+'-'+Date.now()});
    vtUpdateCartBadge();
    var c=document.getElementById('vt-exp-items');if(c)c.textContent=parseInt(c.textContent)+1;
    vtToast('<i class="fas fa-cart-plus"></i> '+d.name+' added to cart! USD $'+d.priceNum.toFixed(2));
    var box=document.getElementById('vt-chat-messages');
    if(box){var msgs=box.querySelectorAll('.vt-session-chat-msg');if(msgs.length>=15)msgs[0].remove();box.innerHTML+='<div class="vt-session-chat-msg"><div class="vt-session-chat-avatar guide">M</div><div class="vt-session-chat-text">'+d.name+' added to cart! Great choice.</div></div>';box.scrollTop=box.scrollHeight}
    setTimeout(function(){vtCloseHotspot()},1500);
  },1000);
}""",
    """var vtCurrentHotspot=null;
function vtEnsureHotspotPopup(){
  var p=document.getElementById('vt-hotspot-popup');
  if(p)return p;
  p=document.createElement('div');
  p.id='vt-hotspot-popup';
  p.className='vt-hotspot-popup';
  p.innerHTML='<div class="vt-hotspot-popup-close" onclick="vtCloseHotspot()"><i class="fas fa-times"></i></div><h4 id="vt-hs-name"></h4><p id="vt-hs-desc"></p><div id="vt-hs-preview"></div><div class="vt-hotspot-popup-price" id="vt-hs-price"></div><button class="vt-hotspot-popup-buy" onclick="vtBuyHotspot()"><i class="fas fa-shopping-cart" style="margin-right:6px"></i>Buy Now</button>';
  document.body.appendChild(p);
  p.addEventListener('mouseenter',function(){if(vtHotspotTimer)clearTimeout(vtHotspotTimer)});
  p.addEventListener('mouseleave',function(){vtHideHotspot()});
  return p;
}
function vtShowHotspot(e,id){
  e.stopPropagation();
  if(vtHotspotTimer)clearTimeout(vtHotspotTimer);
  var d=vtHotspotData[id];if(!d)return;
  vtCurrentHotspot=id;
  var popup=vtEnsureHotspotPopup();
  document.getElementById('vt-hs-name').textContent=d.name;
  document.getElementById('vt-hs-desc').textContent=d.desc;
  document.getElementById('vt-hs-price').textContent=d.price;
  var preview=document.getElementById('vt-hs-preview');
  if(id==='hs3'){
    preview.innerHTML='<div class="vt-photo-capture"><div class="vt-photo-viewfinder"><div class="vt-photo-frame"></div><div class="vt-photo-flash" id="vt-photo-flash"></div></div><button class="vt-photo-snap-btn" onclick="vtSnapPhoto(event)"><i class="fas fa-camera"></i> Capture This Moment</button></div>';
    preview.style.display='block';
  } else {
    preview.innerHTML='';preview.style.display='none';
  }
  var btn=popup.querySelector('.vt-hotspot-popup-buy');
  if(id==='hs3'){btn.style.display='none'}else{btn.style.display='';btn.innerHTML='<i class="fas fa-shopping-cart" style="margin-right:6px"></i>Add to Cart';btn.classList.remove('bought')}
  var hs=e.target.closest('.vt-hotspot');
  var rect=hs.getBoundingClientRect();
  var popW=250,popH=id==='hs3'?360:260;
  var top=Math.max(10,Math.min(rect.top-20,window.innerHeight-popH-10));
  var left=rect.right+12;
  if(left+popW>window.innerWidth-10){left=rect.left-popW-12}
  if(left<10)left=10;
  popup.style.top=top+'px';
  popup.style.left=left+'px';
  popup.classList.add('show');
}
function vtCloseHotspot(){var p=document.getElementById('vt-hotspot-popup');if(p)p.classList.remove('show');vtCurrentHotspot=null}
function vtSnapPhoto(e){
  e.stopPropagation();
  var flash=document.getElementById('vt-photo-flash');
  if(flash){flash.classList.add('fire');setTimeout(function(){flash.classList.remove('fire')},600)}
  var btn=e.target.closest('.vt-photo-snap-btn');
  if(btn){btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...';btn.disabled=true}
  setTimeout(function(){
    var vf=document.querySelector('.vt-photo-viewfinder');
    if(vf)vf.innerHTML='<div class="vt-photo-result"><i class="fas fa-check-circle" style="font-size:28px;color:#22c55e;margin-bottom:8px"></i><div style="color:#fff;font-size:12px;font-weight:700">Photo Captured!</div><div style="color:rgba(255,255,255,.5);font-size:10px;margin-top:4px">Blue Lagoon — ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '</div></div>';
    if(btn){btn.innerHTML='<i class="fas fa-cart-plus"></i> Add Print to Cart';btn.disabled=false;btn.onclick=function(ev){ev.stopPropagation();vtBuyPhotoprint()}}
  },1200);
}
function vtBuyPhotoprint(){
  var d=vtHotspotData['hs3'];
  vtEnsureCart();vtCart.push({name:d.name,price:d.priceNum,id:'hs-hs3-'+Date.now()});
  vtUpdateCartBadge();
  var c=document.getElementById('vt-exp-items');if(c)c.textContent=parseInt(c.textContent)+1;
  vtToast('<i class="fas fa-image"></i> Photo print added to cart! Ships on gallery-grade paper.');
  setTimeout(function(){vtCloseHotspot()},1200);
}
function vtBuyHotspot(){
  if(!vtCurrentHotspot)return;
  var d=vtHotspotData[vtCurrentHotspot];
  var btn=document.querySelector('.vt-hotspot-popup-buy');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding...';
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle"></i> Added to Cart!';btn.classList.add('bought');
    vtEnsureCart();vtCart.push({name:d.name,price:d.priceNum,id:'hs-'+vtCurrentHotspot+'-'+Date.now()});
    vtUpdateCartBadge();
    var c=document.getElementById('vt-exp-items');if(c)c.textContent=parseInt(c.textContent)+1;
    vtToast('<i class="fas fa-cart-plus"></i> '+d.name+' added to cart! USD $'+d.priceNum.toFixed(2));
    var box=document.getElementById('vt-chat-messages');
    if(box){var msgs=box.querySelectorAll('.vt-session-chat-msg');if(msgs.length>=15)msgs[0].remove();box.innerHTML+='<div class="vt-session-chat-msg"><div class="vt-session-chat-avatar guide">M</div><div class="vt-session-chat-text">'+d.name+' added to cart! Great choice.</div></div>';box.scrollTop=box.scrollHeight}
    setTimeout(function(){vtCloseHotspot()},1500);
  },800);
}""",
    "Rewrite hotspot JS with body popup + photo capture")

# Remove old popup mouse listeners since we add them in vtEnsureHotspotPopup now
c = sr(c,
    """(function(){
  var popup=document.getElementById('vt-hotspot-popup');
  if(popup){popup.addEventListener('mouseenter',function(){if(vtHotspotTimer)clearTimeout(vtHotspotTimer)});popup.addEventListener('mouseleave',function(){vtHideHotspot()})}
})();""",
    "",
    "Remove old popup listeners")

# ========== 2. ADD PHOTO CAPTURE CSS ==========
print("\n=== PHOTO CAPTURE CSS ===")

photo_css = """
/* ======== PHOTO CAPTURE ======== */
.vt-photo-capture{margin:10px 0 8px}
.vt-photo-viewfinder{position:relative;height:120px;background:linear-gradient(160deg,#0b3d5e,#145a7a,#1a8a6e);border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.1)}
.vt-photo-frame{position:absolute;inset:12px;border:1.5px solid rgba(255,255,255,.3);border-radius:6px;pointer-events:none}
.vt-photo-frame::before,.vt-photo-frame::after{content:'';position:absolute;width:14px;height:14px;border-color:var(--orange);border-style:solid}
.vt-photo-frame::before{top:-1px;left:-1px;border-width:2px 0 0 2px;border-radius:3px 0 0 0}
.vt-photo-frame::after{bottom:-1px;right:-1px;border-width:0 2px 2px 0;border-radius:0 0 3px 0}
.vt-photo-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .1s}
.vt-photo-flash.fire{opacity:1;animation:vtFlash .5s ease-out forwards}
@keyframes vtFlash{0%{opacity:1}100%{opacity:0}}
.vt-photo-snap-btn{width:100%;margin-top:8px;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .25s}
.vt-photo-snap-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(99,102,241,.4)}
.vt-photo-snap-btn:disabled{opacity:.7;cursor:default;transform:none;box-shadow:none}
.vt-photo-result{text-align:center;padding:10px}
"""

c = sr(c,
    '/* ======== POINT AND ASK ======== */',
    photo_css + '/* ======== POINT AND ASK ======== */',
    "Insert photo capture CSS")

# ========== 3. WIDEN POPUP FOR PHOTO ==========
print("\n=== WIDEN POPUP ===")

c = sr(c,
    '.vt-hotspot-popup{position:fixed;z-index:9999;background:rgba(13,27,42,.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 18px;width:230px;',
    '.vt-hotspot-popup{position:fixed;z-index:100005;background:rgba(13,27,42,.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 18px;width:240px;',
    "Popup z-index boost + width")

# Close button hover fix
c = sr(c,
    '.vt-hotspot-popup-close:hover{color:var(--navy)}',
    '.vt-hotspot-popup-close:hover{color:#fff}',
    "Close hover → white")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
