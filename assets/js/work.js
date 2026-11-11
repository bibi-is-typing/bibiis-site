// 작업 목록은 data/works.json 한 곳에서 관리합니다.
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var img = function (w, s, lazy) { return '<img src="/assets/work/' + esc(w.slug) + '/' + esc(s.src) + '" alt="' + esc(s.caption) + '"' + (lazy ? ' loading="lazy"' : '') + ' class="' + (s.kind === 'mobile' ? 'is-mobile' : 'is-pc') + '">'; };
  var frame = function (w, s, lazy) {
    return s.kind === 'mobile'
      ? '<span class="dev-phone"><span class="dev-notch" aria-hidden="true"></span>' + img(w, s, lazy) + '</span>'
      : '<span class="dev-browser"><span class="dev-bar" aria-hidden="true"><i></i><i></i><i></i></span>' + img(w, s, lazy) + '</span>';
  };
  var tag = function (w) { return w.tag ? '<i class="tag ' + esc(w.tagKind || 'own') + '">' + esc(w.tag) + '</i>' : ''; };

  function card(w) {
    var s = w.shots && w.shots[0];
    return '<a class="work-card" href="/work/#' + esc(w.slug) + '">' +
      '<span class="work-thumb' + (s && s.kind === 'mobile' ? ' is-mobile' : '') + '">' + (s ? frame(w, s, true) : '') + '</span>' +
      '<span class="work-meta"><span class="d">' + esc(w.date) + '</span>' + tag(w) + '</span>' +
      '<b class="work-title">' + esc(w.title) + '</b><span class="work-line">' + esc(w.line) + '</span></a>';
  }

  function detail(w) {
    var shots = (w.shots || []).map(function (s) { return '<figure class="' + (s.kind === 'mobile' ? 'is-mobile' : 'is-pc') + '">' + frame(w, s, true) + '<figcaption>' + esc(s.caption) + '</figcaption></figure>'; }).join('');
    return '<article class="work-item" id="' + esc(w.slug) + '">' +
      '<header><span class="work-meta"><span class="d">' + esc(w.date) + '</span>' + tag(w) + '</span>' +
      '<h2>' + esc(w.title) + '</h2><p class="work-line">' + esc(w.line) + '</p></header>' +
      '<div class="work-text"><p>' + esc(w.problem) + '</p><p>' + esc(w.built) + '</p>' +
      '<p class="work-stack">' + (w.stack || []).map(esc).join(' · ') + '</p>' +
      (w.url ? '<a class="work-link" href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.url.replace(/^https?:\/\//, '')) + ' ↗</a>' : '') + '</div>' +
      '<div class="work-shots">' + shots + '</div></article>';
  }

  var home = document.getElementById('work-cards');
  var list = document.getElementById('work-list');
  if (!home && !list) return;
  fetch('/data/works.json').then(function (r) { return r.json(); }).then(function (d) {
    var works = d.works || [];
    if (home) home.innerHTML = works.filter(function (w) { return w.home; }).slice(0, 4).map(card).join('');
    if (list) {
      var nav = document.getElementById('work-nav');
      if (nav) nav.innerHTML = works.map(card).join('');
      list.innerHTML = works.map(detail).join('');
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    }
  }).catch(function () { if (home) home.innerHTML = '<p class="muted">작업 목록을 불러오지 못했습니다. <a href="/work/">작업 페이지</a>에서 보세요.</p>'; });
})();
