/**
 * Sight Seers Caribbean Adventures – Backend Bridge
 * Connects the frontend to the full backend API with auth, content management,
 * image uploads, section editing, and data sync.
 */
(function () {
  'use strict';

  var TOKEN_KEY = 'ss_auth_token';
  var USER_KEY = 'ss_current_user';

  var SS_SYNC_KEYS = [
    'ss_site_settings',
    'ss_page_editor_settings',
    'ss_customer_gallery',
    'ss_stay_page_settings',
    'ss_master_tours_manager_v1',
    'ss_dynamic_sections_v1',
    'ss_blog_requests_v1'
  ];

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function setToken(token) {
    try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  function authHeaders() {
    var token = getToken();
    var h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  function api(path, method, body) {
    var opts = { method: method || 'GET', headers: authHeaders() };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    return fetch('/api/' + path, opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: r.status, data: data });
        return data;
      });
    });
  }

  /* ── Auth ─────────────────────────── */

  function signup(data) {
    return api('auth', 'POST', Object.assign({ action: 'signup' }, data)).then(function (res) {
      setToken(res.token);
      try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: res.user } }));
      return res;
    });
  }

  function signin(email, password) {
    return api('auth', 'POST', { action: 'signin', email: email, password: password }).then(function (res) {
      setToken(res.token);
      try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: res.user } }));
      return res;
    });
  }

  // Exchange the admin passcode for a real server token so the passcode alone
  // is enough to publish edits/uploads to the live site (no separate account needed).
  function passcodeLogin(passcode) {
    return api('auth', 'POST', { action: 'passcode', passcode: passcode }).then(function (res) {
      setToken(res.token);
      try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: res.user } }));
      return res;
    });
  }

  function signout() {
    setToken(null);
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: null } }));
  }

  function me() {
    return api('auth', 'POST', { action: 'me' });
  }

  function updateProfile(data) {
    return api('auth', 'POST', Object.assign({ action: 'update' }, data)).then(function (res) {
      try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: res.user } }));
      return res;
    });
  }

  function updatePassword(currentPassword, newPassword) {
    return api('auth', 'POST', { action: 'update-password', currentPassword: currentPassword, newPassword: newPassword });
  }

  function isSignedIn() {
    return !!getToken();
  }

  function currentUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
  }

  function isAdmin() {
    var u = currentUser();
    return u && u.role === 'admin';
  }

  /* ── Accounts (admin) ────────────── */

  function listAccounts() { return api('auth', 'GET'); }
  function createAccount(data) { return api('auth', 'POST', Object.assign({ action: 'admin-create' }, data)); }
  function updateAccount(data) { return api('auth', 'POST', Object.assign({ action: 'admin-update' }, data)); }
  function deleteAccount(id) { return api('auth', 'POST', { action: 'admin-delete', id: id }); }
  function resetAccountPassword(id, newPassword) { return api('auth', 'POST', { action: 'admin-reset-password', id: id, newPassword: newPassword }); }

  /* ── Sections ─────────────────────── */

  function getSections() { return api('sections', 'GET'); }
  function createSection(data) { return api('sections', 'POST', Object.assign({ action: 'create' }, data)); }
  function updateSection(data) { return api('sections', 'POST', Object.assign({ action: 'update' }, data)); }
  function deleteSection(id) { return api('sections', 'POST', { action: 'delete', id: id }); }
  function reorderSections(orders) { return api('sections', 'POST', { action: 'reorder', orders: orders }); }
  function duplicateSection(id) { return api('sections', 'POST', { action: 'duplicate', id: id }); }

  /* ── Content ──────────────────────── */

  function getContent(page) { return api('content' + (page ? '?page=' + encodeURIComponent(page) : ''), 'GET'); }
  function updateContent(selector, value, type) { return api('content', 'POST', { action: 'update', selector: selector, value: value, type: type }); }
  function bulkUpdateContent(changes) { return api('content', 'POST', { action: 'bulk-update', changes: changes }); }
  function updateFont(data) { return api('content', 'POST', Object.assign({ action: 'update-font' }, data)); }
  function bulkUpdateFonts(changes) { return api('content', 'POST', { action: 'bulk-update-fonts', changes: changes }); }
  function resetPageContent(page) { return api('content', 'POST', { action: 'reset-page', page: page }); }

  /* ── Images ───────────────────────── */

  function listImages() { return api('images', 'GET'); }

  /* Downscale/recompress images client-side so uploads stay well under
     Vercel's 4.5MB request-body limit (phone photos are often 4-8MB). */
  function compressImage(file, maxDim, quality) {
    maxDim = maxDim || 1920; quality = quality || 0.85;
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return resolve(file);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        try {
          var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            URL.revokeObjectURL(url);
            if (blob && blob.size < file.size) {
              blob.name = (file.name || 'image').replace(/\.[^.]+$/, '') + '.jpg';
              resolve(blob);
            } else resolve(file);
          }, 'image/jpeg', quality);
        } catch (e) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function uploadImage(file, folder) {
    return compressImage(file).then(function (upload) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result.split(',')[1];
          if (base64.length > 4 * 1024 * 1024) {
            return reject(new Error('Image is too large even after compression (max ~3MB). Please crop or resize it.'));
          }
          api('images', 'POST', {
            filename: upload.name || file.name,
            data: base64,
            type: upload.type || file.type,
            folder: folder || 'site-images'
          }).then(resolve).catch(function (err) {
            if (err && (err.status === 413 || /too large|payload/i.test(err.message))) {
              err.message = 'Image too large for upload — please use a photo under 3MB.';
            }
            reject(err);
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(upload);
      });
    });
  }

  // Upload with a real progress callback (bytes actually sent to the server).
  // onProgress receives an integer 0-100. Phases: 0-15 compressing/encoding,
  // 15-99 network upload, 100 done.
  function uploadImageWithProgress(file, folder, onProgress) {
    var report = function (p) { try { onProgress && onProgress(Math.max(0, Math.min(100, Math.round(p)))); } catch (e) {} };
    report(2);
    return compressImage(file).then(function (upload) {
      report(8);
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          var base64 = reader.result.split(',')[1];
          if (base64.length > 4 * 1024 * 1024) {
            return reject(new Error('Image is too large even after compression (max ~3MB). Please crop or resize it.'));
          }
          report(15);
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/images', true);
          var h = authHeaders();
          Object.keys(h).forEach(function (k) { xhr.setRequestHeader(k, h[k]); });
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) report(15 + (e.loaded / e.total) * 84);
          };
          xhr.onload = function () {
            var data = {};
            try { data = JSON.parse(xhr.responseText); } catch (e) {}
            if (xhr.status >= 200 && xhr.status < 300 && (data.url)) {
              report(100);
              resolve(data);
            } else {
              var msg = (data && data.error) || ('Upload failed (' + xhr.status + ')');
              if (xhr.status === 413) msg = 'Image too large for upload — please use a photo under 3MB.';
              reject(Object.assign(new Error(msg), { status: xhr.status }));
            }
          };
          xhr.onerror = function () { reject(new Error('Network error during upload')); };
          xhr.send(JSON.stringify({
            filename: upload.name || file.name,
            data: base64,
            type: upload.type || file.type,
            folder: folder || 'site-images'
          }));
        };
        reader.onerror = reject;
        reader.readAsDataURL(upload);
      });
    });
  }

  function deleteImage(url) { return api('images', 'POST', { action: 'delete', url: url }); }

  /* ── Pages ────────────────────────── */

  function getPages() { return api('content?type=pages', 'GET'); }
  function getPage(id) { return api('content?type=pages&page=' + encodeURIComponent(id), 'GET'); }
  function updatePage(data) { return api('content', 'POST', Object.assign({ action: 'update-page' }, data)); }
  function updatePageSeo(data) { return api('content', 'POST', Object.assign({ action: 'update-seo' }, data)); }

  /* ── Tours ────────────────────────── */

  function getTours() { return api('tours', 'GET'); }
  function getTour(id) { return api('tours?id=' + encodeURIComponent(id), 'GET'); }
  function createTour(data) { return api('tours', 'POST', Object.assign({ action: 'create' }, data)); }
  function updateTour(data) { return api('tours', 'POST', Object.assign({ action: 'update' }, data)); }
  function deleteTour(id) { return api('tours', 'POST', { action: 'delete', id: id }); }

  /* ── Stays ────────────────────────── */

  function getStays(country) { return api('stays' + (country ? '?country=' + encodeURIComponent(country) : ''), 'GET'); }
  function getStay(id) { return api('stays?id=' + encodeURIComponent(id), 'GET'); }
  function createStay(data) { return api('stays', 'POST', Object.assign({ action: 'create' }, data)); }
  function updateStay(data) { return api('stays', 'POST', Object.assign({ action: 'update' }, data)); }
  function deleteStay(id) { return api('stays', 'POST', { action: 'delete', id: id }); }

  /* ── Bookings ─────────────────────── */

  function getBookings() { return api('bookings', 'GET'); }
  function createBooking(data) { return api('bookings', 'POST', Object.assign({ action: 'create' }, data)); }
  function updateBookingStatus(id, status, adminNote) { return api('bookings', 'POST', { action: 'update-status', id: id, status: status, adminNote: adminNote }); }
  function deleteBooking(id) { return api('bookings', 'POST', { action: 'delete', id: id }); }

  /* ── Gallery ──────────────────────── */

  function getGallery() { return api('gallery', 'GET'); }
  function addGalleryEntry(data) { return api('gallery', 'POST', Object.assign({ action: 'create' }, data)); }
  function updateGalleryEntry(data) { return api('gallery', 'POST', Object.assign({ action: 'update' }, data)); }
  function deleteGalleryEntry(id) { return api('gallery', 'POST', { action: 'delete', id: id }); }
  function reorderGallery(orders) { return api('gallery', 'POST', { action: 'reorder', orders: orders }); }

  /* ── Blog ──────────────────────────── */

  function getBlogPosts() { return api('blog', 'GET'); }
  function getBlogPost(id) { return api('blog?id=' + encodeURIComponent(id), 'GET'); }
  function createBlogPost(data) { return api('blog', 'POST', Object.assign({ action: 'create' }, data)); }
  function updateBlogPost(data) { return api('blog', 'POST', Object.assign({ action: 'update' }, data)); }
  function deleteBlogPost(id) { return api('blog', 'POST', { action: 'delete', id: id }); }
  function submitBlogRequest(data) { return api('blog', 'POST', Object.assign({ action: 'submit-request' }, data)); }
  function getBlogRequests() { return api('blog?type=requests', 'GET'); }
  function reviewBlogRequest(data) { return api('blog', 'POST', Object.assign({ action: 'review-request' }, data)); }

  /* ── Contact ──────────────────────── */

  function sendContactMessage(data) { return api('contact', 'POST', Object.assign({ action: 'send' }, data)); }
  function getContactMessages() { return api('contact', 'GET'); }
  function markContactRead(id) { return api('contact', 'POST', { action: 'mark-read', id: id }); }
  function deleteContactMessage(id) { return api('contact', 'POST', { action: 'delete', id: id }); }

  /* ── V-Tours Waitlist ─────────────── */

  function submitWaitlist(data) { return api('waitlist', 'POST', Object.assign({ action: 'join' }, data)); }
  function getWaitlist() { return api('waitlist', 'GET'); }
  function markWaitlistRead(id, status) { return api('waitlist', 'POST', { action: 'mark-read', id: id, status: status }); }
  function deleteWaitlistEntry(id) { return api('waitlist', 'POST', { action: 'delete', id: id }); }

  /* ── Settings sync (legacy compat) ── */

  function syncSettings(key, value) {
    return api('settings', 'POST', { key: key, value: value });
  }

  function syncFromServer() {
    fetch('/api/settings', { cache: 'no-store', headers: authHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var origSet = (localStorage.setItem.__ssOriginal) || localStorage.setItem.bind(localStorage);
        SS_SYNC_KEYS.forEach(function (key) {
          if (data[key]) {
            var incoming = data[key];
            if ((key === 'ss_page_editor_settings' || key === 'ss_site_settings') && typeof incoming === 'object' && !Array.isArray(incoming)) {
              var existing = {};
              try { existing = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
              Object.keys(incoming).forEach(function(k) {
                if (incoming[k] !== undefined && incoming[k] !== null && incoming[k] !== '') existing[k] = incoming[k];
              });
              try { origSet.call(localStorage, key, JSON.stringify(existing)); } catch (e) {}
            } else {
              try { origSet.call(localStorage, key, JSON.stringify(incoming)); } catch (e) {}
            }
          }
        });
        document.dispatchEvent(new CustomEvent('ss-settings-synced', { detail: data }));
      })
      .catch(function () {});
  }

  function patchLocalStorage() {
    var original = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      original(key, value);
      if (key.startsWith('ss_') && SS_SYNC_KEYS.indexOf(key) !== -1) {
        var parsed;
        try { parsed = JSON.parse(value); } catch (e) { return; }
        fetch('/api/settings', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ key: key, value: parsed })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            document.dispatchEvent(new CustomEvent('ss-settings-sync-result', {
              detail: { key: key, ok: r.ok, status: r.status, error: d && d.error }
            }));
          });
        }).catch(function () {
          document.dispatchEvent(new CustomEvent('ss-settings-sync-result', {
            detail: { key: key, ok: false, status: 0, error: 'network' }
          }));
        });
      }
    };
    localStorage.setItem.__ssOriginal = original;
  }

  /* ── Token refresh check ──────────── */

  function checkAuth() {
    var token = getToken();
    if (!token) return;
    me().then(function (res) {
      if (res.user) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)); } catch (e) {}
        document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: res.user } }));
      }
    }).catch(function () {
      var stored = null;
      try { stored = JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) {}
      if (stored && stored.role === 'editor') return;
      setToken(null);
      try { localStorage.removeItem(USER_KEY); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ss-account-updated', { detail: { user: null } }));
    });
  }

  /* ── Init ──────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    syncFromServer();
    patchLocalStorage();
    checkAuth();
  });

  /* ── Public API ────────────────────── */

  window.SS = {
    api: api,
    compressImage: compressImage,

    signup: signup,
    signin: signin,
    passcodeLogin: passcodeLogin,
    signout: signout,
    me: me,
    updateProfile: updateProfile,
    updatePassword: updatePassword,
    isSignedIn: isSignedIn,
    currentUser: currentUser,
    isAdmin: isAdmin,
    getToken: getToken,

    listAccounts: listAccounts,
    createAccount: createAccount,
    updateAccount: updateAccount,
    deleteAccount: deleteAccount,
    resetAccountPassword: resetAccountPassword,

    getSections: getSections,
    createSection: createSection,
    updateSection: updateSection,
    deleteSection: deleteSection,
    reorderSections: reorderSections,
    duplicateSection: duplicateSection,

    getContent: getContent,
    updateContent: updateContent,
    bulkUpdateContent: bulkUpdateContent,
    updateFont: updateFont,
    bulkUpdateFonts: bulkUpdateFonts,
    resetPageContent: resetPageContent,

    listImages: listImages,
    uploadImage: uploadImage,
    uploadImageWithProgress: uploadImageWithProgress,
    deleteImage: deleteImage,

    getPages: getPages,
    getPage: getPage,
    updatePage: updatePage,
    updatePageSeo: updatePageSeo,

    getTours: getTours,
    getTour: getTour,
    createTour: createTour,
    updateTour: updateTour,
    deleteTour: deleteTour,

    getStays: getStays,
    getStay: getStay,
    createStay: createStay,
    updateStay: updateStay,
    deleteStay: deleteStay,

    getBookings: getBookings,
    createBooking: createBooking,
    updateBookingStatus: updateBookingStatus,
    deleteBooking: deleteBooking,

    getGallery: getGallery,
    addGalleryEntry: addGalleryEntry,
    updateGalleryEntry: updateGalleryEntry,
    deleteGalleryEntry: deleteGalleryEntry,
    reorderGallery: reorderGallery,

    getBlogPosts: getBlogPosts,
    getBlogPost: getBlogPost,
    createBlogPost: createBlogPost,
    updateBlogPost: updateBlogPost,
    deleteBlogPost: deleteBlogPost,
    submitBlogRequest: submitBlogRequest,
    getBlogRequests: getBlogRequests,
    reviewBlogRequest: reviewBlogRequest,

    sendContactMessage: sendContactMessage,
    getContactMessages: getContactMessages,
    markContactRead: markContactRead,
    deleteContactMessage: deleteContactMessage,

    submitWaitlist: submitWaitlist,
    getWaitlist: getWaitlist,
    markWaitlistRead: markWaitlistRead,
    deleteWaitlistEntry: deleteWaitlistEntry,

    syncSettings: syncSettings,
    syncFromServer: syncFromServer
  };

})();
