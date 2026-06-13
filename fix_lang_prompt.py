#!/usr/bin/env python3
"""
Redesign language prompt:
1. Apple-style top slide-down banner (not centered modal)
2. English (United States) first with US flag
3. Translate dashboard text when language is selected
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

# ========== 1. REPLACE PROMPT CSS ==========
print("=== REPLACE PROMPT CSS ===")

c = sr(c,
    """/* Language Prompt Modal */
.vt-lang-prompt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:100020;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:all .4s}
.vt-lang-prompt-overlay.open{opacity:1;pointer-events:auto}
.vt-lang-prompt{background:linear-gradient(160deg,#0d1b2a,#132d46);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:32px;max-width:400px;width:90%;box-shadow:0 40px 100px rgba(0,0,0,.6);text-align:center;transform:scale(.92);transition:transform .4s cubic-bezier(.2,.9,.3,1)}
.vt-lang-prompt-overlay.open .vt-lang-prompt{transform:scale(1)}
.vt-lang-prompt-icon{font-size:40px;margin-bottom:12px}
.vt-lang-prompt h3{color:#fff;font-size:18px;margin-bottom:6px;font-weight:800}
.vt-lang-prompt p{color:rgba(255,255,255,.5);font-size:12px;margin-bottom:20px;line-height:1.6}
.vt-lang-prompt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:20px}
.vt-lang-prompt-item{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);cursor:pointer;transition:all .2s;font-size:12px;color:rgba(255,255,255,.7)}
.vt-lang-prompt-item:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#fff}
.vt-lang-prompt-item.selected{background:rgba(239,135,49,.15);border-color:rgba(239,135,49,.3);color:var(--orange)}
.vt-lang-prompt-item .vt-lang-flag{font-size:20px}
.vt-lang-prompt-confirm{width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--orange),#d97706);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .3s;font-family:inherit}
.vt-lang-prompt-confirm:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,135,49,.4)}
.vt-lang-prompt-confirm:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none}
.vt-lang-prompt-skip{margin-top:10px;font-size:11px;color:rgba(255,255,255,.35);cursor:pointer;transition:color .2s;background:none;border:none;font-family:inherit}
.vt-lang-prompt-skip:hover{color:rgba(255,255,255,.6)}""",
    """/* Language Prompt — Apple-style top banner */
