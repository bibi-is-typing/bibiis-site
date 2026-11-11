// 만든 것 페이지. 작업 목록은 data/works.json 한 곳에서 관리합니다.
(function () {
  'use strict';
  var list = document.getElementById('work-list');
  var index = document.getElementById('work-index');
  if (!list) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function shots(w) {
    if (!w.shots || !w.shots.length) return '<div class="locked">🔒 ' + esc(w.locked || '화면 비공개') + '</div>';
    var figs = w.shots.map(function (s, i) {
      var big = s.kind === 'mobile' ? ' width="640" height="1385"' : '';
      return '<figure class="' + (s.kind === 'mobile' ? 'is-mobile' : 'is-pc') + '"><span class="shot"><img src="/assets/work/' + esc(w.slug) + '/' + esc(s.src) + '" alt="' + esc(s.caption) + '"' + big + (i ? ' loading="lazy"' : '') + '></span><figcaption>' + esc(s.caption) + '</figcaption></figure>';
    }).join('');
    var nav = w.shots.length > 1 ? '<div class="strip-nav"><button type="button" data-dir="-1" aria-label="이전 화면">←</button><button type="button" data-dir="1" aria-label="다음 화면">→</button></div>' : '';
    return '<div class="strip" tabindex="0" aria-label="' + esc(w.title) + ' 화면">' + figs + '</div>' + nav;
  }

  function item(w) {
    var dl = '<dl class="scqa">' +
      (w.situation ? '<div><dt>상황</dt><dd>' + esc(w.situation) + '</dd></div>' : '') +
      (w.problem ? '<div><dt>문제</dt><dd>' + esc(w.problem) + '</dd></div>' : '') +
      (w.q ? '<div class="q"><dt>질문</dt><dd>' + esc(w.q) + '</dd></div>' : '') +
      (w.a ? '<div class="a"><dt>답</dt><dd>' + esc(w.a) + '</dd></div>' : '') + '</dl>';
    return '<article class="case-item" id="' + esc(w.slug) + '">' +
      '<div class="case-copy"><div class="meta"><span class="tag' + (w.tagKind === 'live' ? ' live' : '') + '">' + esc(w.tag) + '</span><span>' + esc(w.date) + '</span></div>' +
      '<h2>' + esc(w.title) + '</h2><p class="what">' + esc(w.line) + '</p>' + dl +
      (w.built ? '<p class="built">' + esc(w.built) + '</p>' : '') +
      (w.url ? '<a class="go" href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.url.replace(/^https?:\/\//, '')) + ' 열어 보기 ↗</a>' : '') +
      '</div><div class="case-shots ' + esc(w.tint || 't-blue') + '">' + shots(w) + '</div></article>';
  }

  function wire(art) {
    var strip = art.querySelector('.strip'); if (!strip) return;
    var btns = art.querySelectorAll('.strip-nav button');
    var sync = function () {
      if (!btns.length) return;
      btns[0].disabled = strip.scrollLeft < 4;
      btns[1].disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var fig = strip.querySelector('figure');
        strip.scrollBy({ left: (fig ? fig.offsetWidth + 16 : 300) * Number(b.dataset.dir), behavior: 'smooth' });
      });
    });
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  fetch('/data/works.json').then(function (r) { return r.json(); }).then(function (d) {
    var works = d.works || [];
    if (index) index.innerHTML = works.map(function (w) { return '<a href="#' + esc(w.slug) + '"><i class="' + (w.tagKind === 'live' ? 'live' : '') + '"></i>' + esc(w.title) + '</a>'; }).join('');
    list.innerHTML = works.map(item).join('');
    list.querySelectorAll('.case-item').forEach(wire);
    if (location.hash) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
  }).catch(function () { list.innerHTML = '<p style="text-align:center;color:var(--ink-2)">작업 목록을 불러오지 못했어요. 새로고침해 주세요.</p>'; });
})();
