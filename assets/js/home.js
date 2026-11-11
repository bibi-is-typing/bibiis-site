/* bibiis.ai 첫 화면: 체험(아이디어 → 첫 화면), 눌러 보는 작업 카드, 코드 보기 */
(function () {
  'use strict';
  var C = window.BIBI || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }

  /* ---------- 테마 ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('bibi:theme', root.dataset.theme);
  });

  /* ---------- 바깥 링크 ---------- */
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = (C.links || {})[a.dataset.link];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-track]'); if (a) track('cta_click', { id: a.dataset.track });
  });
  if (C.ga4) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.ga4; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', C.ga4);
  }

  /* ---------- 체험: 아이디어 한 줄 → 첫 화면 ---------- */
  var form = document.getElementById('try-form');
  var input = document.getElementById('idea');
  var preview = document.getElementById('preview');
  var pvUrl = document.getElementById('pv-url');
  var pvNote = document.getElementById('pv-note');
  var after = document.getElementById('after');
  var afterCta = document.getElementById('after-cta');
  var mq = window.matchMedia('(max-width: 900px)');
  var timers = [];

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function later(fn, ms) { timers.push(setTimeout(fn, reduceMotion ? 0 : ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function setUrl(text, busy) { pvUrl.textContent = text; pvUrl.classList.toggle('busy', !!busy); }
  function typeInto(node, text) {
    if (reduceMotion) { node.textContent = text; return; }
    var i = 0; node.textContent = '';
    (function step() { i++; node.textContent = text.slice(0, i); if (i < text.length) timers.push(setTimeout(step, 22)); })();
  }
  function autoScroll() {
    var page = preview.querySelector('.pv-page'); if (!page) return;
    page.classList.remove('is-scroll');
    var dist = page.scrollHeight - preview.clientHeight + (preview.classList.contains('is-mobile') ? 36 : 0);
    if (dist > 8 && !reduceMotion) { page.style.setProperty('--sy', -dist + 'px'); void page.offsetWidth; page.classList.add('is-scroll'); }
  }

  function build(idea, opts) {
    opts = opts || {};
    idea = idea.replace(/\s+/g, ' ').trim();
    if (!idea) { input.focus(); return; }
    if (!window.BibiPreview) return;
    window.BibiPreview.loadFonts();
    var r = window.BibiPreview.render(idea);
    clearTimers();
    preview.classList.remove('empty', 'is-live', 'is-done');
    preview.classList.add('is-sk', 'is-mono');
    preview.replaceChildren(r.page);
    pvNote.replaceChildren.apply(pvNote, r.note.map(function (n) { var s = el('span'); s.appendChild(el('b', null, n[0])); s.appendChild(document.createTextNode(n[1])); return s; }));
    pvNote.hidden = false;
    setUrl('레이아웃 잡는 중…', true);
    later(function () { preview.classList.remove('is-mono'); setUrl('색 입히는 중…', true); }, 280);
    later(function () { preview.classList.remove('is-sk'); preview.classList.add('is-live'); setUrl('문구 쓰는 중…', true); typeInto(r.titleEl, r.title); }, 580);
    later(function () { preview.classList.add('is-done'); setUrl(r.domain); autoScroll(); }, 1150);
    if (opts.demo) return;
    after.hidden = false;
    if (afterCta) afterCta.href = '/listening/?plan=poc&from=try&idea=' + encodeURIComponent(idea);
    store.set('bibi:idea', idea);
    track('try_build', { template: r.cat.id });
    if (mq.matches) document.getElementById('browser').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  document.querySelectorAll('.seg [data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      preview.classList.toggle('is-mobile', b.dataset.view === 'mobile');
      document.querySelectorAll('.seg [data-view]').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      if (preview.classList.contains('is-done')) setTimeout(autoScroll, 50);
    });
  });

  /* 방문자가 손대기 전까지 예시 아이디어를 직접 타이핑해 보여 줌 */
  var demoIdeas = ['반려견 산책 매칭', '동네 헬스장 빈 시간 예약', '1인 세무 상담', '갓 구운 빵 미리 주문', '반복 업무 자동화 AI'];
  var demoOn = !!form && !!window.BibiPreview, demoIdx = 0, demoT = null;
  function demoStep() {
    if (!demoOn) return;
    var idea = demoIdeas[demoIdx++ % demoIdeas.length], i = 0;
    if (reduceMotion) { input.placeholder = '예) ' + idea; build(idea, { demo: true }); return; }
    input.value = '';
    (function type() {
      if (!demoOn) return;
      input.value = idea.slice(0, ++i);
      if (i < idea.length) { demoT = setTimeout(type, 45); return; }
      demoT = setTimeout(function () { build(idea, { demo: true }); demoT = setTimeout(demoStep, 5200); }, 200);
    })();
  }
  function stopDemo() { if (!demoOn) return; demoOn = false; clearTimeout(demoT); input.value = ''; }
  if (demoOn) {
    ['focus', 'pointerdown', 'keydown'].forEach(function (ev) { input.addEventListener(ev, stopDemo); });
    demoT = setTimeout(demoStep, 500);
  }
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; stopDemo(); input.value = v; build(v); });
  document.querySelectorAll('.chip[data-idea]').forEach(function (c) {
    c.addEventListener('click', function () { stopDemo(); input.value = c.dataset.idea; build(c.dataset.idea); });
  });

  /* ---------- 식당 앱: 화면 흐름을 직접 눌러 보기 ---------- */
  var phone = document.getElementById('flow-phone');
  if (phone) {
    var frames = phone.querySelectorAll('img');
    var stepBtns = document.querySelectorAll('.flow-steps [data-step]');
    var cur = 0, auto = null, touched = false;
    function show(n) {
      cur = (n + frames.length) % frames.length;
      frames.forEach(function (f, i) { f.classList.toggle('on', i === cur); });
      stepBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur); });
    }
    function userShow(n) { touched = true; phone.classList.add('touched'); clearInterval(auto); show(n); }
    phone.addEventListener('click', function () { userShow(cur + 1); track('flow_tap', { step: cur }); });
    stepBtns.forEach(function (b) { b.addEventListener('click', function () { userShow(+b.dataset.step); }); });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          clearInterval(auto);
          if (e.isIntersecting && !touched) auto = setInterval(function () { show(cur + 1); }, 2600);
        });
      }, { threshold: 0.5 }).observe(phone);
    }
  }

  /* ---------- 작업 카드: 캡처 넘겨 보기 ---------- */
  document.querySelectorAll('[data-shots]').forEach(function (box) {
    var imgs = box.querySelectorAll('.frames img');
    var dots = box.querySelectorAll('.dots button');
    var cur = 0;
    function show(n) {
      cur = (n + imgs.length) % imgs.length;
      imgs.forEach(function (f, i) { f.classList.toggle('on', i === cur); });
      dots.forEach(function (d, i) { d.setAttribute('aria-pressed', i === cur); });
    }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); }); });
    box.querySelector('.frames').addEventListener('click', function () { show(cur + 1); });
  });

  /* ---------- 코드 보기: 이 페이지의 실제 구조 ---------- */
  var srcBtn = document.getElementById('src-toggle');
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function clip(t) { t = t.replace(/\s+/g, ' ').trim(); return t.length > 48 ? t.slice(0, 48) + '…' : t; }
  function serialize(node, depth, out) {
    if (out.length > 30) return;
    var pad = new Array(depth + 1).join('  ');
    if (node.nodeType === 3) { var t = clip(node.textContent); if (t) out.push(pad + '<span class="x">' + esc(t) + '</span>'); return; }
    if (node.nodeType !== 1 || node.classList.contains('src') || node.tagName === 'SCRIPT') return;
    var tag = node.tagName.toLowerCase();
    var attrs = Array.prototype.map.call(node.attributes, function (a) {
      var v = a.name === 'class' ? a.value.replace(/\b(is-in|touched)\b/g, '').trim() : a.value;
      if (!v || !/^(id|class|href|src|type|data-step|aria-pressed)$/.test(a.name)) return '';
      return ' <span class="a">' + a.name + '</span>=<span class="s">"' + esc(v) + '"</span>';
    }).join('');
    if (/^(IMG|INPUT|BR)$/.test(node.tagName)) { out.push(pad + '<span class="t">&lt;' + tag + '</span>' + attrs + '<span class="t">&gt;</span>'); return; }
    var kids = Array.prototype.filter.call(node.childNodes, function (k) { return k.nodeType === 1 || k.textContent.trim(); });
    if (kids.length === 1 && kids[0].nodeType === 3) {
      out.push(pad + '<span class="t">&lt;' + tag + '</span>' + attrs + '<span class="t">&gt;</span><span class="x">' + esc(clip(kids[0].textContent)) + '</span><span class="t">&lt;/' + tag + '&gt;</span>');
      return;
    }
    out.push(pad + '<span class="t">&lt;' + tag + '</span>' + attrs + '<span class="t">&gt;</span>');
    kids.forEach(function (k) { serialize(k, depth + 1, out); });
    out.push(pad + '<span class="t">&lt;/' + tag + '&gt;</span>');
  }
  function buildSource(section) {
    var wrap = section.querySelector('.wrap'); if (!wrap || wrap.querySelector(':scope > .src')) return;
    var out = ['<span class="c">// #' + section.id + ' · 이 화면의 실제 구조</span>'];
    var tag = section.tagName.toLowerCase();
    out.push('<span class="t">&lt;' + tag + '</span> <span class="a">id</span>=<span class="s">"' + section.id + '"</span><span class="t">&gt;</span>');
    Array.prototype.forEach.call(wrap.children, function (c) { serialize(c, 1, out); });
    if (out.length > 30) out = out.slice(0, 30).concat(['  <span class="c">// … 나머지는 생략</span>']);
    out.push('<span class="t">&lt;/' + tag + '&gt;</span>');
    var pre = document.createElement('pre'); pre.className = 'src'; pre.innerHTML = out.join('\n');
    wrap.insertBefore(pre, wrap.firstChild);
  }
  if (srcBtn) srcBtn.addEventListener('click', function () {
    var on = !root.classList.contains('view-source');
    if (on) document.querySelectorAll('[data-src]').forEach(buildSource);
    root.classList.toggle('view-source', on);
    srcBtn.setAttribute('aria-pressed', on);
    srcBtn.title = on ? '화면으로 보기' : '이 페이지의 코드 보기';
    var label = srcBtn.querySelector('.src-label'); if (label) label.textContent = on ? '화면으로 보기' : '코드 보기';
    if (on) document.getElementById('work').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    track('view_source', { on: on });
  });

  /* ---------- 스크롤하면 차례로 나타나기 ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var items = document.querySelectorAll('[data-reveal]');
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
    }, { threshold: 0.08 });
    items.forEach(function (n, i) { n.style.setProperty('--i', i % 4); rio.observe(n); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (n) { n.classList.add('is-in'); });
  }
})();
