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
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-track]'); if (a) track('cta_click', { id: a.dataset.track });
  });
  if (C.ga4) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.ga4; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', C.ga4);
  }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* ---------- 방금 끝난 일: 흘러가는 알림 피드 (예시) ---------- */
  var FEED_A = [
    ['sheet', 'S', '이번 달 알바 정산표가 완성됐어요', '구글 시트 · 방금'],
    ['bibi', 'b', '홀 직원 출근 확인 (09:02)', '매장 폰 · 1분 전'],
    ['slack', '#', '휴가 신청 1건이 결재 대기 중이에요', '슬랙 · 3분 전'],
    ['tg', 'T', '오늘 주문 정리 끝, 재고 부족 2개', '텔레그램 · 5분 전'],
    ['sheet', 'S', '어제 매출이 장부에 옮겨졌어요', '구글 시트 · 12분 전']
  ];
  var FEED_B = [
    ['slack', '#', '지각 기록 1건, 사장님 확인이 필요해요', '슬랙 · 8분 전'],
    ['kakao', 'K', '내일 예약 3건에 안내를 보냈어요', '알림톡 · 20분 전'],
    ['bibi', 'b', '현장 보고 영상이 오늘 작업과 맞춰졌어요', '알림 · 26분 전'],
    ['sheet', 'S', '주간 근무표가 직원별로 나뉘었어요', '구글 시트 · 40분 전'],
    ['tg', 'T', '새 문의 2건을 받아 시트에 정리했어요', '텔레그램 · 1시간 전']
  ];
  function fillFeed(id, items) {
    var track = document.getElementById(id); if (!track) return;
    var copies = reduceMotion ? 1 : 2;
    for (var c = 0; c < copies; c++) items.forEach(function (it) {
      var card = el('div', 'note-card'); if (c) card.setAttribute('aria-hidden', 'true');
      card.appendChild(el('span', 'ic ' + it[0], it[1]));
      var tx = el('span'); tx.appendChild(el('b', null, it[2])); tx.appendChild(el('small', null, it[3]));
      card.appendChild(tx); track.appendChild(card);
    });
  }
  fillFeed('feed-a', FEED_A); fillFeed('feed-b', FEED_B);

  /* ---------- 사장님 대화: 보이면 차례로 오고, 직접 답해 볼 수 있음 ---------- */
  var chatBody = document.getElementById('chat-body');
  var chatReply = document.getElementById('chat-reply');
  var chatStarted = false;
  function say(text, me, delay) {
    return new Promise(function (res) {
      if (reduceMotion || me) { setTimeout(function () { chatBody.appendChild(el('div', 'msg' + (me ? ' me' : ''), text)); res(); }, reduceMotion ? 0 : (me ? 120 : delay)); return; }
      var dots = el('div', 'msg typing', '•••');
      setTimeout(function () {
        chatBody.appendChild(dots);
        setTimeout(function () { dots.remove(); chatBody.appendChild(el('div', 'msg', text)); res(); }, 700);
      }, delay);
    });
  }
  function startChat() {
    if (chatStarted || !chatBody) return; chatStarted = true;
    say('이번 달 정산표 만들어 뒀어요. 확인할 기록은 1건이에요.', false, 300)
      .then(function () { return say('뭐가 이상한데?', true, 900); })
      .then(function () { return say('수요일 홀 직원 퇴근이 안 찍혔어요. 평소처럼 18시로 할까요?', false, 500); })
      .then(function () { chatReply.hidden = false; });
  }
  if (chatReply) chatReply.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    chatReply.hidden = true;
    var ok = b.dataset.reply === 'ok';
    say(b.textContent, true, 0)
      .then(function () { return say(ok ? '18시로 반영했어요. 정산표 보내 드릴게요 📄' : '17시로 고쳤어요. 고친 기록은 이력에 남겨 둘게요.', false, 300); })
      .then(function () { return say('다른 기록은 모두 평소와 같았어요. 이번 달 정산 끝!', false, 400); });
    track('chat_reply', { ok: ok });
  });
  if (chatBody) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { startChat(); cio.disconnect(); } }, { threshold: 0.4 });
      cio.observe(chatBody);
    } else startChat();
  }

  /* ---------- 직접 해 보기: 반복되는 일 한 줄 → 바뀌는 흐름 ---------- */
  var RECIPES = [
    { test: /출퇴근|근무|알바|급여|시급|정산|근태|지각/, tools: '쓰는 도구 · 매장 폰, 구글 시트, 메신저 알림',
      before: ['직원이 카톡으로 출근 보고', '사장님이 엑셀에 옮겨 적기', '월말에 시간 더하고 시급 곱하기', '틀린 곳 찾느라 다시 확인'],
      after: [['매장 폰에서 이름 한 번 누르기', '직원'], ['시트에 자동으로 쌓임', '자동'], ['이상한 기록만 메신저로 질문', '사장님'], ['월말 정산표 완성', '자동']] },
    { test: /주문|재고|발주|배송|송장|스마트스토어|쿠팡/, tools: '쓰는 도구 · 구글 시트, 슬랙 또는 텔레그램 알림',
      before: ['채널마다 주문 내역 내려받기', '엑셀에 붙여 넣고 합치기', '재고표와 하나씩 비교', '부족한 건 따로 메모'],
      after: [['주문이 들어오면 시트로 모임', '자동'], ['재고와 바로 맞춰 봄', '자동'], ['부족한 것만 알림', '담당자'], ['발주서 초안까지 준비', '자동']] },
    { test: /휴가|결재|연차|승인|품의|경비|영수증/, tools: '쓰는 도구 · 슬랙, 구글 시트',
      before: ['메신저로 휴가 요청', '팀장이 따로 확인', '인사 담당이 엑셀에 기록', '남은 연차 물어보면 다시 계산'],
      after: [['슬랙에서 버튼으로 신청', '직원'], ['팀장이 슬랙에서 바로 승인', '팀장'], ['기록과 남은 연차가 자동 반영', '자동']] },
    { test: /예약|안내|문자|리마인드|상담|방문/, tools: '쓰는 도구 · 구글 시트, 문자·알림톡',
      before: ['예약을 수첩이나 엑셀에 적기', '전날 한 명씩 확인 문자', '노쇼 확인하고 다시 연락'],
      after: [['예약이 시트에 모임', '자동'], ['전날 안내 메시지 자동 발송', '자동'], ['답이 없는 예약만 표시', '사장님']] },
    { test: /매출|장부|보고|리포트|정리|집계|회의록|요약/, tools: '쓰는 도구 · 구글 시트, 슬랙, AI 요약',
      before: ['여기저기서 숫자 모으기', '엑셀에 옮겨 붙이기', '보고용으로 다시 정리', '메신저로 공유'],
      after: [['데이터가 한 시트로 모임', '자동'], ['AI가 요약 초안 작성', '자동'], ['확인하고 보내기만', '담당자']] }
  ];
  var DEFAULT = { tools: '쓰는 도구 · 지금 쓰시는 시트·메신저 위에서',
    before: ['손으로 모으고', '옮겨 적고', '다시 확인하고', '사람에게 전달'],
    after: [['필요한 정보만 입력', '사람'], ['나머지는 자동으로 정리', '자동'], ['확인할 것만 알림', '사람']] };
  var tryForm = document.getElementById('try-form'), chore = document.getElementById('chore'), flow = document.getElementById('flow');
  function renderFlow(text) {
    text = text.replace(/\s+/g, ' ').trim(); if (!text) { chore.focus(); return; }
    var r = RECIPES.find(function (x) { return x.test.test(text); }) || DEFAULT;
    var b = document.getElementById('flow-before'), a = document.getElementById('flow-after');
    b.replaceChildren(); a.replaceChildren();
    r.before.forEach(function (s, i) { var li = el('li', null, s); li.style.setProperty('--i', i); b.appendChild(li); });
    r.after.forEach(function (s, i) { var li = el('li', null, s[0]); li.appendChild(el('small', null, s[1])); li.style.setProperty('--i', i + r.before.length); a.appendChild(li); });
    document.getElementById('flow-before-n').textContent = '손이 가는 단계 ' + r.before.length + '개';
    var human = r.after.filter(function (s) { return s[1] !== '자동'; }).length;
    document.getElementById('flow-after-n').textContent = '사람이 하는 단계 ' + human + '개';
    document.getElementById('flow-tools').textContent = r.tools;
    document.getElementById('flow-cta').href = '/listening/?plan=auto&from=try&idea=' + encodeURIComponent(text);
    flow.hidden = false;
    store.set('bibi:idea', text);
    track('try_flow', { kind: RECIPES.indexOf(r) });
  }
  if (tryForm) tryForm.addEventListener('submit', function (e) { e.preventDefault(); renderFlow(chore.value); });
  document.querySelectorAll('.chip[data-chore]').forEach(function (c) {
    c.addEventListener('click', function () { chore.value = c.dataset.chore; renderFlow(c.dataset.chore); });
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

  /* ---------- 작업 카드: data/works.json 한 곳에서 읽어 그리기 ---------- */
  // HTML에 적힌 카드는 JS가 꺼져 있거나 목록을 못 읽을 때 보이는 기본값이에요.
  function bindShots(scope) {
    scope.querySelectorAll('[data-shots]').forEach(function (box) {
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
  }
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function redraw(kind) {
    if (kind !== 'checkin') return '';
    return '<div class="redraw" role="img" aria-label="다시 그린 화면: 매장 QR을 찍고, 처음 한 번 본인을 등록하고, 매장 와이파이에서 출근 버튼을 누름">' +
      '<span class="cap">다시 그린 화면</span>' +
      '<span class="ph"><b>매장 QR</b><i class="qr"></i>찍어서 들어가기</span>' +
      '<span class="ph"><b>처음 한 번</b><i class="field on"></i><i class="field"></i>본인 등록</span>' +
      '<span class="ph"><b>출근</b><i class="go">출근</i><i class="wifi">매장 와이파이 ✓</i></span></div>';
  }
  function workCard(w) {
    var thumb;
    if (w.illustration) {
      thumb = redraw(w.illustration);
    } else if (w.shots && w.shots.length) {
      var imgs = w.shots.map(function (s, i) { return '<img' + (i ? '' : ' class="on"') + ' src="/assets/work/' + h(w.slug) + '/' + h(s.src) + '" alt="' + h(s.caption) + '" loading="lazy">'; }).join('');
      var dots = w.shots.length > 1 ? '<span class="dots" role="group" aria-label="화면 넘기기">' + w.shots.map(function (s, i) { return '<button type="button" aria-label="' + (i + 1) + '번 화면" aria-pressed="' + (i === 0) + '"></button>'; }).join('') + '</span>' : '';
      thumb = '<div class="shots" data-shots><span class="frames">' + imgs + '</span>' + dots + '</div>';
    } else {
      thumb = '<div class="locked">🔒 ' + h(w.locked || '화면 비공개') + '</div>';
    }
    return '<article class="work" data-reveal><div class="work-thumb ' + h(w.tint || 't-blue') + '">' + thumb + '</div>' +
      '<div class="work-body"><span class="tag' + (w.tagKind === 'live' ? ' live' : '') + '">' + h(w.tag) + '</span>' +
      '<h3><a href="/work/#' + h(w.slug) + '">' + h(w.title) + '</a></h3><p class="what">' + h(w.line) + '</p>' +
      '<div class="qa"><p class="q">Q. ' + h(w.q) + '</p><p class="a">A. ' + h(w.cardA || w.a) + '</p></div></div></article>';
  }
  var worksBox = document.querySelector('#work .works');
  var smallsBox = document.querySelector('#work .smalls');
  bindShots(document);
  if (worksBox && window.fetch) {
    fetch('/data/works.json').then(function (r) { return r.json(); }).then(function (d) {
      var all = d.works || [];
      var cards = all.filter(function (w) { return w.home && !w.feature; }).slice(0, 3);
      if (cards.length) {
        worksBox.innerHTML = cards.map(workCard).join('');
        bindShots(worksBox);
        worksBox.querySelectorAll('[data-reveal]').forEach(function (n) { n.classList.add('is-in'); });
      }
      var smalls = all.filter(function (w) { return w.small; });
      if (smallsBox && smalls.length) {
        smallsBox.innerHTML = '<span>작은 AI 도구도 만들어요</span>' + smalls.map(function (w) {
          var label = h(w.title) + (w.smallLine ? ' · ' + h(w.smallLine) : '');
          return w.draft ? '<span class="chip-s">' + label + '</span>' : '<a href="/work/#' + h(w.slug) + '">' + label + '</a>';
        }).join('');
      }
    }).catch(function () {});
  }

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
    if (on) document.getElementById('ladder').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
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
