/* ===================================================================
   INFILL project page — navbar, turntable gallery, 360 lightbox viewer
   Reads window.TURNTABLE_DATA (static/js/assets-manifest.js).
   Designed to work over file:// as well as http(s).
   =================================================================== */
(function () {
  'use strict';

  /* ---------- navbar burger (mobile) ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var burger = document.querySelector('.navbar-burger');
    if (burger) {
      burger.addEventListener('click', function () {
        var target = document.getElementById(burger.dataset.target);
        burger.classList.toggle('is-active');
        if (target) target.classList.toggle('is-active');
      });
    }
    document.querySelectorAll('[data-todo]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        a.classList.add('is-loading');
        setTimeout(function () { a.classList.remove('is-loading'); }, 350);
      });
    });
    initGallery();
  });

  /* ---------- helpers ---------- */
  function pad3(n) { return String(n).padStart(3, '0'); }
  // dir may contain spaces ("Auto Repair Garage"); encodeURI keeps '/'.
  // ext is per-asset (png for the local dev render, webp for the deployed build).
  function frameURL(a, i) { return encodeURI(a.dir + '/frames/frame_' + pad3(i) + '.' + (a.ext || 'png')); }

  /* ---------- gallery ---------- */
  var DATA = window.TURNTABLE_DATA || { domains: [], totals: {} };
  var ALL = [];            // flat list of {label, name, dir, nframes, domain}
  DATA.domains.forEach(function (d) {
    d.assets.forEach(function (a) { ALL.push(Object.assign({ domain: d.name }, a)); });
  });

  var grid, countEl;
  var thumbObserver = null;
  var activeDomain = '__all__';
  var renderState = null;          // {items, shown}
  var ASSET_LIMIT = 20;            // assets shown before the "show more" button
  var DOMAIN_LIMIT = 12;           // domain filter pills shown before "show more"

  function initGallery() {
    grid = document.getElementById('gallery-grid');
    countEl = document.getElementById('gallery-count');
    var filters = document.getElementById('domain-filters');
    if (!grid) return;

    if (!ALL.length) {
      var empty = document.getElementById('gallery-empty');
      if (empty) empty.style.display = 'block';
      return;
    }

    // lazy-load thumbnails as cards scroll into view
    if ('IntersectionObserver' in window) {
      thumbObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var img = en.target;
            if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
            obs.unobserve(img);
          }
        });
      }, { rootMargin: '300px' });
    }

    // domain filter pills (collapsed past DOMAIN_LIMIT)
    var btnAll = mkFilter('All (' + ALL.length + ')', '__all__');
    btnAll.classList.add('active');
    filters.appendChild(btnAll);
    DATA.domains.forEach(function (d, i) {
      var b = mkFilter(d.name + ' (' + d.assets.length + ')', d.name);
      if (i >= DOMAIN_LIMIT) { b.classList.add('domain-extra'); b.style.display = 'none'; }
      filters.appendChild(b);
    });
    var nExtra = DATA.domains.length - DOMAIN_LIMIT;
    if (nExtra > 0) {
      var moreDom = document.createElement('button');
      moreDom.className = 'more-domains';
      moreDom.textContent = '+ ' + nExtra + ' more domains';
      moreDom.addEventListener('click', function () {
        var hidden = filters.querySelectorAll('.domain-extra');
        var expand = hidden.length && hidden[0].style.display === 'none';
        Array.prototype.forEach.call(hidden, function (x) { x.style.display = expand ? '' : 'none'; });
        moreDom.textContent = expand ? '− fewer domains' : '+ ' + nExtra + ' more domains';
      });
      filters.appendChild(moreDom);
    }

    render('__all__');
    initViewerModal();
  }

  function mkFilter(text, domain) {
    var b = document.createElement('button');
    b.textContent = text;
    b.addEventListener('click', function () {
      document.querySelectorAll('#domain-filters button').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      render(domain);
    });
    return b;
  }

  function render(domain) {
    activeDomain = domain;
    var items = (domain === '__all__') ? ALL : ALL.filter(function (a) { return a.domain === domain; });
    grid.innerHTML = '';
    renderState = { items: items, shown: 0 };
    appendBatch(ASSET_LIMIT);
    updateCount(domain, items);
  }

  function appendBatch(n) {
    var s = renderState;
    var end = Math.min(s.shown + n, s.items.length);
    for (var i = s.shown; i < end; i++) grid.appendChild(card(s.items[i]));
    s.shown = end;
    updateMoreBtn();
  }

  function updateMoreBtn() {
    var box = document.getElementById('gallery-more');
    if (!box) return;
    box.innerHTML = '';
    var remaining = renderState.items.length - renderState.shown;
    if (remaining <= 0) return;
    var b = document.createElement('button');
    b.className = 'show-more-btn';
    b.textContent = 'Show ' + remaining + ' more';
    b.addEventListener('click', function () { appendBatch(remaining); });
    box.appendChild(b);
  }

  function updateCount(domain, items) {
    if (!countEl) return;
    var t = DATA.totals || {};
    countEl.textContent = (domain === '__all__')
      ? (items.length + ' assets across ' + (t.domains || DATA.domains.length) + ' domains'
         + (t.frames ? ' · ' + t.frames + ' rendered frames' : ''))
      : (items.length + ' assets in ' + domain);
  }

  function card(a) {
    var el = document.createElement('div');
    el.className = 'asset-card';

    var thumb = document.createElement('div');
    thumb.className = 'asset-thumb';
    var img = document.createElement('img');
    img.alt = a.label;
    img.loading = 'lazy';
    var src = frameURL(a, 0);
    if (thumbObserver) { img.dataset.src = src; thumbObserver.observe(img); }
    else { img.src = src; }
    thumb.appendChild(img);
    var badge = document.createElement('span');
    badge.className = 'spin-badge';
    badge.textContent = '↻ spin';
    thumb.appendChild(badge);

    var meta = document.createElement('div');
    meta.className = 'asset-meta';
    meta.innerHTML = '<div class="asset-name">' + esc(a.label) + '</div>' +
                     '<div class="asset-dom">' + esc(a.domain) + '</div>';

    el.appendChild(thumb);
    el.appendChild(meta);
    el.addEventListener('click', function () { openViewer(a); });
    return el;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ===================================================================
     360 lightbox viewer  (drag-to-spin, momentum, auto-spin)
     =================================================================== */
  var modal, stage, canvas, ctx, loader, barfill, hint, spinBtn, titleEl, domEl;
  var V = null; // active viewer state

  function initViewerModal() {
    modal   = document.getElementById('viewer-modal');
    stage   = document.getElementById('stage');
    canvas  = document.getElementById('canvas');
    ctx     = canvas.getContext('2d');
    loader  = document.getElementById('loader');
    barfill = document.getElementById('barfill');
    hint    = document.getElementById('hint');
    spinBtn = document.getElementById('spinBtn');
    titleEl = document.getElementById('viewer-title');
    domEl   = document.getElementById('viewer-domain');

    function close() { closeViewer(); }
    modal.querySelector('.modal-background').addEventListener('click', close);
    modal.querySelector('.modal-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-active')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft')  { if (V) { setSpin(false); V.index -= 1; draw(); } }
      else if (e.key === 'ArrowRight') { if (V) { setSpin(false); V.index += 1; draw(); } }
    });

    // interaction
    function down(x) { if (!V) return; V.dragging = true; V.lastX = x; V.velocity = 0; setSpin(false);
                       stage.classList.add('grabbing'); hint.classList.add('hidden'); }
    function move(x) { if (!V || !V.dragging) return;
                       var dx = x - V.lastX; V.lastX = x;
                       var step = V.dir * dx / V.pxPerFrame;
                       V.index += step; V.velocity = step; draw(); }
    function up()   { if (V) V.dragging = false; stage.classList.remove('grabbing'); }

    stage.addEventListener('mousedown', function (e) { e.preventDefault(); down(e.clientX); });
    window.addEventListener('mousemove', function (e) { move(e.clientX); });
    window.addEventListener('mouseup', up);
    stage.addEventListener('touchstart', function (e) { down(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener('touchmove',  function (e) { move(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener('touchend', up);

    spinBtn.onclick = function () { setSpin(!(V && V.autospin)); };
    document.getElementById('prevBtn').onclick = function () { if (V) { setSpin(false); V.index -= 1; draw(); } };
    document.getElementById('nextBtn').onclick = function () { if (V) { setSpin(false); V.index += 1; draw(); } };
    window.addEventListener('resize', fit);

    requestAnimationFrame(tick);
  }

  function openViewer(a) {
    titleEl.textContent = a.label;
    domEl.textContent = a.domain;
    modal.classList.add('is-active');
    hint.classList.remove('hidden');
    loader.style.display = 'flex';
    barfill.style.width = '0%';

    var N = a.nframes;
    V = {
      asset: a, N: N, images: new Array(N), loaded: 0,
      index: 0, dragging: false, lastX: 0, velocity: 0, autospin: false,
      pxPerFrame: 8.0, friction: 0.9, dir: 1, autospinSpeed: 0.25, token: {}
    };
    setSpin(false);

    var myToken = V.token;
    for (var i = 0; i < N; i++) {
      (function (i) {
        var im = new Image();
        im.onload = im.onerror = function () {
          if (!V || V.token !== myToken) return; // viewer changed/closed
          V.images[i] = im.naturalWidth ? im : null;
          if (++V.loaded === N) { loader.style.display = 'none'; fit(); }
          else barfill.style.width = (100 * V.loaded / N) + '%';
        };
        im.src = frameURL(a, i);
      })(i);
    }
    fit();
  }

  function closeViewer() {
    modal.classList.remove('is-active');
    if (V) V.token = {}; // invalidate in-flight image callbacks
    V = null;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function setSpin(on) { if (V) V.autospin = on; if (spinBtn) spinBtn.classList.toggle('active', !!on); }

  function fit() {
    if (!stage) return;
    var r = Math.min(stage.clientWidth, stage.clientHeight) || 480;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = r * dpr; canvas.height = r * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    if (!V) return;
    var i = ((Math.round(V.index) % V.N) + V.N) % V.N;
    var img = V.images[i];
    var w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (!img) return;
    var s = Math.min(w / img.width, h / img.height);
    var dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function tick() {
    if (V && !V.dragging) {
      if (V.autospin) { V.index += V.dir * V.autospinSpeed; draw(); }
      else if (Math.abs(V.velocity) > 0.001) { V.index += V.velocity; V.velocity *= V.friction; draw(); }
    }
    requestAnimationFrame(tick);
  }
})();
