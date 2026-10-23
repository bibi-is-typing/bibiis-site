(function () {
  'use strict';
  var C = window.BIBI || {};
  var params = new URLSearchParams(location.search);
  var form = document.getElementById('intake');
  var err = document.getElementById('form-err');
  var labels = { name: '1번 이름', contact: '2번 답장 받을 곳', situation: '3번 지금 상황', audience: '4번 설득할 사람', action: '5번 해 줬으면 하는 일', idea: '6번 아이디어', when: '8번 언제까지', budget: '9번 예산', agree: '개인정보 동의' };

  document.getElementById('f-source').value = params.get('from') || 'direct';

  var saved = null; try { saved = localStorage.getItem('bibi:idea'); } catch (e) {}
  if (saved && params.get('from') === 'try') {
    document.getElementById('f-idea').value = saved;
    document.getElementById('idea-hint').hidden = false;
  }

  function collect() {
    var fd = new FormData(form), data = {};
    fd.forEach(function (v, k) { data[k] = data[k] ? data[k] + ', ' + v : v; });
    return data;
  }
  function missing(data) {
    var need = ['name', 'contact', 'situation', 'audience', 'action', 'idea', 'when', 'budget', 'agree'];
    return need.filter(function (k) { return !String(data[k] || '').trim(); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = collect(); var miss = missing(data);
    if (miss.length) { err.textContent = labels[miss[0]] + ' 칸을 채워 주세요.'; return; }
    err.textContent = '';
    data.submittedAt = new Date().toISOString();
    var btn = document.getElementById('submit'); btn.disabled = true; btn.textContent = '보내는 중…';
    var finish = function () {
      form.hidden = true; document.getElementById('form-wrap').hidden = true;
      document.getElementById('done').hidden = false; window.scrollTo(0, 0);
      try { localStorage.removeItem('bibi:idea'); } catch (e) {}
    };
    if (!C.formEndpoint) {
      // 폼 서버가 아직 없으면 메일 앱으로 보낸다
      var body = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
      location.href = 'mailto:hello@bibiis.ai?subject=' + encodeURIComponent('[상담] ' + data.name) + '&body=' + encodeURIComponent(body);
      btn.disabled = false; btn.textContent = '보내기';
      return;
    }
    fetch(C.formEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(finish)
      .catch(function () { btn.disabled = false; btn.textContent = '보내기'; err.textContent = '보내지 못했습니다. 잠시 뒤 다시 시도하거나 hello@bibiis.ai로 보내 주세요.'; });
  });
})();
