
(function(){
  if(window.__ssAdminPortalDedupedStabilityPatch) return;
  window.__ssAdminPortalDedupedStabilityPatch = true;

  function q(id){ return document.getElementById(id); }
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  function status(msg, kind, unlockTarget){
    var el;
    if(unlockTarget && !window.adminUnlocked) el = q('adminUnlockStatus');
    else el = q('adminSaveStatus') || q('adminUnlockStatus');
    if(!el) return;
    var cls = 'inline-status';
    if(kind) cls += ' ' + kind;
    if(msg) cls += ' show';
    el.className = cls;
    el.textContent = msg || '';
    var btn = q('adminPubBtn');
    if(btn){
      btn.classList.remove('saved','saving');
      if(kind === 'ok' && /publish|live/i.test(msg)) btn.classList.add('saved');
      else if(/saving|publishing/i.test(msg)) btn.classList.add('saving');
    }
    clearTimeout(window.__ssStatusFadeTimer);
    if(msg && kind === 'ok' && !/typing|stable|unlock/i.test(msg)){
      window.__ssStatusFadeTimer = setTimeout(function(){
        el.classList.remove('show');
        if(btn) btn.classList.remove('saved','saving');
      }, 5000);
    }
  }
  function insideAdminWrap(el){
    return !!(el && el.closest && el.closest('#adminFormWrap'));
  }
  function isTextLike(el){
    if(!insideAdminWrap(el)) return false;
    var tag = String(el.tagName || '').toUpperCase();
    if(tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if(tag !== 'INPUT') return false;
    var type = String(el.type || 'text').toLowerCase();
    return ['text','search','url','tel','email','password','number'].indexOf(type) !== -1;
  }
  function safeVal(id, fallback){
    var el = q(id);
    var val = el ? String(el.value || '').trim() : '';
    return el ? val : (fallback || '');
  }
  function previewField(field){
    try{
      if(!field || !field.id || !window.PAGE_EDITOR_BINDINGS) return;
      var binding = window.PAGE_EDITOR_BINDINGS[field.id];
      if(!binding) return;
      var target = document.querySelector(binding.selector);
      if(!target) return;
      var value = String(field.value || '');
      if(binding.mode === 'text') target.textContent = value;
      else if(binding.mode === 'bg') target.style.backgroundImage = value ? 'url("' + value.replace(/"/g,'&quot;') + '")' : '';
      else if(binding.mode === 'src'){ target.setAttribute('src', value); if(target.tagName === 'IMG') target.style.display = ''; var phi=target.closest('.partner-item'); var phd=phi&&phi.querySelector('.partner-placeholder'); if(phd&&value) phd.style.display='none'; }
      else if(binding.mode === 'href') target.setAttribute('href', value);
    }catch(err){}
  }

  function publishAll(settingsMap){
    return window.SS.publishSettings(settingsMap).catch(function(err){
      return {ok:false, status:err.status || 0, error:err.message};
    });
  }

  function applyUnlockedState(unlocked){
    var wrap = q('adminFormWrap');
    if(wrap){
      if(unlocked) wrap.classList.add('on');
      else wrap.classList.remove('on');
    }
    document.querySelectorAll('.admin-protected-content').forEach(function(el){
      if(unlocked) el.classList.add('on');
      else el.classList.remove('on');
    });
    if(unlocked && typeof window.updateAdminSigninBanner==='function'){ try{ window.updateAdminSigninBanner(); }catch(e){} }
  }

  var dirty = false, editVersion = 0, saving = null, saveAgain = false;
  function saveStable(){
    if(saving){ saveAgain = true; return saving; }
    if(!window.adminUnlocked){
      status('Enter the admin passcode before saving.','err');
      return false;
    }
    dirty = true;
    try{ if(window.ssCaptureScroll) window.ssCaptureScroll(); }catch(e){}
    try{
      var d = DEFAULT_SITE_SETTINGS || {};
      var site = Object.assign({}, d, loadSiteSettings(), {
        brandName:safeVal('adminBrandName', d.brandName),
        tagline:safeVal('adminTagline', d.tagline),
        phone1:safeVal('adminPhone1', d.phone1),
        phone2:safeVal('adminPhone2', d.phone2),
        email:safeVal('adminEmail', d.email),
        heroEyebrow:safeVal('adminHeroEyebrow', d.heroEyebrow),
        heroTitle:safeVal('adminHeroTitle', d.heroTitle),
        heroEm:safeVal('adminHeroEm', d.heroEm),
        heroSub:safeVal('adminHeroSub', d.heroSub),
        aboutTitle:safeVal('adminAboutTitle', d.aboutTitle),
        aboutBody:safeVal('adminAboutBody', d.aboutBody),
        customerTitle:safeVal('adminCustomerTitle', d.customerTitle),
        customerSub:safeVal('adminCustomerSub', d.customerSub),
        heroImg1:safeVal('adminHeroImg1', d.heroImg1),
        heroImg2:safeVal('adminHeroImg2', d.heroImg2),
        heroImg3:safeVal('adminHeroImg3', d.heroImg3),
        aboutImage:safeVal('adminAboutImage', d.aboutImage),
        jamaicaImage:safeVal('adminJamaicaImage', d.jamaicaImage),
        jamaicaPins:safeVal('adminJamaicaPins', ''),
        jamaicaPopupMode:q('adminJamaicaPopupMode') && q('adminJamaicaPopupMode').value === 'always' ? 'always' : 'click',
        tropicalMotionIntensity:safeVal('adminTropicalMotionIntensity', '100'),
        specialKicker:safeVal('adminSpecialKicker', d.specialKicker),
        specialTitle:safeVal('adminSpecialTitle', d.specialTitle),
        specialBody:safeVal('adminSpecialBody', d.specialBody)
      });

      var peKey = window.PAGE_EDITOR_STORAGE_KEY || 'ss_page_editor_settings';
      var prevPe = {};
      try{ prevPe = JSON.parse(localStorage.getItem(peKey) || '{}'); }catch(e){}
      var pe = Object.assign({}, prevPe);
      var bindings = window.PAGE_EDITOR_BINDINGS || {};
      Object.keys(bindings).forEach(function(id){
        var el = q(id);
        var val = el ? String(el.value || '').trim() : '';
        if(el) pe[id] = val;
      });

      var gallery = null;
      if(typeof window.parseGalleryTextarea === 'function'){
        gallery = window.parseGalleryTextarea((q('adminGalleryData') || {}).value || '');
      }

      var stayKey = window.STAY_ADMIN_STORAGE_KEY || 'ss_stay_page_settings';
      var stays = null;
      if(typeof window.parseStayListingsTextarea === 'function'){
        var sd = DEFAULT_STAY_PAGE_SETTINGS || {};
        stays = {
          hubLead:safeVal('adminStaysHubLead', sd.hubLead),
          countryHeroTitle:safeVal('adminStayCountryPrefix', sd.countryHeroTitle),
          countryLeadTemplate:safeVal('adminStayCountryLeadTemplate', sd.countryLeadTemplate),
          countryDescriptions:safeVal('adminStayCountryDescriptions', ''),
          listings:window.parseStayListingsTextarea((q('adminStayListingsData') || {}).value || '')
        };
      }

      var _origSet = localStorage.setItem.__ssOriginal || localStorage.setItem.bind(localStorage);
      _origSet.call(localStorage, 'ss_site_settings', JSON.stringify(site));
      _origSet.call(localStorage, peKey, JSON.stringify(pe));
      if(gallery !== null) _origSet.call(localStorage, 'ss_customer_gallery', JSON.stringify(gallery));
      if(stays !== null) _origSet.call(localStorage, stayKey, JSON.stringify(stays));

      if(typeof window.getToursData === 'function'){
        var _td = window.getToursData();
        if(_td) _origSet.call(localStorage, 'ss_master_tours_manager_v1', JSON.stringify(_td));
      }

      siteSettings = loadSiteSettings();
      customerGalleryData = loadCustomerGallery();
      pageEditorSettings = loadPageEditorSettings();
      stayPageSettings = loadStayPageSettings();

      if(typeof window.applySiteSettings === 'function') window.applySiteSettings();
      if(typeof window.applyPageEditorSettings === 'function') window.applyPageEditorSettings();
      if(typeof window.renderStays === 'function') window.renderStays();
      if(typeof window.renderStayCountryPage === 'function') window.renderStayCountryPage();
      if(typeof window.renderAdminPackageManager === 'function') window.renderAdminPackageManager();
      if(typeof window.renderAdminBlogRequests === 'function') window.renderAdminBlogRequests();
      if(typeof window.setLiveTours === 'function' && typeof window.getToursData === 'function'){
        window.setLiveTours(window.getToursData());
      }
      if(typeof window.rerenderDynamicSections === 'function') window.rerenderDynamicSections();
      if(typeof window.refreshAdminMaster === 'function') window.refreshAdminMaster();

      try{ if(window.ssReArmScroll) window.ssReArmScroll(1600); }catch(e){}

      var serverPayload = {};
      serverPayload['ss_site_settings'] = site;
      serverPayload[peKey] = pe;
      if(gallery !== null) serverPayload['ss_customer_gallery'] = gallery;
      if(stays !== null) serverPayload[stayKey] = stays;
      try{
        var toursData = typeof window.getToursData === 'function' ? window.getToursData() : null;
        if(toursData) serverPayload['ss_master_tours_manager_v1'] = toursData;
      }catch(e){}
      try{
        var dynRaw = localStorage.getItem('ss_dynamic_sections_v1');
        if(dynRaw) serverPayload['ss_dynamic_sections_v1'] = JSON.parse(dynRaw);
      }catch(e){}

      window.SS.settingsKeys.forEach(function(key){
        if(Object.prototype.hasOwnProperty.call(serverPayload,key)) return;
        var raw=localStorage.getItem(key);
        if(raw !== null) { try { serverPayload[key]=key==='ss_ga4_id'?raw:JSON.parse(raw); } catch(e){} }
      });
      var version = editVersion;
      window.__ssSaveInFlight = true;
      status('Publishing to live website…','saving');
      saving = publishAll(serverPayload).then(function(result){
        window.__ssSaveInFlight = false;
        if(result.ok){
          if(version === editVersion) {
            dirty = false;
            var fab=q('adminFabSave'); if(fab) fab.classList.remove('show');
            status('Published, your changes are now live for everyone.','ok');
          } else status('Published. You have newer edits to save.','');
          document.dispatchEvent(new CustomEvent('ss-settings-sync-result',{detail:{key:'batch',ok:true,verified:true,pending:dirty}}));
        }else if(result.status === 401 || result.status === 403){
          status('Not published. Enter your admin passcode again, then save. Your edits are still here.','err');
          showReconnect();
          if(typeof window.updateAdminSigninBanner === 'function') window.updateAdminSigninBanner();
        }else{
          status(result.error || 'Not published. Please try again. Your edits are still here.','err');
        }
        return result;
      }).catch(function(err){ status(err.message || 'Save failed. Please try again.','err'); return {ok:false}; })
        .finally(function(){
          saving=null; window.__ssSaveInFlight=false;
          if(saveAgain){saveAgain=false; saveStable();}
        });
      return saving;
    }catch(err){
      console.error('Stable save failed', err);
      status('Save failed: ' + (err.message || 'script error'),'err');
      return false;
    }
  }

  async function unlockStable(){
    var input=q('adminPasscode');
    var pass=input ? input.value : '';
    if(!pass){status('Enter your admin passcode.','err',true);return false;}
    status('Checking your editor sign-in…','',true);
    try{
      await window.SS.passcodeLogin(pass);
      await window.SS.ensureEditorSession();
      window.adminUnlocked=true;
      sessionStorage.setItem('ss_admin_unlocked','1');
      if(input) input.value='';
      applyUnlockedState(true);
      if(!dirty) await window.SS.syncFromServer();
      updateBanner();
      status('Editor connected. Use Save & Publish to save your changes.','ok',true);
      resetIdleTimer();
      return true;
    }catch(err){
      status(err.message || 'Sign-in failed. Please try again.','err',true);
      return false;
    }
  }

  function showReconnect(){
    var input=q('adminPasscode');
    var lock=input && input.closest('.admin-lock-row');
    if(lock) lock.style.display='';
    updateBanner();
  }
  function updateBanner(){
    var wrap=q('adminFormWrap'); if(!wrap) return;
    var banner=q('adminSigninBanner');
    if(!banner){banner=document.createElement('div');banner.id='adminSigninBanner';wrap.prepend(banner);}
    banner.className='admin-signin-banner';
    banner.textContent='Use Save & Publish to store changes on the live website.';
    var button=document.createElement('button');button.type='button';button.className='admin-signin-btn';button.textContent='Reconnect editor';
    button.onclick=function(){var input=q('adminPasscode');if(input){input.scrollIntoView({block:'center'});input.focus();}};
    banner.appendChild(button);
  }

  function resetStable(){
    try{
      localStorage.removeItem('ss_site_settings');
      localStorage.removeItem(window.PAGE_EDITOR_STORAGE_KEY || 'ss_page_editor_settings');
      localStorage.removeItem('ss_customer_gallery');
      localStorage.removeItem(window.STAY_ADMIN_STORAGE_KEY || 'ss_stay_page_settings');
      if(window.TOURS_KEY) localStorage.removeItem(window.TOURS_KEY);
      try{ sessionStorage.removeItem('ss_admin_unlocked'); }catch(e){}
      window.adminUnlocked = false;
      applyUnlockedState(false);
      location.reload();
    }catch(err){
      console.error('Stable reset failed', err);
      status('Reset failed: ' + (err.message || 'script error'),'err');
    }
  }

  function markDirty(e){
    if(!window.adminUnlocked || (e && !insideAdminWrap(e.target))) return;
    dirty=true; editVersion++;
    var fab=q('adminFabSave');if(fab) fab.classList.add('show');
    if(!saving) status('Unsaved changes. Use Save & Publish.','');
  }

  function repairButtonsAndState(){
    window.unlockAdminPortal=unlockStable;
    window.saveAdminPortal=saveStable;
    window.resetAdminPortal=resetStable;
    applyUnlockedState(!!window.adminUnlocked);
  }

  var IDLE_TIMEOUT = 5 * 60 * 1000;
  var idleTimer = null;
  function resetIdleTimer(){
    clearTimeout(idleTimer);
    if(!window.adminUnlocked) return;
    idleTimer = setTimeout(lockFromIdle, IDLE_TIMEOUT);
  }
  function lockFromIdle(){
    if(!window.adminUnlocked) return;
    if(window.__ssSaveInFlight){
      idleTimer = setTimeout(lockFromIdle, 10000);
      return;
    }
    window.adminUnlocked = false;
    try{ sessionStorage.removeItem('ss_admin_unlocked'); }catch(e){}
    applyUnlockedState(false);
    status('Session locked due to inactivity. Enter the passcode to continue.','err',true);
  }
  function startIdleWatch(){
    ['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(function(evt){
      document.addEventListener(evt, resetIdleTimer, {passive:true,capture:true});
    });
    resetIdleTimer();
  }

  window.SSAdmin={saveAdminPortal:saveStable,unlockAdminPortal:unlockStable,resetAdminPortal:resetStable,updateBanner:updateBanner,isDirty:function(){return dirty;}};
  ready(function(){
    repairButtonsAndState();
    document.addEventListener('input',markDirty,true);
    document.addEventListener('change',markDirty,true);
    document.addEventListener('ss-settings-synced',function(){
      if(!dirty && typeof window.populateAdminForms==='function') window.populateAdminForms();
    });
    window.addEventListener('beforeunload',function(e){if(dirty || saving){e.preventDefault();e.returnValue='';}});
    if(sessionStorage.getItem('ss_admin_unlocked')==='1'){
      window.SS.ensureEditorSession().then(function(){window.adminUnlocked=true;applyUnlockedState(true);resetIdleTimer();})
        .catch(function(){sessionStorage.removeItem('ss_admin_unlocked');window.adminUnlocked=false;applyUnlockedState(false);});
    }
    startIdleWatch();
  });
})();
