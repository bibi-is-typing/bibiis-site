// 첫 화면 '자동 정리' 데모. 서버·AI 없이 브라우저 안에서 사장님이 받는 메시지를 표로 바꿔요.
// window.BibiTidy.parse(kind, text) → { title, columns, rows, checks, reply }
// kind: 'work'(알바 근무) | 'booking'(예약) | 'order'(주문)
(function (root) {
  'use strict';

  var NUM = { '한': 1, '하나': 1, '두': 2, '둘': 2, '세': 3, '셋': 3, '네': 4, '넷': 4, '다섯': 5, '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10 };
  var DAY_RE = /(그제|어제|오늘|내일|모레|[월화수목금토일]요일|\d{1,2}월\s*\d{1,2}일|\d{1,2}일(?!\s*(?:동안|간)))/;
  var STOP = /^([월화수목금토일]요일|사장님|사장|안녕|오늘|어제|내일|모레|그제|저는|제가|이번|다음|그리고|근데|혹시|아|네|감사)/;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function num(s) { return /^\d+$/.test(s) ? parseInt(s, 10) : (NUM[s] || 0); }

  // 문장 조각에서 시각들을 순서대로 뽑는다. bias: 'work' | 'evening'
  function times(seg, bias) {
    var out = [], re = /(오전|오후|아침|저녁|밤|낮|새벽)?\s*(\d{1,2})(?:\s*시\s*(반|\d{1,2}\s*분)?|:(\d{2}))/g, m;
    while ((m = re.exec(seg))) {
      var h = parseInt(m[2], 10), min = 0;
      if (m[3]) min = m[3] === '반' ? 30 : parseInt(m[3], 10);
      if (m[4]) min = parseInt(m[4], 10);
      if (h > 24 || min > 59) continue;
      var ap = m[1] || '';
      if (/오후|저녁|밤/.test(ap) && h < 12) h += 12;
      else if (/낮/.test(ap) && h < 7) h += 12;
      else if (!/오전|아침|새벽/.test(ap)) {
        if (bias === 'evening' && h >= 1 && h <= 9) h += 12;
        if (bias === 'work' && h >= 1 && h <= 7) h += 12;
      }
      out.push({ t: pad(h) + ':' + pad(min), h: h + min / 60, i: m.index });
    }
    return out;
  }

  function dayOf(seg) { var m = seg.match(DAY_RE); return m ? m[1].replace(/\s+/g, '').replace(/(\d+월)(\d+일)/, '$1 $2') : ''; }

  // "10~4", "10시~4" 처럼 '시'가 빠진 범위를 채워 준다
  function norm(text) {
    return text.replace(/(\d{1,2})(시(?:\s*반)?)?\s*[~\-]\s*(\d{1,2})(?![\d시:])/g, function (_, a, b, c) { return a + (b || '시') + '~' + c + '시'; });
  }

  function splitSegs(text) {
    return text.replace(/\r/g, '').split(/\n+|(?<=[.!?。ㅠㅜ]{1})\s+|(?:,\s*|\s+)(?=그리고|근데|또\s|아\s)|,\s*(?=(?:그제|어제|오늘|내일|모레|[월화수목금토일]요일))/)
      .map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* ---------- 알바 근무 ---------- */
  function nameOf(text) {
    var pats = [
      /(?:^|\s)(?:저|전|나)\s*([가-힣]{2,4}?)(?:인데요|인데|이에요|예요|입니다|이요|요)(?![가-힣])/,
      /[-–—]\s*([가-힣]{2,4})\s*$/,
      /이름은?\s*:?\s*([가-힣]{2,4}?)(?:이고|고|이에요|예요|입니다|$|\s)/,
      /(?:^|\n)\s*([가-힣]{2,4}?)(?:이에요|예요|입니다)[!.~\s]/,
      /(?:^|\n)\s*([가-힣]{2,4})\s+(?:그제|어제|오늘|내일|[월화수목금토일]요일|\d)/
    ];
    for (var i = 0; i < pats.length; i++) {
      var m = text.match(pats[i]);
      if (m && !STOP.test(m[1])) return m[1].replace(/(씨|님)$/, '');
    }
    return '';
  }

  function parseWork(text) {
    text = norm(text);
    var name = nameOf(text), rows = [], byDay = {}, lastDay = '';
    splitSegs(text).forEach(function (seg) {
      var d = dayOf(seg) || lastDay; if (dayOf(seg)) lastDay = d;
      var lineName = nameOf(seg) || name;
      var key = lineName + '|' + d;
      var row = byDay[key];
      var get = function () { if (!row) { row = byDay[key] = { name: lineName, day: d, inT: '', outT: '', memo: [] }; rows.push(row); } return row; };
      if (/못\s*(나와|나가|가|와|올|갈|나올)|쉴게|쉬어야|쉬겠|빠질|빠져야|결근|안\s*나와|안\s*나갈|휴무/.test(seg)) { get().memo.push('결근'); return; }
      var ts = times(seg, 'work');
      if (!ts.length) { if (/늦|지각/.test(seg)) get().memo.push('지각'); return; }
      var r = get();
      var future = /할게|갈게|할\s*거|갈\s*거|예정|하려고|할\s*것|일\s*거/.test(seg);
      if (ts.length >= 2) { r.inT = ts[0].t; r.outT = ts[1].t; }
      else {
        var t = ts[0], after = seg.slice(t.i, t.i + 14), before = seg.slice(Math.max(0, t.i - 8), t.i);
        var isOut = /퇴근|갔|가요|끝|마치|나갈|나갔|까지|들어갈/.test(after) || /퇴근/.test(before);
        var isIn = /출근|왔|와서|나왔|도착|들어왔|부터|시작/.test(after) || /출근/.test(before);
        if (isOut && !isIn) r.outT = t.t; else if (isIn && !isOut) r.inT = t.t;
        else if (!r.inT) r.inT = t.t; else r.outT = t.t;
      }
      if (future && r.outT) r.memo.push('퇴근은 예정');
      if (/늦|지각/.test(seg)) r.memo.push('지각');
    });
    var absent = [], noOut = [], noIn = [], planned = [], noDay = false;
    rows.forEach(function (r) {
      var d = r.day || '날짜 없는 날';
      if (r.memo.indexOf('결근') > -1) absent.push(d);
      else if (r.inT && !r.outT) noOut.push(d);
      else if (r.outT && !r.inT) noIn.push(d);
      else if (r.memo.indexOf('퇴근은 예정') > -1) planned.push(d);
      if (!r.day && (r.inT || r.outT)) noDay = true;
    });
    var checks = [];
    if (rows.length && !rows[0].name) checks.push('누가 보낸 건지 이름이 없어요');
    absent.forEach(function (d) { checks.push(d + ' 대신 나올 사람 필요'); });
    noOut.forEach(function (d) { checks.push(d + ' 퇴근 시간이 없어요'); });
    noIn.forEach(function (d) { checks.push(d + ' 출근 시간이 없어요'); });
    planned.forEach(function (d) { checks.push(d + ' 퇴근은 아직 예정이에요'); });
    if (noDay) checks.push('날짜가 없는 기록이 있어요');
    var out = rows.map(function (r) {
      var memo = r.memo.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
      return [r.name, r.day, r.inT, r.outT, memo];
    });
    var reply;
    if (!out.length) reply = '근무 시간이 보이지 않아요. "어제 10시~4시 했어요"처럼 넣어 보세요.';
    else {
      var who = rows[0].name ? rows[0].name + ' 님 ' : '';
      var worked = rows.filter(function (r) { return r.inT || r.outT; }).length;
      reply = (worked ? who + '근무 ' + worked + '건을 기록했어요.' : '');
      if (absent.length) reply += ' ' + absent[0] + '에 ' + (rows[0].name ? rows[0].name + ' 님이 ' : '') + '빠진대요. 대신 나올 사람을 찾아 둘까요?';
      else if (noOut.length) reply += ' ' + noOut[0] + ' 퇴근 시간이 없어요. 퇴근할 때 물어볼까요?';
      else if (noIn.length) reply += ' ' + noIn[0] + ' 출근 시간이 빠져 있어요. 몇 시에 왔는지 물어볼까요?';
      else if (planned.length) reply += ' ' + planned[0] + ' 퇴근은 예정이라, 끝나면 다시 확인할게요.';
      else reply += ' 확인할 건 없어요.';
      reply = reply.trim();
    }
    return { title: '출퇴근 기록', columns: ['이름', '날짜', '출근', '퇴근', '메모'], rows: out, checks: checks.slice(0, 3), reply: reply };
  }

  /* ---------- 예약 ---------- */
  function parseBooking(text) {
    text = norm(text);
    var day = dayOf(text);
    var ts = times(text, 'evening');
    var pm = text.match(/(\d{1,2}|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(?:명|분|인)(?![가-힣])/);
    var people = pm ? String(num(pm[1])) : '';
    var nm = text.match(/(?:이름은?|예약자(?:는|명은?)?)\s*:?\s*([가-힣]{2,4}?)(?:이고|고|이에요|예요|입니다|으로|로|,|\s|$)/) || text.match(/(?:저는?|전)\s*([가-힣]{2,4}?)(?:이에요|예요|입니다)/) || text.match(/([가-힣]{2,4})(?:으로|로)\s*예약/);
    var name = nm && !STOP.test(nm[1]) ? nm[1] : '';
    var ph = text.match(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/);
    var phone = ph ? ph[0].replace(/[.\s]/g, '-') : '';
    var req = [];
    var KEYS = [['아기 의자', /아기\s*의자|유아\s*의자|애기\s*의자/], ['창가 자리', /창가/], ['룸', /룸|개별실|프라이빗/], ['주차', /주차/], ['생일', /생일/], ['케이크 보관', /케이크/], ['알레르기', /알레르기|알러지/], ['반려견 동반', /강아지|반려견|애견/], ['휠체어', /휠체어/], ['콜키지', /콜키지/]];
    KEYS.forEach(function (k) {
      var m = text.match(new RegExp('(?:' + k[1].source + ')\\s*(하나|한\\s*개|두\\s*개|\\d+\\s*개)?'));
      if (m) req.push(k[0] + (m[1] ? ' ' + (num(m[1].replace(/\s*개/, '')) || parseInt(m[1], 10) || 1) + '개' : ''));
    });
    if (!req.length) splitSegs(text).forEach(function (s) {
      if (/부탁|해\s*주세요|챙겨/.test(s) && !/예약|\d\s*(?:명|시)/.test(s)) {
        var q = s.replace(/^(?:그리고|혹시|아)\s+/, '').replace(/\s*(?:부탁(?:드려요|드립니다|해요)?|해\s*주세요|챙겨\s*주세요)[!.~?\s]*$/, '').replace(/(를|을)$/, '');
        if (q && q.length <= 24) req.push(q);
      }
    });
    var row = [day, ts.length ? ts[0].t : '', people, name, phone, req.join(', ')];
    var checks = [];
    if (!day) checks.push('날짜를 물어봐야 해요');
    if (!ts.length) checks.push('시간을 물어봐야 해요');
    if (!people) checks.push('인원을 물어봐야 해요');
    if (!phone) checks.push('연락처를 물어봐야 해요');
    if (!checks.length) checks.push((day + ' ' + row[1]) + ' 자리 확인 필요');
    var any = row.some(function (v) { return v; });
    var reply = !any ? '예약 내용이 보이지 않아요. "내일 7시 4명"처럼 넣어 보세요.'
      : checks.length === 1 && /자리 확인/.test(checks[0]) ? '예약 한 건을 정리했어요. ' + day + ' ' + row[1] + '에 ' + people + '명 자리가 있으면 확정 문자를 보낼까요?'
      : '예약 한 건을 정리했어요. ' + checks[0].replace('물어봐야 해요', '') + '물어보는 답장을 써 둘까요?';
    return { title: '예약표', columns: ['날짜', '시간', '인원', '이름', '연락처', '요청'], rows: any ? [row] : [], checks: checks.slice(0, 3), reply: reply };
  }

  /* ---------- 주문 ---------- */
  var MENU = [
    ['아이스 아메리카노', /아아|아이스\s*아메리카노|아이스\s*아메/], ['아메리카노', /뜨아|아메리카노|아메(?!리)/],
    ['바닐라라떼', /바닐라\s*라떼/], ['녹차라떼', /녹차\s*라떼|말차\s*라떼/], ['초코라떼', /초코\s*라떼|핫초코/],
    ['카페라떼', /(?:카페\s*)?라떼/], ['카푸치노', /카푸치노/], ['콜드브루', /콜드\s*브루/], ['에스프레소', /에스프레소/],
    ['밀크티', /밀크티/], ['레몬에이드', /레몬\s*에이드/], ['자몽에이드', /자몽\s*에이드/], ['스무디', /스무디/],
    ['크로플', /크로플/], ['케이크', /케이크/], ['쿠키', /쿠키/], ['베이글', /베이글/], ['샌드위치', /샌드위치/],
    ['크루아상', /크루아상|크로와상/], ['마들렌', /마들렌/], ['스콘', /스콘/], ['떡볶이', /떡볶이/], ['김밥', /김밥/], ['치킨', /치킨/], ['피자', /피자/]
  ];
  var OPTS = [['디카페인', /디카페인|디카프/], ['샷 추가', /샷\s*추가/], ['연하게', /연하게/], ['시럽 추가', /시럽/], ['얼음 적게', /얼음\s*적게/], ['오트밀크', /오트/], ['두유', /두유/], ['따뜻하게', /따뜻하게|핫으로/]];
  var CNT = '(\\d+|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|하나|둘|셋|넷)\\s*(?:잔|개|조각|판|인분|줄|마리|세트)?(?![는은만])';

  function parseOrder(text) {
    text = norm(text);
    var items = [], used = [];
    MENU.forEach(function (mn) {
      var re = new RegExp('(' + mn[1].source + ')\\s*' + CNT, 'g'), m, hit = false;
      while ((m = re.exec(text))) {
        if (used.some(function (u) { return m.index >= u[0] && m.index < u[1]; })) continue;
        used.push([m.index, m.index + m[0].length]); hit = true;
        items.push({ menu: mn[0], n: num(m[m.length - 1]) || 1, opt: '', at: m.index });
      }
      if (!hit) {
        var m2 = mn[1].exec(text);
        if (m2 && !used.some(function (u) { return m2.index >= u[0] && m2.index < u[1]; }) && !/(하나|한\s*잔|한\s*개)\s*(?:는|은)/.test(text.slice(m2.index + m2[0].length, m2.index + m2[0].length + 6))) {
          used.push([m2.index, m2.index + m2[0].length]); items.push({ menu: mn[0], n: 1, opt: '', at: m2.index });
        }
      }
    });
    items.sort(function (a, b) { return a.at - b.at; });
    // "라떼 하나는 디카페인" → 한 잔을 떼어 옵션 줄로
    splitSegs(text).forEach(function (seg) {
      OPTS.forEach(function (op) {
        if (!op[1].test(seg)) return;
        var target = null;
        MENU.forEach(function (mn) { if (!target && mn[1].test(seg)) target = items.filter(function (it) { return it.menu === mn[0] && !it.opt; })[0]; });
        if (!target) target = items.filter(function (it) { return !it.opt; }).slice(-1)[0];
        if (!target) return;
        var one = /(하나|한\s*잔|한\s*개|1\s*잔)\s*(?:는|은|만)/.test(seg);
        if (one && target.n > 1) { target.n -= 1; items.splice(items.indexOf(target) + 1, 0, { menu: target.menu, n: 1, opt: op[0], at: target.at + 0.5 }); }
        else target.opt = target.opt ? target.opt + ', ' + op[0] : op[0];
      });
    });
    var how = /배달/.test(text) ? '배달' : /매장|먹고\s*갈|먹고\s*가/.test(text) ? '매장' : /픽업|가지러|찾으러|포장|테이크\s*아웃|들를|들러/.test(text) ? '픽업' : '';
    var ts = times(text, 'evening'), t = ts.length ? ts[0].t : '';
    var rows = items.map(function (it) { return [it.menu, String(it.n), it.opt, how, t]; });
    var checks = [];
    if (rows.length && !t) checks.push((how || '받는') + ' 시간을 물어봐야 해요');
    if (rows.length && !how) checks.push('픽업인지 배달인지 물어봐야 해요');
    var total = items.reduce(function (s, it) { return s + it.n; }, 0);
    var reply = !rows.length ? '메뉴가 보이지 않아요. "라떼 2잔, 아아 1잔"처럼 넣어 보세요.'
      : '주문 ' + total + '개를 정리했어요.' + (checks.length ? ' ' + checks[0].replace('물어봐야 해요', '물어볼까요?') : t ? ' ' + t + (how ? ' ' + how : '') + '에 맞춰 준비하면 돼요.' : '');
    return { title: '주문 정리', columns: ['메뉴', '수량', '옵션', '받는 방법', '시간'], rows: rows, checks: checks, reply: reply };
  }

  /* ---------- 휴가 신청 (회사) ---------- */
  function parseLeave(text) {
    var nm = text.match(/([가-힣]{2,4})\s*(?:드림|올림)/) || text.match(/([가-힣]{2,4})(?:입니다|이에요|예요)/) || text.match(/(?:저는?|전)\s*([가-힣]{2,4}?)(?:인데요|이고|이에요|예요)/);
    var name = nm && !STOP.test(nm[1]) && !/팀장|부장|과장|대리|실장|대표/.test(nm[1]) ? nm[1] : '';
    var rm = text.match(/사유(?:는|은)?\s*:?\s*([^.!?\n]{2,24}?)(?:이에요|예요|입니다|이요|요)?[.!?\n]|사유(?:는|은)?\s*:?\s*([^.!?\n]{2,24})$/);
    var reason = rm ? (rm[1] || rm[2] || '').trim() : '';
    var rows = [];
    splitSegs(text.replace(/,\s*/g, '\n')).forEach(function (seg) {
      var type = /오전\s*반차/.test(seg) ? '오전 반차' : /오후\s*반차/.test(seg) ? '오후 반차' : /반차/.test(seg) ? '반차' : /병가|아파서/.test(seg) ? '병가' : /경조|결혼|장례/.test(seg) ? '경조 휴가' : /연차|휴가|쉬겠|쉴게/.test(seg) ? '연차' : '';
      if (!type) return;
      var d = dayOf(seg);
      var rng = seg.match(/(\d{1,2}월\s*\d{1,2}일|\d{1,2}일)\s*(?:부터|~|-)\s*(\d{1,2}월\s*\d{1,2}일|\d{1,2}일)/);
      var days = /반차/.test(type) ? '0.5' : '1';
      var nd = seg.match(/(\d+|하루|이틀|사흘)\s*(?:일간|일 동안|일)?\s*(?:연차|휴가)/);
      if (rng) { d = rng[1].replace(/\s+/g, ' ') + '~' + rng[2].replace(/\s+/g, ' '); var a = parseInt(rng[1].replace(/.*월\s*/, ''), 10), b = parseInt(rng[2].replace(/.*월\s*/, ''), 10); if (b >= a) days = String(b - a + 1); }
      else if (nd && /이틀/.test(nd[1])) days = '2'; else if (nd && /사흘/.test(nd[1])) days = '3'; else if (nd && /^\d+$/.test(nd[1]) && !/월/.test(seg.slice(nd.index - 2, nd.index))) { /* 날짜 숫자와 겹치면 무시 */ }
      rows.push([name, type, d, days, reason]);
    });
    var checks = [];
    if (rows.length && !name) checks.push('신청한 사람 이름이 없어요');
    rows.forEach(function (r) { if (!r[2]) checks.push(r[1] + ' 날짜가 없어요'); });
    if (rows.length && !reason && !rows.every(function (r) { return r[1] === '병가'; })) checks.push('사유가 없어요');
    var total = rows.reduce(function (s, r) { return s + parseFloat(r[3] || 0); }, 0);
    var reply = !rows.length ? '휴가 신청이 보이지 않아요. "12월 1일 연차 쓸게요"처럼 넣어 보세요.'
      : (name ? name + ' 님 ' : '') + '휴가 ' + rows.length + '건(' + total + '일)을 정리했어요. ' + (checks.length ? checks[0].replace(/요$/, '') + '요. 물어볼까요?' : '팀장님께 결재 요청을 보낼까요?');
    return { title: '휴가 결재', columns: ['신청자', '종류', '날짜', '일수', '사유'], rows: rows, checks: checks.slice(0, 3), reply: reply };
  }

  root.BibiTidy = {
    parse: function (kind, text) {
      text = String(text || '').slice(0, 400);
      if (kind === 'booking') return parseBooking(text);
      if (kind === 'order') return parseOrder(text);
      if (kind === 'leave') return parseLeave(text);
      return parseWork(text);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
