/* bibi is building — industry gallery (scatter → grid), manifesto word light-up, section counter */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 1100px) and (min-height: 640px)');

  /* ---------- gallery ---------- */
  var grid = document.getElementById('g-grid');
  var section = document.getElementById('gallery');
  var ideas = ['반려견 산책 매칭', '동네 헬스장 빈 시간 예약', '갓 구운 빵 미리 주문', '중학생 수학 과외', '1인 세무 상담', '내 포트폴리오 사이트',
    '핸드메이드 소품 스토어', '바다 앞 독채 스테이', '반복 업무 자동화 AI', '주말 보드게임 모임', '중고 장난감 교환'];
  var cards = [];

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  if (grid && window.BibiPreview) {
    ideas.forEach(function (idea, i) {
      var r = window.BibiPreview.render(idea);
      var a = el('a', 'g-card'); a.href = '#try'; a.dataset.idea = idea;
      var shot = el('div', 'g-shot'), inner = el('div', 'g-inner');
      inner.appendChild(r.page); shot.appendChild(inner); shot.appendChild(el('span', 'g-tag', '예시'));
      var cap = el('span', 'g-cap'); cap.appendChild(el('b', null, r.cat.label)); cap.appendChild(document.createTextNode(idea));
      a.appendChild(shot); a.appendChild(cap);
      var h = window.BibiPreview.hash(idea + i);
      a._scatter = { x: ((h % 1000) / 1000 - 0.5), y: (((h >>> 10) % 1000) / 1000 - 0.5), r: (((h >>> 20) % 1000) / 1000 - 0.5) * 50 };
      grid.appendChild(a); cards.push(a);
    });
    var cta = el('a', 'g-card g-cta'); cta.href = '#try';
    cta.appendChild(el('span', 'g-cta-t', '내 아이디어로\n만들어 보기'));
    cta.appendChild(el('span', 'g-cta-a', '→'));
    grid.appendChild(cta); cta._scatter = { x: 0.1, y: 0.4, r: -8 }; cards.push(cta);

    grid.addEventListener('click', function (e) {
      var a = e.target.closest('.g-card[data-idea]'); if (!a) return;
      e.preventDefault();
      var input = document.getElementById('idea'), form = document.getElementById('try-form');
      document.getElementById('try').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      if (input && form) { input.dispatchEvent(new Event('focus')); input.value = a.dataset.idea; form.requestSubmit(); }
    });

    var scale = function () {
      cards.forEach(function (c) {
        var shot = c.querySelector('.g-shot'), inner = c.querySelector('.g-inner');
        if (shot && inner) inner.style.transform = 'scale(' + (shot.clientWidth / 520) + ')';
      });
    };
    scale(); window.addEventListener('resize', scale);
  }

  var scatterOn = function () { return !reduceMotion && wide.matches; };
  function applyScatter() {
    if (!section) return;
    section.classList.toggle('is-scatter', scatterOn());
    if (!scatterOn()) { cards.forEach(function (c) { c.style.transform = ''; c.style.opacity = ''; }); return; }
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - innerHeight;
    var p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
    var t = Math.min(1, p / 0.75), e = 1 - Math.pow(1 - t, 3), k = 1 - e;
    cards.forEach(function (c) {
      var s = c._scatter;
      c.style.transform = 'translate3d(' + (s.x * innerWidth * 0.9 * k).toFixed(1) + 'px,' + (s.y * innerHeight * 0.9 * k).toFixed(1) + 'px,0) rotate(' + (s.r * k).toFixed(2) + 'deg) scale(' + (1 - 0.12 * k).toFixed(3) + ')';
    });
    section.style.setProperty('--gp', e.toFixed(3));
  }

  /* ---------- manifesto ---------- */
  var m = document.getElementById('m-text'), words = [];
  if (m) {
    var text = m.textContent.trim(); m.textContent = '';
    text.split(' ').forEach(function (w, i, arr) {
      var s = el('span', 'w', w); m.appendChild(s); words.push(s);
      if (i < arr.length - 1) m.appendChild(document.createTextNode(' '));
    });
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
      var lab = sec.querySelector('.section-head .label, .col > .label');
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
    requestAnimationFrame(function () { applyScatter(); applyWords(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (wide.addEventListener) wide.addEventListener('change', onScroll);
  applyScatter(); applyWords();
})();
