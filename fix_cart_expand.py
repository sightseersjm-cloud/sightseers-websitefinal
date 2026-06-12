#!/usr/bin/env python3
"""
Fix cart (move to body via JS), move expand next to LIVE, Apple UI polish
"""

with open('Design_Reference.html', 'r', encoding='utf-8') as f:
    content = f.read()

n = 0
def sr(content, old, new, desc=""):
    global n
    if old not in content:
        print(f"  WARN: {desc}")
        return content
    content = content.replace(old, new, 1)
    n += 1
    print(f"  OK: {desc}")
    return content

# ================================================================
# 1. REMOVE STATIC CART DRAWER HTML (will create via JS on body)
# ================================================================
print("=== 1. REMOVE STATIC CART HTML ===")

content = sr(content,
    """              <!-- CART DRAWER -->
              <div class="vt-cart-overlay" id="vt-cart-overlay" onclick="vtCloseCart()"></div>
              <div class="vt-cart-drawer" id="vt-cart-drawer">
                <div class="vt-cart-drawer-head">
                  <h3><i class="fas fa-shopping-cart"></i>Your Cart</h3>
                  <button class="vt-cart-close" onclick="vtCloseCart()"><i class="fas fa-times"></i></button>
                </div>
                <div class="vt-cart-items" id="vt-cart-items">
                  <div class="vt-cart-empty" id="vt-cart-empty"><i class="fas fa-shopping-basket"></i>Your cart is empty.<br>Add items from the shop or click hotspots in the tour!</div>
                </div>
                <div class="vt-cart-footer">
                  <div class="vt-cart-total"><span>Total</span><span id="vt-cart-total">USD $0.00</span></div>
                  <button class="vt-cart-checkout" id="vt-cart-checkout-btn" onclick="vtCheckout()" disabled>Checkout</button>
                </div>
              </div>

""",
    "\n",
    "Remove static cart drawer HTML")

# ================================================================
# 2. MOVE EXPAND BUTTON NEXT TO LIVE INDICATOR
# ================================================================
print("\n=== 2. MOVE EXPAND BUTTON ===")

# Remove expand button from bottom of video
content = sr(content,
    """                        <!-- Session Expand Button -->
                        <div class="vt-session-expand" onclick="vtExpandSession()"><i class="fas fa-expand"></i></div>""",
    '',
    "Remove expand from video bottom")

# Add expand button inside the LIVE indicator line
content = sr(content,
    '<div class="vt-live-indicator"><div class="vt-live-indicator-dot"></div>LIVE <span class="vt-live-indicator-time" id="vt-live-timer">12:04</span></div>',
    '<div class="vt-live-indicator"><div class="vt-live-indicator-dot"></div>LIVE <span class="vt-live-indicator-time" id="vt-live-timer">12:04</span></div><div class="vt-session-expand" onclick="vtExpandSession()" title="Expand Session"><i class="fas fa-expand"></i></div>',
    "Add expand button next to LIVE indicator")

# ================================================================
# 3. UPDATE CSS - Expand button next to LIVE, Apple session expand
# ================================================================
print("\n=== 3. POLISH CSS ===")

# Replace expand button CSS to sit next to LIVE indicator
content = sr(content,
    """.vt-session-expand{position:absolute;bottom:10px;right:10px;z-index:15;width:32px;height:32px;border-radius:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.7);font-size:13px;transition:all .25s;border:1px solid rgba(255,255,255,.1)}
.vt-session-expand:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.1)}""",
    """.vt-session-expand{position:absolute;top:12px;right:12px;z-index:16;width:30px;height:30px;border-radius:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.75);font-size:12px;transition:all .3s cubic-bezier(.25,.46,.45,.94);border:1px solid rgba(255,255,255,.12)}
.vt-session-expand:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.08);box-shadow:0 4px 16px rgba(0,0,0,.3)}""",
    "Expand btn position next to LIVE")

# Move LIVE indicator left to make room for expand button on right
content = sr(content,
    '.vt-live-indicator{position:absolute;top:12px;right:12px;z-index:15;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;pointer-events:none}',
    '.vt-live-indicator{position:absolute;top:12px;right:50px;z-index:15;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:5px 12px;border-radius:14px;font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.8px;pointer-events:none}',
    "LIVE indicator shifted left for expand button")

