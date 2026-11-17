/* 첫 화면 배경: 왼쪽 아래에서 번지는 주황 디더 격자 (피그마 셰이더 시안 1안)
   - 4px 격자로 작게 그린 뒤 키워서 붙이므로 가벼움, 30fps 제한
   - 첫 화면이 안 보이거나 탭이 숨겨지면 멈춤, 움직임 줄이기면 정지 화면 한 장만 그림 */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || !window.HTMLCanvasElement) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'hero-fx';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var off = document.createElement('canvas'), octx = off.getContext('2d');

  var CELL = 4, RADIUS = 0.62, FALLOFF = 1.5, INTENSITY = 0.75;
  var BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21]
    .map(function (v) { return (v + 0.5) / 64; });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var W = 0, H = 0, dpr = 1, visible = true, running = false, last = 0, colors = null;

  function hex(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', '');
    if (v.length === 3) v = v.replace(/./g, '$&$&');
    var n = parseInt(v, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function readColors() {
    // 점 색은 주황을 바탕색 쪽으로 조금 섞어서 덜 튀게 (다크 모드는 더 많이 섞음)
    var base = hex('--bg'), brand = hex('--brand');
    var dark = (base[0] + base[1] + base[2]) / 3 < 128, k = dark ? 0.55 : 0.8;
    colors = { base: base, ink: brand.map(function (c, i) { return Math.round(base[i] + (c - base[i]) * k); }) };
  }
  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  function draw(time) {
    if (!W || !H) return;
    var t = time * 0.001, moving = !reduce.matches;
    var cx = -0.04 * W, cy = H, rad = RADIUS * Math.min(W, H);
    if (moving) { cx += Math.cos(t * 0.35) * 24; cy += Math.sin(t * 0.5) * 18; rad *= 1 + 0.08 * Math.sin(t * 0.785); }
    var cw = Math.ceil(W / CELL), ch = Math.ceil(H / CELL);
    if (off.width !== cw || off.height !== ch) { off.width = cw; off.height = ch; }
    var img = octx.createImageData(cw, ch), d = img.data, base = colors.base, ink = colors.ink, i = 0;
    for (var y = 0; y < ch; y++) {
      for (var x = 0; x < cw; x++, i += 4) {
        var g = 1 - Math.hypot((x + 0.5) * CELL - cx, (y + 0.5) * CELL - cy) / rad;
        var on = g > 0 && Math.pow(g, FALLOFF) * INTENSITY > BAYER[(y & 7) * 8 + (x & 7)];
        var c = on ? ink : base;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = on ? 255 : 0;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, cw * CELL * dpr, ch * CELL * dpr);
  }
  function loop(time) {
    if (!visible || reduce.matches || document.hidden) { running = false; return; }
    if (time - last > 33) { last = time; draw(time); }
    requestAnimationFrame(loop);
  }
  function kick() {
    if (running || !visible || reduce.matches || document.hidden) return;
    running = true; requestAnimationFrame(loop);
  }
  function redraw() { readColors(); draw(performance.now()); }

  readColors(); resize(); draw(performance.now()); kick();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }).observe(hero);
  if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); draw(performance.now()); }).observe(hero);
  else window.addEventListener('resize', function () { resize(); draw(performance.now()); });
  document.addEventListener('visibilitychange', kick);
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  var scheme = window.matchMedia('(prefers-color-scheme: dark)');
  if (scheme.addEventListener) { scheme.addEventListener('change', redraw); reduce.addEventListener('change', function () { draw(performance.now()); kick(); }); }
})();
