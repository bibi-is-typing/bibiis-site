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
    var pre = '<span class="s-pre">bibi is ' + (s.mode === 'resting' ? 'resting' : 'building') + ' · </span>';
    var next = '다음 시작<span class="s-long"> 가능일</span> ' + String(s.next).replace(/[<>&]/g, '');
    if (s.mode === 'resting') el.innerHTML = pre + String(s.next).replace(/[<>&]/g, '') + '부터 다시 받아요';
    else if (s.lastSeat) el.innerHTML = pre + '이번 달 마지막 한 자리 · ' + next;
    else el.innerHTML = pre + '지금 ' + Number(s.active) + '건 만드는 중 · ' + next;
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
    else { a.dataset.pending = ''; a.title = '링크 준비 중이에요. 상담 폼으로 연결돼요.'; }
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
    var words = ['typing…', 'building', 'fixing', 'shipping'], wi = 0;
    setInterval(function () {
      if (typingLine.dataset.locked) return;
      wi = (wi + 1) % words.length; typingLine.textContent = 'bibi is ' + words[wi];
    }, 2200);
  }

  /* ---------- lead text by layout ---------- */
  var where = document.getElementById('lead-where');
  var mq = window.matchMedia('(max-width: 900px)');
  function setWhere() { if (where) where.textContent = mq.matches ? '아래에' : '오른쪽에'; }
  setWhere(); if (mq.addEventListener) mq.addEventListener('change', setWhere);

  /* ---------- try it (A) ---------- */
  var form = document.getElementById('try-form');
  var input = document.getElementById('idea');
  var preview = document.getElementById('preview');
  var pvUrl = document.getElementById('pv-url');
  var after = document.getElementById('after');

  var templates = [
    { id: 'portfolio', test: /포트폴리오|이력서|취업|취준|디자이너|개발자|portfolio/i,
      desc: '지금까지 만든 것과 연락처를 한 페이지에 모았어요. 편하게 연락 주세요.', cta: '작업 보기', badge: 'Open to work' },
    { id: 'consult', test: /상담|컨설팅|레슨|클래스|코칭|강의|과외|세무|법률|노무/,
      desc: '첫 상담은 무료예요. 지금 신청하면 이번 주 안에 연락드려요.', cta: '무료 상담 신청', badge: '신청 받는 중' },
    { id: 'service', test: /.*/,
      desc: '오픈 전, 사전 신청을 받고 있어요. 가장 먼저 써 보실 분을 찾아요.', cta: '사전 신청하기', badge: 'Coming soon' }
  ];

  function slugify(text) {
    var s = (text.match(/[A-Za-z0-9]+/g) || []).join('-').toLowerCase().slice(0, 32);
    return s || 'your-idea';
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function build(idea) {
    idea = idea.replace(/\s+/g, ' ').trim();
    if (!idea) { input.focus(); return; }
    var tpl = templates.find(function (t) { return t.test.test(idea); });
    var title = idea.length > 40 ? idea.slice(0, 40) + '…' : idea;
    var desc = idea.length > 40 ? idea + '. ' + tpl.desc : tpl.desc;
    preview.className = 'preview';
    preview.replaceChildren(
      el('span', 'badge typing', tpl.badge),
      el('h3', 'typing', title),
      el('p', 'typing', desc),
      (function () { var b = el('span', 'btn btn-primary typing', tpl.cta); b.style.alignSelf = 'flex-start'; return b; })(),
      el('div', 'fake-img', null),
      el('p', 'fine', '이건 1분짜리 예시예요. 진짜는 누구를 설득할지부터 같이 정해요.')
    );
    pvUrl.textContent = 'preview.bibiis.ai/' + slugify(idea);
    after.hidden = false;
    if (typingLine) { typingLine.dataset.locked = '1'; typingLine.textContent = 'bibi is building'; }
    store.set('bibi:idea', idea);
    track('try_build', { template: tpl.id });
    if (mq.matches) preview.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); build(input.value); });
  document.querySelectorAll('.chip[data-idea]').forEach(function (c) {
    c.addEventListener('click', function () { input.value = c.dataset.idea; build(c.dataset.idea); });
  });

  /* ---------- event band ---------- */
  var ev = document.getElementById('event');
  if (ev && ev.dataset.ends && Date.now() > Date.parse(ev.dataset.ends)) ev.remove();

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
      result.textContent = n ? n + '개 체크했어요. 이 정도는 보통 ' + (n > 3 ? '2~3' : '1~2') + '일이면 풀려요.' : '';
    });
  });

  /* ---------- copy ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.dataset.copy;
      var done = function () { toast('주소를 복사했어요'); };
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
    var out = ['<span class="c">// ' + (section.id || 'section') + ' · 이 화면의 실제 구조예요</span>'];
    var tag = section.tagName.toLowerCase();
    out.push('<span class="t">&lt;' + tag + '</span> <span class="a">id</span>=<span class="s">"' + section.id + '"</span><span class="t">&gt;</span>');
    Array.prototype.forEach.call(wrap.children, function (c) { serialize(c, 1, out); });
    if (out.length > 26) out = out.slice(0, 26).concat(['  <span class="c">// … 나머지는 직접 열어 보세요</span>']);
    out.push('<span class="t">&lt;/' + tag + '&gt;</span>');
    var pre = document.createElement('pre'); pre.className = 'src'; pre.innerHTML = out.join('\n');
    wrap.insertBefore(pre, wrap.firstChild);
  }
  if (srcBtn) srcBtn.addEventListener('click', function () {
    var on = !root.classList.contains('view-source');
    if (on) document.querySelectorAll('[data-src]').forEach(buildSource);
    root.classList.toggle('view-source', on);
    srcBtn.setAttribute('aria-pressed', on);
    srcBtn.title = on ? '화면으로 보기' : '이 페이지의 소스 보기';
    var label = srcBtn.querySelector('.src-label'); if (label) label.textContent = on ? '화면으로 보기' : '소스 보기';
    track('view_source', { on: on });
  });
})();
