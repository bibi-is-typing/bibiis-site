(function () {
  'use strict';
  var C = window.BIBI || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var dark = root.dataset.theme !== 'light';
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('bibi:theme', root.dataset.theme);
  });

  /* ---------- status line (C) ---------- */
  function renderStatus(s) {
    var el = document.getElementById('status-text'); if (!el || !s) return;
    var next = String(s.next);
    var nextLine = '새 작업은 ' + next + '부터';
    if (s.mode === 'resting') el.textContent = next + '부터 다시 받습니다';
    else if (s.lastSeat) el.textContent = '이번 달 마지막 한 자리 · ' + nextLine;
    else el.textContent = '지금 ' + Number(s.active) + '건 제작 중 · ' + nextLine;
  }
  renderStatus(C.status);
  fetch('/data/status.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(renderStatus).catch(function () {});

  /* ---------- outbound links + UTM ---------- */
  function withUtm(url, content) {
    try { var u = new URL(url); u.searchParams.set('utm_source', 'bibiis'); u.searchParams.set('utm_content', content); return u.toString(); } catch (e) { return url; }
  }
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = (C.links || {})[a.dataset.link];
    if (url) { a.href = withUtm(url, a.dataset.track || a.dataset.link); a.target = '_blank'; a.rel = 'noopener'; }
    else { a.dataset.pending = ''; a.title = '링크 준비 중입니다. 상담 신청서로 연결됩니다.'; }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-track]'); if (a) track('cta_click', { id: a.dataset.track });
  });

  /* ---------- GA4 ---------- */
  if (C.ga4) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.ga4; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', C.ga4);
  }

  /* ---------- threads ---------- */
  if (C.threads) {
    var line = document.getElementById('threads-line'), link = document.getElementById('threads-link');
    if (line && link) { link.href = 'https://www.threads.com/@' + C.threads; link.textContent = '@' + C.threads; link.target = '_blank'; link.rel = 'noopener'; line.hidden = false; }
  }

  /* ---------- logo word follows the section ---------- */
  var logoWord = document.getElementById('logo-word');
  var current = logoWord ? logoWord.textContent : '';
  function typeWord(word) {
    if (!logoWord || word === current) return;
    current = word;
    if (reduceMotion) { logoWord.textContent = word; return; }
    var i = 0; logoWord.textContent = '';
    (function step() { i++; logoWord.textContent = word.slice(0, i); if (i < word.length && current === word) setTimeout(step, 45); })();
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) typeWord(en.target.dataset.word); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('section[data-word]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- hero typing line ---------- */
  var typingLine = document.getElementById('typing-line');
  if (typingLine && !reduceMotion) {
    var words = ['듣는 중…', '만드는 중', '고치는 중', '여는 중'], wi = 0;
    setInterval(function () {
      if (typingLine.dataset.locked) return;
      wi = (wi + 1) % words.length; typingLine.textContent = 'bibi · ' + words[wi];
    }, 2200);
  }

  /* ---------- lead text by layout ---------- */
  var where = document.getElementById('lead-where');
  var mq = window.matchMedia('(max-width: 900px)');
  function setWhere() { if (where) where.textContent = mq.matches ? '아래에' : '오른쪽에'; }
  setWhere(); if (mq.addEventListener) mq.addEventListener('change', setWhere);

  /* ---------- try it (A): industry-aware mini site ---------- */
  var form = document.getElementById('try-form');
  var input = document.getElementById('idea');
  var preview = document.getElementById('preview');
  var pvUrl = document.getElementById('pv-url');
  var pvNote = document.getElementById('pv-note');
  var after = document.getElementById('after');
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
    if (typingLine) { typingLine.dataset.locked = '1'; typingLine.textContent = 'bibi · 만드는 중'; }
    store.set('bibi:idea', idea);
    track('try_build', { template: r.cat.id });
    if (mq.matches) preview.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  document.querySelectorAll('.seg [data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      var mobile = b.dataset.view === 'mobile';
      preview.classList.toggle('is-mobile', mobile);
      document.querySelectorAll('.seg [data-view]').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      if (preview.classList.contains('is-done')) setTimeout(autoScroll, 50);
    });
  });

  /* idle demo: types example ideas until the visitor takes over */
  var demoIdeas = ['반려견 산책 매칭', '동네 헬스장 빈 시간 예약', '1인 세무 상담', '갓 구운 빵 미리 주문', '반복 업무 자동화 AI', '내 포트폴리오 사이트'];
  var demoOn = !reduceMotion && !!form, demoIdx = 0, demoT = null, demoTyping = false;
  function demoStep() {
    if (!demoOn) return;
    var idea = demoIdeas[demoIdx++ % demoIdeas.length], i = 0;
    demoTyping = true; input.value = '';
    (function type() {
      if (!demoOn) return;
      input.value = idea.slice(0, ++i);
      if (i < idea.length) { demoT = setTimeout(type, 45); return; }
      demoTyping = false;
      demoT = setTimeout(function () { build(idea, { demo: true }); demoT = setTimeout(demoStep, 5000); }, 200);
    })();
  }
  function stopDemo() {
    if (!demoOn) return;
    demoOn = false; clearTimeout(demoT); input.value = '';
  }
  if (demoOn) {
    ['focus', 'pointerdown', 'keydown'].forEach(function (ev) { input.addEventListener(ev, stopDemo); });
    demoT = setTimeout(demoStep, 500);
  }

  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; stopDemo(); input.value = v; build(v); });
  document.querySelectorAll('.chip[data-idea]').forEach(function (c) {
    c.addEventListener('click', function () { stopDemo(); input.value = c.dataset.idea; build(c.dataset.idea); });
  });

  /* ---------- tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; selectTab(n); n.focus(); }
    });
  });

  /* ---------- fixing checklist ---------- */
  var checks = document.querySelectorAll('.check-list input');
  var result = document.getElementById('check-result');
  checks.forEach(function (c) {
    c.addEventListener('change', function () {
      var n = document.querySelectorAll('.check-list input:checked').length;
      result.textContent = n ? n + '개 선택. 보통 ' + (n > 3 ? '2~3' : '1~2') + '일이면 해결됩니다.' : '';
    });
  });

  /* ---------- copy ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.dataset.copy;
      var done = function () { toast('주소를 복사했습니다'); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { window.prompt('복사해 주세요', text); });
      else window.prompt('복사해 주세요', text);
    });
  });

  /* ---------- view source (B) ---------- */
  var srcBtn = document.getElementById('src-toggle');
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function serialize(node, depth, out) {
    if (out.length > 26) return;
    var pad = new Array(depth + 1).join('  ');
    if (node.nodeType === 3) {
      var t = node.textContent.replace(/\s+/g, ' ').trim();
      if (t) out.push(pad + '<span class="x">' + esc(t.length > 48 ? t.slice(0, 48) + '…' : t) + '</span>');
      return;
    }
    if (node.nodeType !== 1 || node.classList.contains('src') || node.tagName === 'SCRIPT') return;
    var tag = node.tagName.toLowerCase();
    var attrs = Array.prototype.filter.call(node.attributes, function (a) { return /^(id|class|href|type|placeholder|role|data-link)$/.test(a.name); })
      .map(function (a) { return ' <span class="a">' + a.name + '</span>=<span class="s">"' + esc(a.value) + '"</span>'; }).join('');
    var kids = Array.prototype.slice.call(node.childNodes).filter(function (k) { return k.nodeType === 1 || k.textContent.trim(); });
    if (kids.length === 1 && kids[0].nodeType === 3) {
      var tx = kids[0].textContent.replace(/\s+/g, ' ').trim();
      out.push(pad + '<span class="t">&lt;' + tag + '</span>' + attrs + '<span class="t">&gt;</span><span class="x">' + esc(tx.length > 48 ? tx.slice(0, 48) + '…' : tx) + '</span><span class="t">&lt;/' + tag + '&gt;</span>');
      return;
    }
    out.push(pad + '<span class="t">&lt;' + tag + '</span>' + attrs + '<span class="t">&gt;</span>');
    kids.forEach(function (k) { serialize(k, depth + 1, out); });
    out.push(pad + '<span class="t">&lt;/' + tag + '&gt;</span>');
  }
  function buildSource(section) {
    var wrap = section.querySelector('.wrap'); if (!wrap || wrap.querySelector(':scope > .src')) return;
    var out = ['<span class="c">// ' + (section.id || 'section') + ' · 이 화면의 실제 구조</span>'];
    var tag = section.tagName.toLowerCase();
    out.push('<span class="t">&lt;' + tag + '</span> <span class="a">id</span>=<span class="s">"' + section.id + '"</span><span class="t">&gt;</span>');
    Array.prototype.forEach.call(wrap.children, function (c) { serialize(c, 1, out); });
    if (out.length > 26) out = out.slice(0, 26).concat(['  <span class="c">// … 나머지는 생략</span>']);
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
    track('view_source', { on: on });
  });

  /* ---------- motion ---------- */
  if (!reduceMotion) {
    /* scroll progress + hero parallax */
    var prog = document.getElementById('progress');
    var heroBg = document.querySelector('.hero-bg');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - innerHeight;
        if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
        if (heroBg && scrollY < innerHeight * 1.2) heroBg.style.transform = 'translate3d(0,' + (scrollY * 0.35) + 'px,0)';
        ticking = false;
      });
    }, { passive: true });

    /* hero spotlight + browser tilt (mouse only) */
    var hero = document.getElementById('try'), browser = document.getElementById('browser');
    if (hero && window.matchMedia('(pointer: fine)').matches) {
      var pmFrame = 0;
      hero.addEventListener('pointermove', function (ev) {
        if (pmFrame) return;
        pmFrame = requestAnimationFrame(function () { pmFrame = 0; onPointer(ev); });
      });
      var onPointer = function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (!browser) return;
        var b = browser.getBoundingClientRect();
        var x = (e.clientX - (b.left + b.width / 2)) / b.width, y = (e.clientY - (b.top + b.height / 2)) / b.height;
        browser.style.transform = 'perspective(1400px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg)';
      };
      hero.addEventListener('pointerleave', function () { if (browser) browser.style.transform = ''; });
    }

    /* reveal on scroll, staggered inside each group */
    var groups = ['.section-head', '.g-grid', '.tabs', '.scenes', '.check', '.term', '.shiplog', '.steps', '.plans', '.extras', '.faq', '.listening .wrap', '.proof .col > .label', '.proof .col > h2'];
    function countUp(b) {
      var to = Number(b.dataset.count), t0 = null;
      (function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 4);
        b.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }
    if ('IntersectionObserver' in window) {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var g = en.target; rio.unobserve(g);
          var items = g.matches('.section-head, .g-grid, .scenes, .term, .shiplog, .steps, .plans, .faq, .listening .wrap, .tabs') ? g.children : [g];
          Array.prototype.forEach.call(items, function (n) { n.classList.add('is-in'); });
          g.querySelectorAll('[data-count]').forEach(countUp);
        });
      }, { threshold: 0.04, rootMargin: '0px 0px -2% 0px' });
      groups.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (g) {
          var items = g.matches('.section-head, .g-grid, .scenes, .term, .shiplog, .steps, .plans, .faq, .listening .wrap, .tabs') ? g.children : [g];
          Array.prototype.forEach.call(items, function (n, i) { n.setAttribute('data-reveal', ''); n.style.setProperty('--i', Math.min(i, 8)); });
          rio.observe(g);
        });
      });
    }
  }
})();
