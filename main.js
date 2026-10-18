/* HARO Activewear — main.js (IIFE, sin módulos, sin dependencias) */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var isDesktop = function () { return window.matchMedia('(min-width: 761px)').matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var euro = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn('[HARO] ' + name + ' falló:', e); }
  }

  /* ---------- Splash ---------- */
  function initSplash() {
    var s = $('#splash');
    if (!s) return;
    var hide = function () { s.classList.add('is-done'); };
    setTimeout(hide, 2200);
    setTimeout(function () { s.style.display = 'none'; }, 3600);
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2800);
  }

  /* ---------- Cursor ---------- */
  function initCursor() {
    var c = $('#cursor');
    if (!c || !finePointer) return;
    var label = $('.cursor__label', c);
    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; c.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('mouseleave', function () { c.classList.add('is-hidden'); });
    document.addEventListener('mouseover', function (e) {
      var v = e.target.closest('[data-cursor]');
      var l = e.target.closest('a, button, input');
      c.classList.toggle('is-view', !!v && !e.target.closest('.card__sizes'));
      c.classList.toggle('is-link', !v && !!l);
      if (v) label.textContent = v.getAttribute('data-cursor');
    });
    (function loop() {
      x = lerp(x, tx, 0.2); y = lerp(y, ty, 0.2);
      c.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = $('#nav');
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      var hide = y > last && y > 600 && !document.body.classList.contains('menu-open');
      nav.classList.toggle('is-hidden', hide);
      last = y;
    }, { passive: true });

    var burger = $('#burger');
    var setMenu = function (open) {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      $('#menu').setAttribute('aria-hidden', !open);
    };
    burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Hero parallax (scroll + ratón) ---------- */
  function initHero() {
    var figs = $$('.hero__img');
    var stage = $('#heroStage');
    if (!figs.length) return;
    var mx = 0, my = 0, cx = 0, cy = 0;
    if (finePointer) {
      window.addEventListener('mousemove', function (e) {
        mx = (e.clientX / innerWidth - 0.5);
        my = (e.clientY / innerHeight - 0.5);
      }, { passive: true });
    }
    (function loop() {
      cx = lerp(cx, mx, 0.06); cy = lerp(cy, my, 0.06);
      var sy = window.scrollY;
      if (sy < innerHeight * 1.4) {
        figs.forEach(function (f) {
          var d = parseFloat(f.getAttribute('data-depth')) || 0.5;
          var tx = cx * 40 * d;
          var ty = cy * 30 * d - sy * 0.18 * d;
          f.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) rotateY(' + (cx * 6 * d).toFixed(2) + 'deg)';
        });
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Banda: marquee con velocidad de scroll ---------- */
  function initBand() {
    var track = $('.band__track');
    if (!track) return;
    var pos = 0, lastY = window.scrollY, boost = 0, dir = 1;
    (function loop() {
      var y = window.scrollY;
      var dy = y - lastY; lastY = y;
      if (dy !== 0) dir = dy > 0 ? 1 : -1;
      boost = lerp(boost, Math.abs(dy) * 0.6, 0.1);
      pos -= (0.7 + boost) * dir;
      var w = track.scrollWidth / 2;
      if (pos <= -w) pos += w;
      if (pos > 0) pos -= w;
      track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Manifiesto: palabras que se encienden con el scroll ---------- */
  function initWords() {
    var el = $('[data-words]');
    if (!el || el.querySelector('.w')) return;
    var wrap = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { wrap(n); }
      });
    };
    wrap(el);
    var words = $$('.w', el);
    var update = function () {
      var r = el.getBoundingClientRect();
      var p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    setTimeout(function () { if (!words.some(function (w) { return w.classList.contains('on'); })) update(); }, 6000);
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
    // red de seguridad
    setTimeout(function () {
      els.forEach(function (e) {
        if (!e.classList.contains('is-in') && e.getBoundingClientRect().top < innerHeight) e.classList.add('is-in');
      });
    }, 6000);
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!('IntersectionObserver' in window)) { nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        if (to === 0) { el.textContent = '0'; return; }
        (function step(t) {
          if (!t0) t0 = t;
          var p = clamp((t - t0) / 1400, 0, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.01 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Filtros ---------- */
  function initFilters() {
    var chips = $$('.chip');
    var cards = $$('.card');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        cards.forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-color') === f;
          card.classList.toggle('is-filtered', !show);
          if (show) {
            card.classList.add('is-in');
            card.animate && card.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.19,1,.22,1)' });
          }
        });
      });
    });
  }

  /* ---------- Bolsa ---------- */
  var KEY = 'haro_bag_v1';
  var bag = [];
  function loadBag() { try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; } }
  function saveBag() { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} }

  function renderBag() {
    var list = $('#bagItems');
    var count = bag.reduce(function (s, i) { return s + i.qty; }, 0);
    var total = bag.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    $('#bagCount').textContent = count;
    $('#bagCount2').textContent = '(' + count + ')';
    $('#bagTotal').textContent = euro(total);
    $('#bag').classList.toggle('is-empty', bag.length === 0);

    var left = Math.max(0, 60 - total);
    $('#shipText').innerHTML = left > 0
      ? 'Te faltan <strong>' + euro(left) + '</strong> para el envío gratis'
      : '<strong>¡Tienes envío gratis!</strong> 🤎';
    $('#shipBar').style.width = Math.min(100, total / 60 * 100) + '%';

    list.innerHTML = '';
    bag.forEach(function (it, idx) {
      var li = document.createElement('li');
      li.className = 'bag__item';
      li.innerHTML =
        '<img src="' + it.img + '" alt="">' +
        '<div><h4></h4><p></p>' +
        '<div class="bag__qty"><button data-q="-1" aria-label="Quitar uno">−</button><span>' + it.qty + '</span><button data-q="1" aria-label="Añadir uno">+</button></div></div>' +
        '<div><div class="bag__price">' + euro(it.price * it.qty) + '</div><button class="bag__remove">Eliminar</button></div>';
      $('h4', li).textContent = it.name;
      $('p', li).textContent = it.tone + ' · Talla ' + it.size;
      $$('[data-q]', li).forEach(function (b) {
        b.addEventListener('click', function () {
          it.qty += parseInt(b.getAttribute('data-q'), 10);
          if (it.qty <= 0) bag.splice(idx, 1);
          saveBag(); renderBag();
        });
      });
      $('.bag__remove', li).addEventListener('click', function () { bag.splice(idx, 1); saveBag(); renderBag(); });
      list.appendChild(li);
    });
  }

  function setBag(open) {
    document.body.classList.toggle('bag-open', open);
    $('#bag').setAttribute('aria-hidden', !open);
  }

  function initBag() {
    loadBag();
    renderBag();
    $('#bagBtn').addEventListener('click', function () { setBag(true); });
    $('#bagClose').addEventListener('click', function () { setBag(false); });
    $('#scrim').addEventListener('click', function () { setBag(false); });
    $$('[data-close-bag]').forEach(function (a) { a.addEventListener('click', function () { setBag(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setBag(false); closeModal(); } });
    $('#checkout').addEventListener('click', function () {
      toast('Prototipo: aquí se conecta la pasarela de pago (Shopify, WooCommerce o Stripe).');
    });

    $$('.card').forEach(function (card) {
      $$('.card__sizes button', card).forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = card.getAttribute('data-id'), size = b.textContent;
          var found = bag.filter(function (i) { return i.id === id && i.size === size; })[0];
          if (found) found.qty++;
          else bag.push({
            id: id, size: size, qty: 1,
            name: card.getAttribute('data-name'),
            tone: card.getAttribute('data-tone'),
            price: parseFloat(card.getAttribute('data-price')),
            img: card.getAttribute('data-img')
          });
          saveBag(); renderBag();
          var cnt = $('#bagCount');
          cnt.classList.remove('bump'); void cnt.offsetWidth; cnt.classList.add('bump');
          flyToBag(card);
          toast(card.getAttribute('data-name') + ' · Talla ' + size + ' añadido a tu bolsa');
        });
      });
    });
  }

  function flyToBag(card) {
    var img = $('.card__img', card), target = $('#bagBtn');
    if (!img || !target || !img.animate) return;
    var a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    var ghost = img.cloneNode();
    ghost.style.cssText = 'position:fixed;z-index:140;pointer-events:none;object-fit:cover;left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px;';
    document.body.appendChild(ghost);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var anim = ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '0%' },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.06)', opacity: .4, borderRadius: '50%' }
    ], { duration: 900, easing: 'cubic-bezier(.77,0,.175,1)' });
    anim.onfinish = function () { ghost.remove(); };
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    var el = $('#countdown');
    if (!el) return;
    var target = new Date(el.getAttribute('data-target')).getTime();
    var cells = {};
    $$('[data-unit]', el).forEach(function (c) { cells[c.getAttribute('data-unit')] = c; });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      var diff = Math.max(0, target - Date.now());
      var s = Math.floor(diff / 1000);
      var vals = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      Object.keys(vals).forEach(function (k) {
        var v = pad(vals[k]);
        if (cells[k].textContent !== v) {
          cells[k].textContent = v;
          cells[k].animate && cells[k].animate([{ transform: 'translateY(-30%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.19,1,.22,1)' });
        }
      });
      if (diff === 0) el.classList.add('is-live');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Formularios (prototipo) ---------- */
  function initForms() {
    [['#notifyForm', '#notifyMsg', 'Estás dentro. Te avisaremos antes que a nadie ✦'],
     ['#newsForm', '#newsMsg', 'Bienvenida al club HARO 🤎']].forEach(function (f) {
      var form = $(f[0]), msg = $(f[1]);
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.textContent = f[2];
        form.reset();
      });
    });
  }

  /* ---------- Tonos ---------- */
  function initTones() {
    var sec = $('#tonos');
    var tones = $$('.tone');
    var imgs = $$('.tones__img');
    var swatch = { royal: '#1E3DBA', olive: '#4D5640', cherry: '#4A1F28', mocha: '#9C8A78' };
    var current = 'royal';
    var activate = function (btn) {
      var key = btn.getAttribute('data-tone');
      if (key === current) return;
      tones.forEach(function (t) { t.classList.toggle('is-active', t === btn); });
      imgs.forEach(function (im) {
        var k = im.getAttribute('data-tone');
        im.classList.toggle('was-active', k === current);
        im.classList.toggle('is-active', k === key);
      });
      setTimeout(function () { imgs.forEach(function (im) { if (im.getAttribute('data-tone') !== key) im.classList.remove('was-active'); }); }, 1150);
      sec.style.setProperty('--tone', btn.getAttribute('data-bg'));
      sec.style.setProperty('--swatch', swatch[key]);
      btn.style.setProperty('--ink-tone', btn.getAttribute('data-ink'));
      current = key;
    };
    tones.forEach(function (t) {
      t.addEventListener('click', function () { activate(t); });
      if (finePointer) t.addEventListener('mouseenter', function () { activate(t); });
    });
    var first = tones[0];
    sec.style.setProperty('--tone', first.getAttribute('data-bg'));
    first.style.setProperty('--ink-tone', first.getAttribute('data-ink'));
  }

  /* ---------- Lookbook horizontal ---------- */
  function initLook() {
    var sec = $('#lookbook'), track = $('#lookTrack'), bar = $('#lookBar'), head = $('.look__head');
    if (!sec || !track) return;
    var cur = 0;
    (function loop() {
      if (isDesktop()) {
        var r = sec.getBoundingClientRect();
        var total = sec.offsetHeight - innerHeight;
        var p = clamp(-r.top / total, 0, 1);
        var max = track.scrollWidth - innerWidth;
        cur = lerp(cur, p * max, 0.12);
        track.style.transform = 'translate3d(' + (-cur).toFixed(2) + 'px,0,0)';
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        if (head) { head.style.opacity = clamp(1 - p * 9, 0, 1).toFixed(3); head.style.transform = 'translateX(' + (-p * 120).toFixed(1) + 'px)'; }
      } else if (track.style.transform) {
        track.style.transform = '';
        if (head) { head.style.opacity = ''; head.style.transform = ''; }
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Botones magnéticos ---------- */
  function initMagnetic() {
    if (!finePointer) return;
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * 0.25 + 'px,' + y * 0.35 + 'px)';
      });
      b.addEventListener('mouseleave', function () {
        b.style.transition = 'transform .6s cubic-bezier(.19,1,.22,1), color .5s, border-color .5s';
        b.style.transform = '';
        setTimeout(function () { b.style.transition = ''; }, 600);
      });
    });
  }

  /* ---------- Modal ---------- */
  function closeModal() {
    var m = $('#modal');
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  }
  function initModal() {
    var m = $('#modal');
    $$('[data-modal]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        $$('.modal__content', m).forEach(function (c) { c.classList.toggle('is-active', c.id === 'modal-' + a.getAttribute('data-modal')); });
        m.classList.add('is-open');
        m.setAttribute('aria-hidden', 'false');
      });
    });
    $('#modalClose').addEventListener('click', closeModal);
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
  }

  function boot() {
    safe(initSplash, 'splash');
    safe(initCursor, 'cursor');
    safe(initNav, 'nav');
    safe(initHero, 'hero');
    safe(initBand, 'band');
    safe(initWords, 'words');
    safe(initReveal, 'reveal');
    safe(initCounters, 'counters');
    safe(initFilters, 'filters');
    safe(initBag, 'bag');
    safe(initCountdown, 'countdown');
    safe(initForms, 'forms');
    safe(initTones, 'tones');
    safe(initLook, 'look');
    safe(initMagnetic, 'magnetic');
    safe(initModal, 'modal');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