# Replace session fullscreen CSS with Apple-style animation
content = sr(content,
    """.vt-session.vt-session-fs{position:fixed!important;inset:16px!important;z-index:10001!important;border-radius:16px!important;box-shadow:0 40px 120px rgba(0,0,0,.6)!important;display:flex!important;flex-direction:column!important;animation:vtFullIn .4s cubic-bezier(.16,1,.3,1) forwards}
.vt-session.vt-session-fs .vt-session-bar{flex-shrink:0}
.vt-session.vt-session-fs .vt-session-content{flex:1!important;min-height:0!important}
.vt-session.vt-session-fs .vt-session-video{min-height:0!important;flex:1!important}
.vt-session.vt-session-fs .vt-session-side{max-height:none}
.vt-session.vt-session-fs .vt-session-actions{flex-shrink:0}
.vt-session.vt-session-fs .vt-session-expand i::before{content:"\\f066"}
@media(max-width:768px){.vt-session.vt-session-fs{inset:0!important;border-radius:0!important}}""",
    """.vt-session.vt-session-fs{position:fixed!important;inset:12px!important;z-index:10001!important;border-radius:20px!important;box-shadow:0 40px 100px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)!important;display:flex!important;flex-direction:column!important;animation:vtSessionOpen .5s cubic-bezier(.2,.9,.3,1) forwards;overflow:hidden!important}
.vt-session.vt-session-fs .vt-session-bar{flex-shrink:0}
.vt-session.vt-session-fs .vt-session-content{flex:1!important;min-height:0!important;display:grid!important;grid-template-columns:1fr 280px!important}
.vt-session.vt-session-fs .vt-session-video{min-height:0!important;flex:1!important}
.vt-session.vt-session-fs .vt-session-side{max-height:none;overflow-y:auto}
.vt-session.vt-session-fs .vt-session-actions{flex-shrink:0}
.vt-session.vt-session-fs .vt-session-expand i::before{content:"\\f066"}
@keyframes vtSessionOpen{0%{opacity:0;transform:scale(.92);border-radius:28px}100%{opacity:1;transform:scale(1);border-radius:20px}}
@media(max-width:768px){.vt-session.vt-session-fs{inset:0!important;border-radius:0!important}.vt-session.vt-session-fs .vt-session-content{grid-template-columns:1fr!important}}""",
    "Apple-style session expand animation")

# ================================================================
# 4. REWRITE CART JS - Create on document.body, fully working
# ================================================================
print("\n=== 4. FIX CART JS ===")

