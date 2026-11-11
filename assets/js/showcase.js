/* bibi is building — industry stage, manifesto word light-up, section counter */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 1000px) and (min-height: 620px)');

  /* ---------- industry stage: the whole screen takes on each industry ---------- */
  var section = document.getElementById('gallery');
  var screensEl = document.getElementById('st-screens');
  var featured = ['반려견 산책 매칭', '동네 헬스장 빈 시간 예약', '1인 세무 상담', '갓 구운 빵 미리 주문', '내 포트폴리오 사이트', '반복 업무 자동화 AI'];
  var items = [], active = -1;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  if (section && screensEl && window.BibiPreview) {
    var list = document.getElementById('st-list');
    featured.forEach(function (idea, i) {
      var r = window.BibiPreview.render(idea);
      var pal = r.page.style;
      var scr = el('div', 'st-screen'); scr.appendChild(r.page); screensEl.appendChild(scr);
      var li = el('li'); var btn = el('button', null); btn.type = 'button';
      btn.appendChild(el('span', 'n', String(i + 1).padStart(2, '0'))); btn.appendChild(document.createTextNode(r.cat.label));
      li.appendChild(btn); list.appendChild(li);
      btn.addEventListener('click', function () { go(i, true); });
      items.push({ idea: idea, r: r, scr: scr, li: li, bg: pal.getPropertyValue('--bg'), fg: pal.getPropertyValue('--fg'), ac: pal.getPropertyValue('--ac'), on: pal.getPropertyValue('--on'), font: r.cat.font });
    });
    document.getElementById('st-try').addEventListener('click', function (e) {
      e.preventDefault();
      var it = items[Math.max(0, active)], input = document.getElementById('idea'), form = document.getElementById('try-form');
      document.getElementById('try').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      if (input && form) { input.dispatchEvent(new Event('focus')); input.value = it.idea; form.requestSubmit(); }
    });
  }

  var pinOn = function () { return !reduceMotion && wide.matches; };
  function setActive(i) {
    if (i === active || !items[i]) return;
    var it = items[i], prev = active; active = i;
    var st = section.style;
    st.setProperty('--sbg', it.bg); st.setProperty('--sfg', it.fg); st.setProperty('--sac', it.ac); st.setProperty('--son', it.on);
    st.setProperty('--sdf', it.font ? "'" + it.font.family + "', 'Pretendard Variable', sans-serif" : "'Pretendard Variable', Pretendard, sans-serif");
    items.forEach(function (x, k) {
      x.scr.classList.toggle('is-on', k <= i); x.scr.classList.toggle('is-top', k === i);
      x.li.classList.toggle('is-on', k === i);
    });
    document.getElementById('st-url').textContent = it.r.domain;
    var note = document.getElementById('st-note'); note.textContent = '';
    [['톤', it.r.cat.voice], ['화면', it.r.cat.look]].forEach(function (n) { note.appendChild(el('b', null, n[0])); note.appendChild(document.createTextNode(n[1] + ' ')); });
    var word = document.getElementById('st-word');
    word.classList.remove('swap'); void word.offsetWidth; word.textContent = it.r.cat.label; word.classList.add('swap');
    word.dataset.dir = i > prev ? 'up' : 'down';
  }
  function go(i, scroll) {
    if (!pinOn() || !scroll) { setActive(i); return; }
    var total = section.offsetHeight - innerHeight;
    window.scrollTo({ top: section.offsetTop + total * ((i + 0.5) / items.length), behavior: 'smooth' });
  }
  function applyStage() {
    if (!section || !items.length) return;
    section.classList.toggle('is-pin', pinOn());
    if (!pinOn()) { if (active < 0) setActive(0); return; }
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - innerHeight;
    var p = Math.min(0.999, Math.max(0, -rect.top / Math.max(1, total)));
    setActive(Math.floor(p * items.length));
  }
  if (items.length) {
    setActive(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) window.BibiPreview.loadFonts(); }, { rootMargin: '600px 0px' }).observe(section);
    }
    if (!pinOn()) {
      // not pinned: cycle on its own while in view
      var auto = null;
      new IntersectionObserver(function (en) {
        clearInterval(auto);
        if (en[0].isIntersecting && !pinOn() && !reduceMotion) auto = setInterval(function () { setActive((active + 1) % items.length); }, 2600);
      }, { threshold: 0.4 }).observe(section);
    }
  }

  /* ---------- manifesto ---------- */
  var m = document.getElementById('m-text'), words = [];
  if (m) {
    // wrap each word in a span, keep the hand-placed <br> line breaks
    Array.prototype.slice.call(m.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = el('span', 'w', part); frag.appendChild(s); words.push(s);
      });
      m.replaceChild(frag, node);
    });
    words.slice(-4).forEach(function (w) { w.classList.add('hl'); });
    if (reduceMotion) words.forEach(function (w) { w.classList.add('on'); });
  }
  function applyWords() {
    if (!m || reduceMotion) return;
    var r = m.getBoundingClientRect();
    var p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
    var lit = Math.round(Math.min(1, Math.max(0, p)) * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
  }

  /* ---------- section counter ---------- */
  var counter = document.getElementById('sec-count');
  if (counter && 'IntersectionObserver' in window) {
    var heads = [];
    document.querySelectorAll('main section').forEach(function (sec) {
      var lab = sec.querySelector('.section-head .label, .col > .label, .st-copy > .label');
      var m2 = lab && lab.textContent.match(/^(\d\d) · (.+)$/);
      if (m2) heads.push({ sec: sec, n: m2[1], name: m2[2] });
    });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var h = heads.find(function (x) { return x.sec === en.target; });
        if (h) { counter.querySelector('b').textContent = h.n; counter.querySelector('span').textContent = h.name; counter.classList.add('show'); }
        else counter.classList.remove('show');
      });
    }, { rootMargin: '-50% 0px -49% 0px' });
    heads.forEach(function (h) { cio.observe(h.sec); });
    ['try', 'listening'].forEach(function (id) { var n = document.getElementById(id); if (n) cio.observe(n); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { applyStage(); applyWords(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (wide.addEventListener) wide.addEventListener('change', onScroll);
  applyStage(); applyWords();
})();