.vt-lang-prompt-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:100020;opacity:0;pointer-events:none;transition:all .35s}
.vt-lang-prompt-overlay.open{opacity:1;pointer-events:auto}
.vt-lang-prompt{position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-100%);width:520px;max-width:94vw;background:rgba(255,255,255,.92);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(0,0,0,.08);border-top:none;border-radius:0 0 20px 20px;padding:24px 28px 20px;box-shadow:0 12px 48px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);z-index:100021;transition:transform .5s cubic-bezier(.32,1.08,.6,1)}
.vt-lang-prompt-overlay.open .vt-lang-prompt{transform:translateX(-50%) translateY(0)}
.vt-lang-prompt-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.vt-lang-prompt-top h3{color:#1d1d1f;font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px}
.vt-lang-prompt-top h3 i{color:var(--orange);font-size:14px}
.vt-lang-prompt p{color:#86868b;font-size:12px;margin:0 0 16px;line-height:1.5}
.vt-lang-prompt-close{width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#86868b;font-size:12px;transition:all .2s;border:none}
.vt-lang-prompt-close:hover{background:rgba(0,0,0,.1);color:#1d1d1f}
.vt-lang-prompt-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:16px}
.vt-lang-prompt-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:12px;border:2px solid transparent;background:rgba(0,0,0,.03);cursor:pointer;transition:all .2s;font-size:10px;color:#86868b;font-weight:600;text-align:center}
.vt-lang-prompt-item:hover{background:rgba(0,0,0,.06);color:#1d1d1f}
.vt-lang-prompt-item.selected{background:rgba(239,135,49,.08);border-color:var(--orange);color:var(--orange)}
.vt-lang-prompt-item .vt-lang-flag{font-size:24px;line-height:1}
.vt-lang-prompt-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}
.vt-lang-prompt-confirm{flex:1;padding:10px 20px;border:none;border-radius:10px;background:var(--orange);color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.vt-lang-prompt-confirm:hover{filter:brightness(1.08);box-shadow:0 4px 16px rgba(239,135,49,.3)}
.vt-lang-prompt-skip{padding:10px 16px;border:none;border-radius:10px;background:rgba(0,0,0,.04);font-size:12px;color:#86868b;cursor:pointer;transition:all .2s;font-family:inherit;font-weight:500}
.vt-lang-prompt-skip:hover{background:rgba(0,0,0,.08);color:#1d1d1f}
@media(max-width:560px){.vt-lang-prompt-grid{grid-template-columns:repeat(3,1fr)}}""",
    "Replace prompt CSS → Apple top banner")

# ========== 2. REPLACE PROMPT HTML ==========
print("\n=== REPLACE PROMPT HTML ===")

c = sr(c,
    """  <!-- Language Selection Prompt -->
  <div class="vt-lang-prompt-overlay" id="vt-lang-prompt">
    <div class="vt-lang-prompt">
      <div class="vt-lang-prompt-icon">&#127760;</div>
      <h3>Choose Your Language</h3>
      <p>Select your preferred language for the V-Tours experience. You can change this anytime from the toolbar.</p>
      <div class="vt-lang-prompt-grid">
        <div class="vt-lang-prompt-item selected" data-lang="en" onclick="vtPromptSelectLang(this,'en')"><span class="vt-lang-flag">&#127468;&#127463;</span> English</div>
        <div class="vt-lang-prompt-item" data-lang="es" onclick="vtPromptSelectLang(this,'es')"><span class="vt-lang-flag">&#127466;&#127480;</span> Espa&ntilde;ol</div>
        <div class="vt-lang-prompt-item" data-lang="fr" onclick="vtPromptSelectLang(this,'fr')"><span class="vt-lang-flag">&#127467;&#127479;</span> Fran&ccedil;ais</div>
        <div class="vt-lang-prompt-item" data-lang="de" onclick="vtPromptSelectLang(this,'de')"><span class="vt-lang-flag">&#127465;&#127466;</span> Deutsch</div>
        <div class="vt-lang-prompt-item" data-lang="pt" onclick="vtPromptSelectLang(this,'pt')"><span class="vt-lang-flag">&#127463;&#127479;</span> Portugu&ecirc;s</div>
        <div class="vt-lang-prompt-item" data-lang="ja" onclick="vtPromptSelectLang(this,'ja')"><span class="vt-lang-flag">&#127471;&#127477;</span> &#26085;&#26412;&#35486;</div>
        <div class="vt-lang-prompt-item" data-lang="zh" onclick="vtPromptSelectLang(this,'zh')"><span class="vt-lang-flag">&#127464;&#127475;</span> &#20013;&#25991;</div>
        <div class="vt-lang-prompt-item" data-lang="hi" onclick="vtPromptSelectLang(this,'hi')"><span class="vt-lang-flag">&#127470;&#127475;</span> &#2361;&#2367;&#2344;&#2381;&#2342;&#2368;</div>
        <div class="vt-lang-prompt-item" data-lang="ar" onclick="vtPromptSelectLang(this,'ar')"><span class="vt-lang-flag">&#127480;&#127462;</span> &#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</div>
        <div class="vt-lang-prompt-item" data-lang="it" onclick="vtPromptSelectLang(this,'it')"><span class="vt-lang-flag">&#127470;&#127481;</span> Italiano</div>
      </div>
      <button class="vt-lang-prompt-confirm" id="vt-lang-confirm-btn" onclick="vtConfirmLangPrompt()"><i class="fas fa-check-circle" style="margin-right:6px"></i>Continue with English</button>
      <button class="vt-lang-prompt-skip" onclick="vtSkipLangPrompt()">Skip &mdash; use English</button>
    </div>
  </div>""",
    """  <!-- Language Selection Prompt (Apple-style top banner) -->
  <div class="vt-lang-prompt-overlay" id="vt-lang-prompt" onclick="vtSkipLangPrompt()">
    <div class="vt-lang-prompt" onclick="event.stopPropagation()">
      <div class="vt-lang-prompt-top">
        <h3><i class="fas fa-globe-americas"></i> Choose Your Language</h3>
        <button class="vt-lang-prompt-close" onclick="vtSkipLangPrompt()"><i class="fas fa-times"></i></button>
      </div>
      <p>Select your preferred language. Tours, dashboards, and live captions will update automatically.</p>
      <div class="vt-lang-prompt-grid">
        <div class="vt-lang-prompt-item selected" data-lang="en" onclick="vtPromptSelectLang(this,'en')"><span class="vt-lang-flag">&#127482;&#127480;</span>English</div>
        <div class="vt-lang-prompt-item" data-lang="es" onclick="vtPromptSelectLang(this,'es')"><span class="vt-lang-flag">&#127466;&#127480;</span>Espa&ntilde;ol</div>
        <div class="vt-lang-prompt-item" data-lang="fr" onclick="vtPromptSelectLang(this,'fr')"><span class="vt-lang-flag">&#127467;&#127479;</span>Fran&ccedil;ais</div>
        <div class="vt-lang-prompt-item" data-lang="de" onclick="vtPromptSelectLang(this,'de')"><span class="vt-lang-flag">&#127465;&#127466;</span>Deutsch</div>
        <div class="vt-lang-prompt-item" data-lang="pt" onclick="vtPromptSelectLang(this,'pt')"><span class="vt-lang-flag">&#127463;&#127479;</span>Portugu&ecirc;s</div>
        <div class="vt-lang-prompt-item" data-lang="ja" onclick="vtPromptSelectLang(this,'ja')"><span class="vt-lang-flag">&#127471;&#127477;</span>&#26085;&#26412;&#35486;</div>
        <div class="vt-lang-prompt-item" data-lang="zh" onclick="vtPromptSelectLang(this,'zh')"><span class="vt-lang-flag">&#127464;&#127475;</span>&#20013;&#25991;</div>
        <div class="vt-lang-prompt-item" data-lang="hi" onclick="vtPromptSelectLang(this,'hi')"><span class="vt-lang-flag">&#127470;&#127475;</span>&#2361;&#2367;&#2344;&#2381;&#2342;&#2368;</div>
        <div class="vt-lang-prompt-item" data-lang="ar" onclick="vtPromptSelectLang(this,'ar')"><span class="vt-lang-flag">&#127480;&#127462;</span>&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</div>
        <div class="vt-lang-prompt-item" data-lang="it" onclick="vtPromptSelectLang(this,'it')"><span class="vt-lang-flag">&#127470;&#127481;</span>Italiano</div>
      </div>
      <div class="vt-lang-prompt-footer">
        <button class="vt-lang-prompt-skip" onclick="vtSkipLangPrompt()">Skip</button>
        <button class="vt-lang-prompt-confirm" id="vt-lang-confirm-btn" onclick="vtConfirmLangPrompt()">Continue with English</button>
      </div>
    </div>
  </div>""",
    "Replace prompt HTML → Apple top banner with US flag")

# ========== 3. UPDATE LANG DATA TO USE US FLAG FOR ENGLISH ==========
print("\n=== UPDATE LANG DATA (US FLAG) ===")

c = sr(c,
    "en:{name:'English',flag:'\\u{1F1EC}\\u{1F1E7}',code:'EN'},",
    "en:{name:'English',flag:'\\u{1F1FA}\\u{1F1F8}',code:'EN'},",
    "English flag → US flag")

# Also update the explorer dropdown English option flag
c = sr(c,
    """<div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','explorer')"><span class="vt-lang-flag">&#127468;&#127463;</span><span class="vt-lang-name">English</span>""",
    """<div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','explorer')"><span class="vt-lang-flag">&#127482;&#127480;</span><span class="vt-lang-name">English</span>""",
    "Explorer dropdown EN → US flag")

c = sr(c,
    """<div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','guide')"><span class="vt-lang-flag">&#127468;&#127463;</span><span class="vt-lang-name">English</span>""",
    """<div class="vt-lang-option active" data-lang="en" onclick="vtSelectLang(event,'en','guide')"><span class="vt-lang-flag">&#127482;&#127480;</span><span class="vt-lang-name">English</span>""",
    "Guide dropdown EN → US flag")

# ========== 4. ADD TRANSLATION DATA AND APPLY FUNCTION ==========
print("\n=== ADD TRANSLATION JS ===")

# Replace the vtSelectLang and prompt functions with versions that translate the UI
c = sr(c,
    """function vtSelectLang(e,lang,which){
  e.stopPropagation();
  var isAudio=lang.indexOf('-audio')>-1;
  var baseLang=lang.replace('-audio','');

  if(isAudio){
    vtToast('<i class="fas fa-headphones"></i> AI-translated audio switching to '+vtLangData[baseLang].name+'...');
    setTimeout(function(){vtToast('<i class="fas fa-check-circle"></i> Audio now in '+vtLangData[baseLang].name+' (AI-translated)')},1500);
    document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
    return;
  }

  vtCurrentLang=lang;
  var data=vtLangData[lang];if(!data)return;

  // Update all code displays
  var codes=['vt-exp-lang-code','vt-guide-lang-code','vt-session-lang-label'];
  codes.forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=data.code});

  // Update active states in all dropdowns
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(dd){
    dd.querySelectorAll('.vt-lang-option').forEach(function(opt){
      opt.classList.toggle('active',opt.getAttribute('data-lang')===lang);
    });
  });

  // Close dropdowns
  document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});

  // Save preference
  try{localStorage.setItem('vt-lang',lang)}catch(e){}

  vtToast('<i class="fas fa-language"></i> Language set to '+data.flag+' '+data.name);
}""",
    """var vtTranslations={
  en:{explore:'Explore',browse:'Browse Tours',bookings:'My Bookings',favorites:'Favorites',concierge:'AI Concierge',passport:'Passport',social:'Social',replays:'Replays',history:'History',profile:'Profile',settings:'Settings',main:'Main',smart:'Smart',account:'Account',dashboard:'Dashboard',myTours:'My Tours',schedule:'Schedule',shopItems:'Shop Items',sentiment:'Sentiment',tips:'Tips & Gifts',multiCam:'Multi-Cam',liveTools:'Live Tools',business:'Business',earnings:'Earnings',aiEditor:'AI Editor',pricing:'Pricing',reviews:'Reviews',explorerPortal:'Explorer Portal',guidePortal:'Guide Portal',shopNow:'Shop Now',cart:'Cart',capturePhoto:'Capture Photo',pointAndAsk:'Point and Ask',inviteFriend:'Invite Friend',captions:'Captions',leaveSession:'Leave Session',liveChat:'Live Chat',watching:'watching',addToCart:'ADD',inSessionShop:'In-Session Shop'},
  es:{explore:'Explorar',browse:'Ver Tours',bookings:'Mis Reservas',favorites:'Favoritos',concierge:'Asistente IA',passport:'Pasaporte',social:'Social',replays:'Repeticiones',history:'Historial',profile:'Perfil',settings:'Ajustes',main:'Principal',smart:'Inteligente',account:'Cuenta',dashboard:'Panel',myTours:'Mis Tours',schedule:'Calendario',shopItems:'Art\\u00edculos',sentiment:'Sentimiento',tips:'Propinas y Regalos',multiCam:'Multi-C\\u00e1m',liveTools:'Herramientas',business:'Negocio',earnings:'Ganancias',aiEditor:'Editor IA',pricing:'Precios',reviews:'Rese\\u00f1as',explorerPortal:'Portal Explorador',guidePortal:'Portal de Gu\\u00eda',shopNow:'Comprar',cart:'Carrito',capturePhoto:'Capturar Foto',pointAndAsk:'Se\\u00f1alar',inviteFriend:'Invitar Amigo',captions:'Subt\\u00edtulos',leaveSession:'Salir',liveChat:'Chat en Vivo',watching:'viendo',addToCart:'A\\u00d1ADIR',inSessionShop:'Tienda en Sesi\\u00f3n'},
  fr:{explore:'Explorer',browse:'Parcourir',bookings:'Mes R\\u00e9servations',favorites:'Favoris',concierge:'Concierge IA',passport:'Passeport',social:'Social',replays:'Replays',history:'Historique',profile:'Profil',settings:'Param\\u00e8tres',main:'Principal',smart:'Intelligent',account:'Compte',dashboard:'Tableau de bord',myTours:'Mes Visites',schedule:'Calendrier',shopItems:'Articles',sentiment:'Sentiment',tips:'Pourboires',multiCam:'Multi-Cam',liveTools:'Outils Live',business:'Business',earnings:'Revenus',aiEditor:'\\u00c9diteur IA',pricing:'Tarifs',reviews:'Avis',explorerPortal:'Portail Explorateur',guidePortal:'Portail Guide',shopNow:'Acheter',cart:'Panier',capturePhoto:'Capturer Photo',pointAndAsk:'Pointer',inviteFriend:'Inviter',captions:'Sous-titres',leaveSession:'Quitter',liveChat:'Chat en Direct',watching:'en ligne',addToCart:'AJOUTER',inSessionShop:'Boutique'},
  de:{explore:'Entdecken',browse:'Touren',bookings:'Meine Buchungen',favorites:'Favoriten',concierge:'KI-Concierge',passport:'Pass',social:'Sozial',replays:'Wiederholungen',history:'Verlauf',profile:'Profil',settings:'Einstellungen',main:'Haupt',smart:'Smart',account:'Konto',dashboard:'Dashboard',myTours:'Meine Touren',schedule:'Zeitplan',shopItems:'Artikel',sentiment:'Stimmung',tips:'Trinkgeld',multiCam:'Multi-Cam',liveTools:'Live-Tools',business:'Gesch\\u00e4ft',earnings:'Einnahmen',aiEditor:'KI-Editor',pricing:'Preise',reviews:'Bewertungen',explorerPortal:'Explorer-Portal',guidePortal:'Guide-Portal',shopNow:'Kaufen',cart:'Warenkorb',capturePhoto:'Foto aufnehmen',pointAndAsk:'Zeigen',inviteFriend:'Einladen',captions:'Untertitel',leaveSession:'Verlassen',liveChat:'Live-Chat',watching:'zusehen',addToCart:'HINZUF\\u00dcGEN',inSessionShop:'Session-Shop'},
  pt:{explore:'Explorar',browse:'Ver Tours',bookings:'Minhas Reservas',favorites:'Favoritos',concierge:'Concierge IA',passport:'Passaporte',social:'Social',replays:'Replays',history:'Hist\\u00f3rico',profile:'Perfil',settings:'Configura\\u00e7\\u00f5es',main:'Principal',smart:'Inteligente',account:'Conta',dashboard:'Painel',myTours:'Meus Tours',schedule:'Agenda',shopItems:'Itens',sentiment:'Sentimento',tips:'Gorjetas',multiCam:'Multi-Cam',liveTools:'Ferramentas',business:'Neg\\u00f3cio',earnings:'Ganhos',aiEditor:'Editor IA',pricing:'Pre\\u00e7os',reviews:'Avalia\\u00e7\\u00f5es',explorerPortal:'Portal Explorador',guidePortal:'Portal do Guia',shopNow:'Comprar',cart:'Carrinho',capturePhoto:'Capturar Foto',pointAndAsk:'Apontar',inviteFriend:'Convidar',captions:'Legendas',leaveSession:'Sair',liveChat:'Chat ao Vivo',watching:'assistindo',addToCart:'ADICIONAR',inSessionShop:'Loja da Sess\\u00e3o'},
  ja:{explore:'\\u63a2\\u691c',browse:'\\u30c4\\u30a2\\u30fc\\u4e00\\u89a7',bookings:'\\u4e88\\u7d04',favorites:'\\u304a\\u6c17\\u306b\\u5165\\u308a',concierge:'AI\\u30b3\\u30f3\\u30b7\\u30a7\\u30eb\\u30b8\\u30e5',passport:'\\u30d1\\u30b9\\u30dd\\u30fc\\u30c8',social:'\\u30bd\\u30fc\\u30b7\\u30e3\\u30eb',replays:'\\u30ea\\u30d7\\u30ec\\u30a4',history:'\\u5c65\\u6b74',profile:'\\u30d7\\u30ed\\u30d5\\u30a3\\u30fc\\u30eb',settings:'\\u8a2d\\u5b9a',main:'\\u30e1\\u30a4\\u30f3',smart:'\\u30b9\\u30de\\u30fc\\u30c8',account:'\\u30a2\\u30ab\\u30a6\\u30f3\\u30c8',dashboard:'\\u30c0\\u30c3\\u30b7\\u30e5\\u30dc\\u30fc\\u30c9',myTours:'\\u30de\\u30a4\\u30c4\\u30a2\\u30fc',schedule:'\\u30b9\\u30b1\\u30b8\\u30e5\\u30fc\\u30eb',shopItems:'\\u30b7\\u30e7\\u30c3\\u30d7',sentiment:'\\u611f\\u60c5',tips:'\\u30c1\\u30c3\\u30d7',multiCam:'\\u30de\\u30eb\\u30c1\\u30ab\\u30e0',liveTools:'\\u30e9\\u30a4\\u30d6\\u30c4\\u30fc\\u30eb',business:'\\u30d3\\u30b8\\u30cd\\u30b9',earnings:'\\u53ce\\u76ca',aiEditor:'AI\\u30a8\\u30c7\\u30a3\\u30bf\\u30fc',pricing:'\\u4fa1\\u683c',reviews:'\\u30ec\\u30d3\\u30e5\\u30fc',explorerPortal:'\\u30a8\\u30af\\u30b9\\u30d7\\u30ed\\u30fc\\u30e9\\u30fc',guidePortal:'\\u30ac\\u30a4\\u30c9\\u30dd\\u30fc\\u30bf\\u30eb',shopNow:'\\u8cfc\\u5165',cart:'\\u30ab\\u30fc\\u30c8',capturePhoto:'\\u64ae\\u5f71',pointAndAsk:'\\u8cea\\u554f',inviteFriend:'\\u62db\\u5f85',captions:'\\u5b57\\u5e55',leaveSession:'\\u9000\\u51fa',liveChat:'\\u30e9\\u30a4\\u30d6\\u30c1\\u30e3\\u30c3\\u30c8',watching:'\\u8996\\u8074\\u4e2d',addToCart:'\\u8ffd\\u52a0',inSessionShop:'\\u30b7\\u30e7\\u30c3\\u30d7'},
  zh:{explore:'\\u63a2\\u7d22',browse:'\\u6d4f\\u89c8\\u65c5\\u7a0b',bookings:'\\u6211\\u7684\\u9884\\u8ba2',favorites:'\\u6536\\u85cf',concierge:'AI\\u52a9\\u624b',passport:'\\u62a4\\u7167',social:'\\u793e\\u4ea4',replays:'\\u56de\\u653e',history:'\\u5386\\u53f2',profile:'\\u4e2a\\u4eba\\u8d44\\u6599',settings:'\\u8bbe\\u7f6e',main:'\\u4e3b\\u8981',smart:'\\u667a\\u80fd',account:'\\u8d26\\u6237',dashboard:'\\u4eea\\u8868\\u76d8',myTours:'\\u6211\\u7684\\u65c5\\u7a0b',schedule:'\\u65e5\\u7a0b',shopItems:'\\u5546\\u54c1',sentiment:'\\u60c5\\u611f',tips:'\\u6253\\u8d4f',multiCam:'\\u591a\\u673a\\u4f4d',liveTools:'\\u76f4\\u64ad\\u5de5\\u5177',business:'\\u4e1a\\u52a1',earnings:'\\u6536\\u5165',aiEditor:'AI\\u7f16\\u8f91',pricing:'\\u5b9a\\u4ef7',reviews:'\\u8bc4\\u4ef7',explorerPortal:'\\u63a2\\u7d22\\u8005\\u95e8\\u6237',guidePortal:'\\u5bfc\\u6e38\\u95e8\\u6237',shopNow:'\\u8d2d\\u4e70',cart:'\\u8d2d\\u7269\\u8f66',capturePhoto:'\\u62cd\\u7167',pointAndAsk:'\\u63d0\\u95ee',inviteFriend:'\\u9080\\u8bf7',captions:'\\u5b57\\u5e55',leaveSession:'\\u79bb\\u5f00',liveChat:'\\u5b9e\\u65f6\\u804a\\u5929',watching:'\\u89c2\\u770b\\u4e2d',addToCart:'\\u6dfb\\u52a0',inSessionShop:'\\u5546\\u5e97'},
  hi:{explore:'\\u0916\\u094b\\u091c\\u0947\\u0902',browse:'\\u091f\\u0942\\u0930 \\u0926\\u0947\\u0916\\u0947\\u0902',bookings:'\\u092e\\u0947\\u0930\\u0940 \\u092c\\u0941\\u0915\\u093f\\u0902\\u0917',favorites:'\\u092a\\u0938\\u0902\\u0926\\u0940\\u0926\\u093e',concierge:'AI \\u0938\\u0939\\u093e\\u092f\\u0915',passport:'\\u092a\\u093e\\u0938\\u092a\\u094b\\u0930\\u094d\\u091f',social:'\\u0938\\u094b\\u0936\\u0932',replays:'\\u0930\\u093f\\u092a\\u094d\\u0932\\u0947',history:'\\u0907\\u0924\\u093f\\u0939\\u093e\\u0938',profile:'\\u092a\\u094d\\u0930\\u094b\\u092b\\u093c\\u093e\\u0907\\u0932',settings:'\\u0938\\u0947\\u091f\\u093f\\u0902\\u0917\\u094d\\u0938',main:'\\u092e\\u0941\\u0916\\u094d\\u092f',smart:'\\u0938\\u094d\\u092e\\u093e\\u0930\\u094d\\u091f',account:'\\u0916\\u093e\\u0924\\u093e',dashboard:'\\u0921\\u0948\\u0936\\u092c\\u094b\\u0930\\u094d\\u0921',myTours:'\\u092e\\u0947\\u0930\\u0947 \\u091f\\u0942\\u0930',schedule:'\\u0936\\u0947\\u0921\\u094d\\u092f\\u0942\\u0932',shopItems:'\\u0938\\u093e\\u092e\\u093e\\u0928',sentiment:'\\u092d\\u093e\\u0935\\u0928\\u093e',tips:'\\u091f\\u093f\\u092a\\u094d\\u0938',multiCam:'\\u092e\\u0932\\u094d\\u091f\\u0940-\\u0915\\u0948\\u092e',liveTools:'\\u0932\\u093e\\u0907\\u0935 \\u091f\\u0942\\u0932\\u094d\\u0938',business:'\\u0935\\u094d\\u092f\\u093e\\u092a\\u093e\\u0930',earnings:'\\u0915\\u092e\\u093e\\u0908',aiEditor:'AI \\u0938\\u0902\\u092a\\u093e\\u0926\\u0915',pricing:'\\u092e\\u0942\\u0932\\u094d\\u092f',reviews:'\\u0938\\u092e\\u0940\\u0915\\u094d\\u0937\\u093e',explorerPortal:'\\u090f\\u0915\\u094d\\u0938\\u092a\\u094d\\u0932\\u094b\\u0930\\u0930',guidePortal:'\\u0917\\u093e\\u0907\\u0921 \\u092a\\u094b\\u0930\\u094d\\u091f\\u0932',shopNow:'\\u0916\\u0930\\u0940\\u0926\\u0947\\u0902',cart:'\\u0915\\u093e\\u0930\\u094d\\u091f',capturePhoto:'\\u092b\\u094b\\u091f\\u094b',pointAndAsk:'\\u092a\\u0942\\u091b\\u0947\\u0902',inviteFriend:'\\u0928\\u093f\\u092e\\u0902\\u0924\\u094d\\u0930\\u0923',captions:'\\u0909\\u092a\\u0936\\u0940\\u0930\\u094d\\u0937\\u0915',leaveSession:'\\u091b\\u094b\\u0921\\u093c\\u0947\\u0902',liveChat:'\\u0932\\u093e\\u0907\\u0935 \\u091a\\u0948\\u091f',watching:'\\u0926\\u0947\\u0916 \\u0930\\u0939\\u0947',addToCart:'\\u091c\\u094b\\u0921\\u093c\\u0947\\u0902',inSessionShop:'\\u0926\\u0941\\u0915\\u093e\\u0928'},
  ar:{explore:'\\u0627\\u0633\\u062a\\u0643\\u0634\\u0641',browse:'\\u062a\\u0635\\u0641\\u062d',bookings:'\\u062d\\u062c\\u0648\\u0632\\u0627\\u062a\\u064a',favorites:'\\u0627\\u0644\\u0645\\u0641\\u0636\\u0644\\u0629',concierge:'\\u0645\\u0633\\u0627\\u0639\\u062f AI',passport:'\\u062c\\u0648\\u0627\\u0632',social:'\\u0627\\u062c\\u062a\\u0645\\u0627\\u0639\\u064a',replays:'\\u0625\\u0639\\u0627\\u062f\\u0629',history:'\\u0627\\u0644\\u0633\\u062c\\u0644',profile:'\\u0627\\u0644\\u0645\\u0644\\u0641',settings:'\\u0627\\u0644\\u0625\\u0639\\u062f\\u0627\\u062f\\u0627\\u062a',main:'\\u0631\\u0626\\u064a\\u0633\\u064a',smart:'\\u0630\\u0643\\u064a',account:'\\u0627\\u0644\\u062d\\u0633\\u0627\\u0628',dashboard:'\\u0644\\u0648\\u062d\\u0629',myTours:'\\u062c\\u0648\\u0644\\u0627\\u062a\\u064a',schedule:'\\u0627\\u0644\\u062c\\u062f\\u0648\\u0644',shopItems:'\\u0639\\u0646\\u0627\\u0635\\u0631',sentiment:'\\u0627\\u0644\\u0645\\u0634\\u0627\\u0639\\u0631',tips:'\\u0625\\u0643\\u0631\\u0627\\u0645\\u064a\\u0627\\u062a',multiCam:'\\u0645\\u062a\\u0639\\u062f\\u062f',liveTools:'\\u0623\\u062f\\u0648\\u0627\\u062a',business:'\\u0623\\u0639\\u0645\\u0627\\u0644',earnings:'\\u0627\\u0644\\u0623\\u0631\\u0628\\u0627\\u062d',aiEditor:'\\u0645\\u062d\\u0631\\u0631 AI',pricing:'\\u0627\\u0644\\u062a\\u0633\\u0639\\u064a\\u0631',reviews:'\\u0645\\u0631\\u0627\\u062c\\u0639\\u0627\\u062a',explorerPortal:'\\u0628\\u0648\\u0627\\u0628\\u0629 \\u0627\\u0644\\u0645\\u0633\\u062a\\u0643\\u0634\\u0641',guidePortal:'\\u0628\\u0648\\u0627\\u0628\\u0629 \\u0627\\u0644\\u0645\\u0631\\u0634\\u062f',shopNow:'\\u062a\\u0633\\u0648\\u0642',cart:'\\u0627\\u0644\\u0633\\u0644\\u0629',capturePhoto:'\\u0635\\u0648\\u0631\\u0629',pointAndAsk:'\\u0627\\u0633\\u0623\\u0644',inviteFriend:'\\u062f\\u0639\\u0648\\u0629',captions:'\\u062a\\u0631\\u062c\\u0645\\u0629',leaveSession:'\\u0645\\u063a\\u0627\\u062f\\u0631\\u0629',liveChat:'\\u062f\\u0631\\u062f\\u0634\\u0629',watching:'\\u064a\\u0634\\u0627\\u0647\\u062f\\u0648\\u0646',addToCart:'\\u0623\\u0636\\u0641',inSessionShop:'\\u0645\\u062a\\u062c\\u0631'},
  it:{explore:'Esplora',browse:'Cerca Tour',bookings:'Le Mie Prenotazioni',favorites:'Preferiti',concierge:'Concierge IA',passport:'Passaporto',social:'Sociale',replays:'Replay',history:'Cronologia',profile:'Profilo',settings:'Impostazioni',main:'Principale',smart:'Smart',account:'Account',dashboard:'Dashboard',myTours:'I Miei Tour',schedule:'Programma',shopItems:'Articoli',sentiment:'Sentimento',tips:'Mance',multiCam:'Multi-Cam',liveTools:'Strumenti Live',business:'Business',earnings:'Guadagni',aiEditor:'Editor IA',pricing:'Prezzi',reviews:'Recensioni',explorerPortal:'Portale Esploratore',guidePortal:'Portale Guida',shopNow:'Acquista',cart:'Carrello',capturePhoto:'Scatta Foto',pointAndAsk:'Chiedi',inviteFriend:'Invita',captions:'Sottotitoli',leaveSession:'Esci',liveChat:'Chat dal Vivo',watching:'guardando',addToCart:'AGGIUNGI',inSessionShop:'Negozio'}
};

function vtApplyTranslation(lang){
  var t=vtTranslations[lang];if(!t)t=vtTranslations.en;
  // Explorer sidebar
  var expLinks=document.querySelectorAll('#vt-exp-sidebar a');
  var expMap=['explore','browse','bookings','favorites','concierge','passport','social','replays','history','profile','settings'];
  expLinks.forEach(function(a,i){if(expMap[i]&&t[expMap[i]]){var icon=a.querySelector('i');var badge=a.querySelector('.badge');var text=t[expMap[i]];a.innerHTML='';if(icon)a.appendChild(icon);a.appendChild(document.createTextNode(' '+text));if(badge)a.appendChild(badge)}});
  // Explorer sidebar labels
  var expLabels=document.querySelectorAll('#vt-exp-sidebar .vt-dash-sidebar-label');
  if(expLabels[0])expLabels[0].textContent=t.main;
  if(expLabels[1])expLabels[1].textContent=t.smart;
  if(expLabels[2])expLabels[2].textContent=t.account;
  // Guide sidebar
  var guideLinks=document.querySelectorAll('#vt-guide-sidebar a');
  var guideMap=['dashboard','myTours','schedule','shopItems','sentiment','tips','multiCam','earnings','aiEditor','pricing','reviews'];
  guideLinks.forEach(function(a,i){if(guideMap[i]&&t[guideMap[i]]){var icon=a.querySelector('i');var badge=a.querySelector('.badge');var text=t[guideMap[i]];a.innerHTML='';if(icon)a.appendChild(icon);a.appendChild(document.createTextNode(' '+text));if(badge)a.appendChild(badge)}});
  // Guide sidebar labels
  var guideLabels=document.querySelectorAll('#vt-guide-sidebar .vt-dash-sidebar-label');
  if(guideLabels[0])guideLabels[0].textContent=t.main||'Management';
  if(guideLabels[1])guideLabels[1].textContent=t.liveTools;
  if(guideLabels[2])guideLabels[2].textContent=t.business;
  // Portal labels
  var expPortal=document.querySelector('#vt-explorer-frame .vt-portal-label');
  if(expPortal)expPortal.textContent=t.explorerPortal;
  var guidePortal=document.querySelector('#vt-guide-frame .vt-portal-label');
  if(guidePortal)guidePortal.textContent=t.guidePortal;
  // Session actions
  var actions=document.querySelectorAll('.vt-session-actions .vt-session-action');
  var actionMap=['shopNow','cart','capturePhoto','pointAndAsk','captions','inviteFriend'];
  actions.forEach(function(a,i){if(actionMap[i]&&t[actionMap[i]]){var icon=a.querySelector('i');var badge=a.querySelector('.vt-cart-badge');var span=a.querySelector('span');if(span&&actionMap[i]==='captions'){span.textContent=t[actionMap[i]]}else{var text=t[actionMap[i]];a.innerHTML='';if(icon)a.appendChild(icon);a.appendChild(document.createTextNode(text));if(badge)a.appendChild(badge)}}});
  // Leave session
  var leaveBtn=document.querySelector('.vt-session-bar-btn.leave');
  if(leaveBtn)leaveBtn.textContent=t.leaveSession;
  // Live chat title
  var chatTitle=document.querySelector('.vt-session-chat-title');
  if(chatTitle){var viewerSpan=chatTitle.querySelector('span');chatTitle.childNodes[0].textContent=t.liveChat+' ';if(viewerSpan){var count=viewerSpan.textContent.match(/\\d+/);viewerSpan.textContent=(count?count[0]:'')+' '+t.watching}}
  // In-session shop
  var shopTitle=document.querySelector('.vt-session-shop-title');
  if(shopTitle)shopTitle.textContent=t.inSessionShop;
  // ADD buttons
  document.querySelectorAll('.vt-session-shop-add').forEach(function(b){if(!b.classList.contains('added'))b.textContent=t.addToCart});
}

function vtSelectLang(e,lang,which){
  e.stopPropagation();
  var isAudio=lang.indexOf('-audio')>-1;
  var baseLang=lang.replace('-audio','');

  if(isAudio){
    vtToast('<i class="fas fa-headphones"></i> AI-translated audio switching to '+vtLangData[baseLang].name+'...');
    setTimeout(function(){vtToast('<i class="fas fa-check-circle"></i> Audio now in '+vtLangData[baseLang].name+' (AI-translated)')},1500);
    document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});
    return;
  }

  vtCurrentLang=lang;
  var data=vtLangData[lang];if(!data)return;

  var codes=['vt-exp-lang-code','vt-guide-lang-code','vt-session-lang-label'];
  codes.forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=data.code});

  document.querySelectorAll('.vt-lang-dropdown').forEach(function(dd){
    dd.querySelectorAll('.vt-lang-option').forEach(function(opt){
      opt.classList.toggle('active',opt.getAttribute('data-lang')===lang);
    });
  });

  document.querySelectorAll('.vt-lang-dropdown').forEach(function(d){d.classList.remove('open')});

  try{localStorage.setItem('vt-lang',lang)}catch(e){}

  vtApplyTranslation(lang);
  vtToast('<i class="fas fa-language"></i> '+data.flag+' '+data.name);
}""",
    "Add translation data + vtApplyTranslation + updated vtSelectLang")

# Also update vtConfirmLangPrompt to apply translation
c = sr(c,
    """function vtConfirmLangPrompt(){
  vtSelectLang({stopPropagation:function(){}},vtPromptSelectedLang,'explorer');
  vtCloseLangPrompt();
  try{localStorage.setItem('vt-lang-prompted','1')}catch(e){}
}""",
    """function vtConfirmLangPrompt(){
  vtSelectLang({stopPropagation:function(){}},vtPromptSelectedLang,'explorer');
  vtCloseLangPrompt();
  try{localStorage.setItem('vt-lang-prompted','1')}catch(e){}
}
function vtPromptSelectLang(el,lang){
  document.querySelectorAll('.vt-lang-prompt-item').forEach(function(i){i.classList.remove('selected')});
  el.classList.add('selected');
  vtPromptSelectedLang=lang;
  var data=vtLangData[lang];
  var btn=document.getElementById('vt-lang-confirm-btn');
  if(btn&&data)btn.textContent='Continue with '+data.name;
}""",
    "Rewrite vtPromptSelectLang inline")

# Remove the old vtPromptSelectLang since we moved it
c = sr(c,
    """// Language prompt
var vtPromptSelectedLang='en';
function vtPromptSelectLang(el,lang){
  document.querySelectorAll('.vt-lang-prompt-item').forEach(function(i){i.classList.remove('selected')});
  el.classList.add('selected');
  vtPromptSelectedLang=lang;
  var data=vtLangData[lang];
  var btn=document.getElementById('vt-lang-confirm-btn');
  if(btn&&data)btn.innerHTML='<i class="fas fa-check-circle" style="margin-right:6px"></i>Continue with '+data.name;
}""",
    """// Language prompt
var vtPromptSelectedLang='en';""",
    "Remove old vtPromptSelectLang (moved above)")

# Also apply translation on restore
c = sr(c,
    """// Restore saved language on load
(function(){
  try{
    var saved=localStorage.getItem('vt-lang');
    if(saved&&vtLangData[saved]){
      vtCurrentLang=saved;
      var data=vtLangData[saved];""",
    """// Restore saved language on load
(function(){
  try{
    var saved=localStorage.getItem('vt-lang');
    if(saved&&vtLangData[saved]){
      vtCurrentLang=saved;
      var data=vtLangData[saved];
      setTimeout(function(){vtApplyTranslation(saved)},100);""",
    "Apply translation on restore")

with open('Design_Reference.html', 'w', encoding='utf-8') as f:
    f.write(c)

print(f"\nDone! {n} changes.")