content = sr(content,
    """var vtCart=[];
function vtAddToCart(el,name,price){
  price=price||0;
  vtCart.push({name:name,price:price,id:'cart-'+Date.now()+Math.random()});
  el.textContent='Added!';el.classList.add('added');
  var c=document.getElementById('vt-exp-items');if(c){c.textContent=parseInt(c.textContent)+1}
  vtUpdateCartBadge();
  vtToast('<i class="fas fa-check-circle"></i> '+name+' added to cart');
  setTimeout(function(){el.textContent='Add';el.classList.remove('added')},2000);
}
function vtUpdateCartBadge(){
  var badge=document.getElementById('vt-cart-badge');
  if(badge){badge.textContent=vtCart.length;if(vtCart.length>0)badge.classList.add('show');else badge.classList.remove('show')}
}
function vtOpenCart(){
  vtRenderCart();
  document.getElementById('vt-cart-drawer').classList.add('open');
  document.getElementById('vt-cart-overlay').classList.add('open');
}
function vtCloseCart(){
  document.getElementById('vt-cart-drawer').classList.remove('open');
  document.getElementById('vt-cart-overlay').classList.remove('open');
}
function vtRenderCart(){
  var container=document.getElementById('vt-cart-items');
  var empty=document.getElementById('vt-cart-empty');
  var total=0;
  if(vtCart.length===0){
    container.innerHTML='<div class="vt-cart-empty" id="vt-cart-empty"><i class="fas fa-shopping-basket"></i>Your cart is empty.<br>Add items from the shop or click hotspots in the tour!</div>';
    document.getElementById('vt-cart-total').textContent='USD $0.00';
    document.getElementById('vt-cart-checkout-btn').disabled=true;
    return;
  }
  var html='';
  vtCart.forEach(function(item,i){
    total+=item.price;
    html+='<div class="vt-cart-item"><div class="vt-cart-item-info"><div class="vt-cart-item-name">'+item.name+'</div><div class="vt-cart-item-price">USD $'+item.price.toFixed(2)+'</div></div><div class="vt-cart-item-remove" onclick="vtRemoveFromCart('+i+')"><i class="fas fa-trash-alt"></i></div></div>';
  });
  container.innerHTML=html;
  document.getElementById('vt-cart-total').textContent='USD $'+total.toFixed(2);
  document.getElementById('vt-cart-checkout-btn').disabled=false;
}
function vtRemoveFromCart(idx){
  var item=vtCart[idx];
  vtCart.splice(idx,1);
  vtUpdateCartBadge();
  vtRenderCart();
  vtToast('<i class="fas fa-trash-alt"></i> '+item.name+' removed from cart');
}
function vtCheckout(){
  if(vtCart.length===0)return;
  var total=0;vtCart.forEach(function(i){total+=i.price});
  var btn=document.getElementById('vt-cart-checkout-btn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled=true;
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle"></i> Order Confirmed!';
    btn.style.background='#22c55e';
    vtToast('<i class="fas fa-check-circle"></i> Order placed! USD $'+total.toFixed(2)+' total. Confirmation email sent.');
    setTimeout(function(){
      vtCart=[];vtUpdateCartBadge();vtRenderCart();
      btn.innerHTML='Checkout';btn.style.background='';btn.disabled=true;
      vtCloseCart();
    },3000);
  },2000);
}""",
    """var vtCart=[];
var vtCartReady=false;
function vtEnsureCart(){
  if(vtCartReady)return;
  vtCartReady=true;
  var ov=document.createElement('div');
  ov.id='vt-cart-overlay';ov.className='vt-cart-overlay';ov.onclick=vtCloseCart;
  document.body.appendChild(ov);
  var d=document.createElement('div');
  d.id='vt-cart-drawer';d.className='vt-cart-drawer';
  d.innerHTML='<div class="vt-cart-drawer-head"><h3><i class="fas fa-shopping-cart"></i> Your Cart</h3><button class="vt-cart-close" onclick="vtCloseCart()"><i class="fas fa-times"></i></button></div><div class="vt-cart-items" id="vt-cart-items"><div class="vt-cart-empty"><i class="fas fa-shopping-basket"></i>Your cart is empty.<br>Add items from the shop or hotspots!</div></div><div class="vt-cart-footer"><div class="vt-cart-total"><span>Total</span><span id="vt-cart-total">USD $0.00</span></div><button class="vt-cart-checkout" id="vt-cart-checkout-btn" onclick="vtCheckout()" disabled><i class="fas fa-lock" style="margin-right:6px"></i>Checkout</button></div>';
  document.body.appendChild(d);
}
function vtAddToCart(el,name,price){
  vtEnsureCart();
  price=price||0;
  vtCart.push({name:name,price:price,id:'cart-'+Date.now()});
  el.textContent='Added!';el.classList.add('added');
  var c=document.getElementById('vt-exp-items');if(c){c.textContent=parseInt(c.textContent)+1}
  vtUpdateCartBadge();
  vtToast('<i class="fas fa-cart-plus"></i> '+name+' added to cart');
  setTimeout(function(){el.textContent='Add';el.classList.remove('added')},2000);
}
function vtUpdateCartBadge(){
  var badge=document.getElementById('vt-cart-badge');
  if(badge){badge.textContent=vtCart.length;if(vtCart.length>0)badge.classList.add('show');else badge.classList.remove('show')}
}
function vtOpenCart(){
  vtEnsureCart();
  vtRenderCart();
  document.getElementById('vt-cart-drawer').classList.add('open');
  document.getElementById('vt-cart-overlay').classList.add('open');
}
function vtCloseCart(){
  var d=document.getElementById('vt-cart-drawer');if(d)d.classList.remove('open');
  var o=document.getElementById('vt-cart-overlay');if(o)o.classList.remove('open');
}
function vtRenderCart(){
  var container=document.getElementById('vt-cart-items');if(!container)return;
  var total=0;
  if(vtCart.length===0){
    container.innerHTML='<div class="vt-cart-empty"><i class="fas fa-shopping-basket"></i>Your cart is empty.<br>Add items from the shop or hotspots!</div>';
    document.getElementById('vt-cart-total').textContent='USD $0.00';
    document.getElementById('vt-cart-checkout-btn').disabled=true;
    return;
  }
  var html='';
  vtCart.forEach(function(item,i){
    total+=item.price;
    html+='<div class="vt-cart-item"><div class="vt-cart-item-info"><div class="vt-cart-item-name">'+item.name+'</div><div class="vt-cart-item-price">USD $'+item.price.toFixed(2)+'</div></div><div class="vt-cart-item-remove" onclick="vtRemoveFromCart('+i+')"><i class="fas fa-trash-alt"></i></div></div>';
  });
  container.innerHTML=html;
  document.getElementById('vt-cart-total').textContent='USD $'+total.toFixed(2);
  document.getElementById('vt-cart-checkout-btn').disabled=false;
}
function vtRemoveFromCart(idx){
  var item=vtCart[idx];
  vtCart.splice(idx,1);
  vtUpdateCartBadge();
  vtRenderCart();
  vtToast('<i class="fas fa-trash-alt"></i> '+item.name+' removed');
}
function vtCheckout(){
  if(vtCart.length===0)return;
  var total=0;vtCart.forEach(function(i){total+=i.price});
  var btn=document.getElementById('vt-cart-checkout-btn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin" style="margin-right:6px"></i>Processing order...';
  btn.disabled=true;
  setTimeout(function(){
    btn.innerHTML='<i class="fas fa-check-circle" style="margin-right:6px"></i>Order Confirmed!';
    btn.style.background='linear-gradient(135deg,#22c55e,#16a34a)';
    vtToast('<i class="fas fa-check-circle"></i> Order placed! USD $'+total.toFixed(2)+'. Confirmation sent to your email.');
    setTimeout(function(){
      vtCart=[];vtUpdateCartBadge();vtRenderCart();
      btn.innerHTML='<i class="fas fa-lock" style="margin-right:6px"></i>Checkout';btn.style.background='';btn.disabled=true;
      vtCloseCart();
    },3000);
  },2000);
}""",
    "Cart JS → creates on document.body")

