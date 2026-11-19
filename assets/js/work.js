// 만든 것 페이지. 작업 목록은 data/works.json 한 곳에서 관리합니다.
(function () {
  'use strict';
  var list = document.getElementById('work-list');
  var index = document.getElementById('work-index');
  if (!list) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function redraw(kind) {
    if (kind !== 'checkin') return '';
    return '<div class="redraw" role="img" aria-label="다시 그린 화면: 매장에 붙은 QR로 들어와 처음 한 번 등록하면, 매장 와이파이에 연결돼 있을 때만 출근 버튼이 눌림">' +
      '<span class="cap">다시 그린 화면</span>' +
      '<span class="phone"><span class="hi">처음 한 번만 등록</span><span class="go">출근하기</span><span class="wifi">매장 와이파이 연결됨</span><i></i><i></i></span>' +
      '<span class="qr-card"><img src="/assets/work/store-checkin-qr.svg" alt="" width="64" height="64"><b>매장 QR</b></span></div>';
  }
  function shots(w) {
    if (w.illustration) return redraw(w.illustration);
    if (!w.shots || !w.shots.length) return '<div class="locked">🔒 ' + esc(w.locked || '화면 비공개') + '</div>';
    var figs = w.shots.map(function (s, i) {
      var big = s.kind === 'mobile' ? ' width="640" height="1385"' : '';
      return '<figure class="' + (s.kind === 'mobile' ? 'is-mobile' : 'is-pc') + '"><span class="shot"><img src="/assets/work/' + esc(w.slug) + '/' + esc(s.src) + '" alt="' + esc(s.caption) + '"' + big + (i ? ' loading="lazy"' : '') + '></span><figcaption>' + esc(s.caption) + '</figcaption></figure>';
    }).join('');
    var nav = w.shots.length > 1 ? '<div class="strip-nav"><button type="button" data-dir="-1" aria-label="이전 화면">←</button><button type="button" data-dir="1" aria-label="다음 화면">→</button></div>' : '';
    return '<div class="strip" tabindex="0" aria-label="' + esc(w.title) + ' 화면">' + figs + '</div>' + nav;
  }

  function cover(w) {
    if (!w.covers || !w.covers.length) return '';
    var imgs = w.covers.map(function (c, i) {
      var src = '/assets/work/' + esc(w.slug) + '/' + esc(c.src);
      return '<a href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="' + esc(c.alt) + '" width="1600" height="1000"' + (i ? ' loading="lazy"' : '') + '></a>';
    }).join('');
    var nav = w.covers.length > 1 ? '<div class="cover-nav"><button type="button" data-dir="-1" aria-label="이전 이미지">←</button><button type="button" data-dir="1" aria-label="다음 이미지">→</button></div>' : '';
    return '<div class="case-cover"><div class="cover-track" tabindex="0" aria-label="' + esc(w.title) + ' 소개 이미지">' + imgs + '</div>' + nav + '</div>';
  }
  function side(w) {
    var l = w.lead;
    var bl = (w.builds || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var st = (w.stack || []).join(' · ');
    var roles = '<p class="roles3" aria-label="직접 한 일: 기획, 개발, 디자인">' + ['기획', '개발', '디자인'].map(function (r) { return '<span' + (l && l.role === r ? ' class="on"' : '') + '>' + r + '</span>'; }).join('') + '</p>';
    return roles + (l ? '<div class="lead"><h3>' + esc(l.title) + '</h3><p>' + esc(l.body) + '</p></div>' : '') +
      (bl ? '<div class="builds"><p class="builds-h">직접 만든 것</p><ul>' + bl + '</ul></div>' : '') +
      (st ? '<p class="stack-line">' + esc(st) + '</p>' : '');
  }

  function item(w) {
    var hasCover = !!(w.covers && w.covers.length);
    var body = (w.before || w.after)
      ? '<dl class="ba">' + (w.before ? '<div class="b"><dt>전에는</dt><dd>' + esc(w.before) + '</dd></div>' : '') + (w.after ? '<div class="a"><dt>이제는</dt><dd>' + esc(w.after) + '</dd></div>' : '') + '</dl>'
      : '<dl class="scqa">' + (w.q ? '<div class="q"><dt>질문</dt><dd>' + esc(w.q) + '</dd></div>' : '') + (w.a ? '<div class="a"><dt>답</dt><dd>' + esc(w.a) + '</dd></div>' : '') + '</dl>';
    return '<article class="case-item" id="' + esc(w.slug) + '">' + cover(w) +
      '<div class="case-copy"><div class="meta"><span class="tag' + (w.tagKind === 'live' ? ' live' : '') + '">' + esc(w.tag) + '</span><span>' + esc(w.date) + '</span></div>' +
      '<h2>' + esc(w.title) + '</h2><p class="what">' + esc(w.line) + '</p>' + (w.scale ? '<p class="scale">' + esc(w.scale) + '</p>' : '') + body +
      (hasCover ? '' : side(w)) +
      (w.url ? '<a class="go" href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.url.replace(/^https?:\/\//, '')) + ' 직접 열어 보기 ↗</a>' : '') +
      '</div>' + (hasCover
        ? '<div class="case-roles ' + esc(w.tint || 't-blue') + '">' + side(w) + '</div>'
        : '<div class="case-shots ' + esc(w.tint || 't-blue') + '">' + shots(w) + '</div>') + '</article>';
  }

  var GROUPS = [
    ['plan', '기획', '무엇을 만들지부터 같이 정해요', '모두 기획·개발·디자인을 직접 했고, 그중 기획이 특히 잘 보이는 작업이에요.'],
    ['dev', '개발', '화면부터 알림, 연동, 운영까지 직접 만들어요', '모두 기획·개발·디자인을 직접 했고, 그중 개발이 특히 잘 보이는 작업이에요.'],
    ['design', '디자인', '설명 없이도 쓰이는 화면을 그려요', '모두 기획·개발·디자인을 직접 했고, 그중 디자인이 특히 잘 보이는 작업이에요.']
  ];

  function slider(track, btns, step) {
    if (!track) return;
    var sync = function () {
      if (!btns.length) return;
      btns[0].disabled = track.scrollLeft < 4;
      btns[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () { track.scrollBy({ left: step(track) * Number(b.dataset.dir), behavior: 'smooth' }); });
    });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
  function wire(art) {
    slider(art.querySelector('.strip'), art.querySelectorAll('.strip-nav button'), function (t) { var f = t.querySelector('figure'); return f ? f.offsetWidth + 16 : 300; });
    slider(art.querySelector('.cover-track'), art.querySelectorAll('.cover-nav button'), function (t) { var a = t.querySelector('a'); return a ? a.offsetWidth + 16 : 600; });
  }

  fetch('/data/works.json').then(function (r) { return r.json(); }).then(function (d) {
    var works = (d.works || []).filter(function (w) { return !w.draft && w.group; });
    var html = '', idx = '';
    GROUPS.forEach(function (g) {
      var ws = works.filter(function (w) { return w.group === g[0]; });
      if (!ws.length) return;
      idx += '<a href="#g-' + g[0] + '"><b>' + g[1] + '</b><span>' + ws.length + '</span></a>';
      html += '<section class="work-group" id="g-' + g[0] + '"><header class="group-head"><span class="pill">' + g[1] + '</span><h2>' + esc(g[2]) + '</h2><p>' + esc(g[3]) + '</p></header>' + ws.map(item).join('') + '</section>';
    });
    if (index) index.innerHTML = idx;
    list.innerHTML = html;
    list.querySelectorAll('.case-item').forEach(wire);
    if (location.hash) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
  }).catch(function () { list.innerHTML = '<p style="text-align:center;color:var(--ink-2)">작업 목록을 불러오지 못했어요. 새로고침해 주세요.</p>'; });
})();
