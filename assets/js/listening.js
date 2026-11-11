/* 문의서: 앞에서 고른 일·쓴 한 줄 이어받기, 남은 칸 세기, 보내기 */
(function () {
  'use strict';
  var C = window.BIBI || {};
  var params = new URLSearchParams(location.search);
  var form = document.getElementById('intake');
  var err = document.getElementById('form-err');
  var NEED = ['idea', 'situation', 'name', 'contact', 'agree'];
  var LABEL = { idea: '귀찮은 일', situation: '일하는 곳', name: '부를 이름', contact: '답장 받을 곳', agree: '개인정보 동의' };

  document.getElementById('f-source').value = params.get('from') || 'direct';

  var PLAN = { auto: '반복 업무 자동화', attendance: '출퇴근·정산', poc: '창업팀 PoC·MVP' };
  var plan = PLAN[params.get('plan')];
  if (plan) {
    var r = form.querySelector('input[name="plan"][value="' + plan + '"]');
    if (r) { r.checked = true; document.getElementById('plan-hint').hidden = false; }
  }

  var idea = params.get('idea');
  if (!idea && params.get('from') === 'try') { try { idea = localStorage.getItem('bibi:idea'); } catch (e) {} }
  if (idea) {
    document.getElementById('f-idea').value = idea.slice(0, 500);
    document.getElementById('idea-hint').hidden = false;
  }

  /* 답장 방법에 맞춰 입력 예시 바꾸기 */
  var channel = document.getElementById('f-channel');
  var contact = document.getElementById('f-contact');
  var HOLD = { '이메일': 'name@example.com', '텔레그램': '@아이디', '전화번호': '010-0000-0000' };
  channel.addEventListener('change', function () { contact.placeholder = HOLD[channel.value] || ''; });

  function collect() {
    var fd = new FormData(form), data = {};
    fd.forEach(function (v, k) { data[k] = data[k] ? data[k] + ', ' + v : v; });
    return data;
  }
  function missing(data) { return NEED.filter(function (k) { return !String(data[k] || '').trim(); }); }

  /* 남은 필수 칸 */
  var leftText = document.getElementById('left-text');
  var meter = document.getElementById('meter');
  function update() {
    var miss = missing(collect());
    meter.style.width = Math.round((NEED.length - miss.length) / NEED.length * 100) + '%';
    leftText.textContent = miss.length ? '필수 ' + miss.length + '칸 남았어요' : '보낼 준비가 됐어요';
    if (!miss.length) err.textContent = '';
    form.querySelectorAll('.q-block.bad').forEach(function (b) { if (miss.indexOf(b.dataset.q) < 0) b.classList.remove('bad'); });
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = collect(); var miss = missing(data);
    if (miss.length) {
      miss.forEach(function (k) { var b = form.querySelector('[data-q="' + k + '"]'); if (b) b.classList.add('bad'); });
      err.textContent = LABEL[miss[0]] + ' 칸을 채워 주세요.';
      var first = form.querySelector('[data-q="' + miss[0] + '"]');
      if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); var f = first.querySelector('input,textarea'); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    err.textContent = '';
    data.submittedAt = new Date().toISOString();
    var btn = document.getElementById('submit'); btn.disabled = true; btn.textContent = '보내는 중…';
    var finish = function () {
      form.hidden = true;
      document.getElementById('done-line').textContent = (data.name || '') + '님의 문의서가 도착했어요';
      document.getElementById('done').hidden = false;
      window.scrollTo(0, 0);
      try { localStorage.removeItem('bibi:idea'); } catch (e) {}
      if (typeof window.gtag === 'function') window.gtag('event', 'form_submit', { plan: data.plan || '' });
    };
    if (!C.formEndpoint) {
      // 받는 서버가 아직 없으면 메일 앱으로 보낸다
      var body = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
      location.href = 'mailto:hello@bibiis.ai?subject=' + encodeURIComponent('[문의] ' + data.name) + '&body=' + encodeURIComponent(body);
      btn.disabled = false; btn.textContent = '보내기';
      return;
    }
    fetch(C.formEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(finish)
      .catch(function () { btn.disabled = false; btn.textContent = '보내기'; err.textContent = '보내지 못했어요. 잠시 뒤 다시 보내거나 hello@bibiis.ai로 보내 주세요.'; });
  });
})();