# Also fix vtBuyHotspot to use vtEnsureCart
content = sr(content,
    "vtCart.push({name:d.name,price:d.priceNum,id:'hs-'+vtCurrentHotspot+'-'+Date.now()});",
    "vtEnsureCart();vtCart.push({name:d.name,price:d.priceNum,id:'hs-'+vtCurrentHotspot+'-'+Date.now()});",
    "vtBuyHotspot calls vtEnsureCart")

# ================================================================
# 5. POLISH SESSION EXPAND JS
# ================================================================
print("\n=== 5. POLISH SESSION EXPAND JS ===")

content = sr(content,
    """/* ═══════ SESSION FULLSCREEN ═══════ */
var vtSessionExpanded=false;
function vtExpandSession(){
  var session=document.getElementById('vt-active-session');if(!session)return;
  if(vtSessionExpanded){vtCollapseSession();return}
  vtSessionExpanded=true;
  var ov=document.getElementById('vt-fs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-fs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseSession;document.body.appendChild(ov)}
  var cl=document.getElementById('vt-fs-close');
  if(!cl){cl=document.createElement('div');cl.id='vt-fs-close';cl.className='vt-fs-close';cl.innerHTML='<i class="fas fa-times"></i>';cl.onclick=vtCollapseSession;document.body.appendChild(cl)}
  ov.classList.add('open');cl.classList.add('open');
  session.classList.add('vt-session-fs');
  document.body.style.overflow='hidden';
}
function vtCollapseSession(){
  if(!vtSessionExpanded)return;
  vtSessionExpanded=false;
  var session=document.getElementById('vt-active-session');
  if(session)session.classList.remove('vt-session-fs');
  var ov=document.getElementById('vt-fs-overlay');if(ov)ov.classList.remove('open');
  var cl=document.getElementById('vt-fs-close');if(cl)cl.classList.remove('open');
  document.body.style.overflow='';
}""",
    """/* ═══════ SESSION FULLSCREEN (Apple-style) ═══════ */
var vtSessionExpanded=false;
function vtExpandSession(){
  var session=document.getElementById('vt-active-session');if(!session)return;
  if(vtSessionExpanded){vtCollapseSession();return}
  vtSessionExpanded=true;
  var ov=document.getElementById('vt-sfs-overlay');
  if(!ov){ov=document.createElement('div');ov.id='vt-sfs-overlay';ov.className='vt-fs-overlay';ov.onclick=vtCollapseSession;document.body.appendChild(ov)}
  ov.classList.add('open');
  session.classList.add('vt-session-fs');
  document.body.style.overflow='hidden';
}
function vtCollapseSession(){
  if(!vtSessionExpanded)return;
  vtSessionExpanded=false;
  var session=document.getElementById('vt-active-session');
  if(session){session.style.animation='vtSessionClose .35s cubic-bezier(.4,0,.2,1) forwards';setTimeout(function(){session.classList.remove('vt-session-fs');session.style.animation=''},350)}
  var ov=document.getElementById('vt-sfs-overlay');if(ov)ov.classList.remove('open');
  document.body.style.overflow='';
}""",
    "Apple-style session expand/collapse JS")

# Add close animation keyframes to the CSS
content = sr(content,
    '@keyframes vtSessionOpen{0%{opacity:0;transform:scale(.92);border-radius:28px}100%{opacity:1;transform:scale(1);border-radius:20px}}',
    '@keyframes vtSessionOpen{0%{opacity:0;transform:scale(.92);border-radius:28px}100%{opacity:1;transform:scale(1);border-radius:20px}}\n@keyframes vtSessionClose{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.95)}}',
    "Add close animation keyframes")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nDone! {n} changes applied.")
