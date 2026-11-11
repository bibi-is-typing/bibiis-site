/* 하위 페이지 공통: 밝기 전환, 바깥 링크, 클릭 기록 */
(function () {
  'use strict';
  var C = window.BIBI || {};
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', function () {
    var dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('bibi:theme', root.dataset.theme); } catch (e) {}
  });
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = (C.links || {})[a.dataset.link];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; }
  });
  if (C.ga4) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.ga4; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', C.ga4);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-track]');
    if (a && typeof window.gtag === 'function') window.gtag('event', 'cta_click', { id: a.dataset.track });
  });
})();
