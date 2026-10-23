/* bibi is building — "만들어 보기" mini-site generator.
   The idea text picks an industry; the industry decides copy, tone, palette and layout.
   The same idea always renders the same page (seeded by a hash of the text). */
(function () {
  'use strict';

  var CATS = [
    { id: 'pet', font: { family: 'Jua', weight: 400, q: 'Jua' }, label: '반려동물', test: /반려|강아지|고양이|펫|산책|애견|애묘|댕댕/,
      voice: '다정하고 포근하게', look: '둥근 모서리 · 크림톤 · 부드러운 그림자', layout: 'split',
      tone: { r: 22, w: 800, ls: '-0.02em' },
      palettes: [
        { bg: '#FFF8F0', fg: '#3B2A20', ac: '#C2410C', ac2: '#FDBA74', card: '#FFFFFF', on: '#FFFFFF' },
        { bg: '#F3F7F0', fg: '#1F3326', ac: '#2E7D4F', ac2: '#F4B183', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['산책메이트', '포포산책', '발도장', '멍멍로드'],
      badge: '오픈 준비 중',
      heads: [['바쁜 날에도,\n산책은 거르지 않게.', '검증된 동네 산책 메이트가 우리 아이와 함께 걷습니다.'],
              ['우리 아이 산책,\n믿고 맡기는 이웃.', '신원 확인을 마친 이웃만 연결합니다.']],
      cta: '첫 산책 무료로 신청',
      feats: [['신원 확인 완료', '모든 메이트가 인증을 거칩니다'], ['실시간 위치 공유', '지금 어디쯤인지 바로 확인'], ['산책 리포트', '끝나면 사진과 기록이 도착']],
      stats: [['1,240명', '대기 신청'], ['4.9', '보호자 만족도'], ['10분', '평균 매칭']],
      rows: [['초코 · 3살', '산책 중'], ['보리 · 5살', '매칭 완료'], ['콩이 · 1살', '리포트 도착']] },

    { id: 'fit', font: { family: 'Black Han Sans', weight: 400, q: 'Black+Han+Sans' }, label: '운동·헬스', test: /헬스|운동|요가|필라테스|PT|러닝|다이어트|체육|크로스핏|짐/,
      voice: '에너지 있고 단호하게', look: '각진 모서리 · 강한 대비 · 기울인 굵은 제목', layout: 'center',
      tone: { r: 3, w: 900, ls: '-0.045em', italic: true },
      palettes: [
        { bg: '#0A0A0A', fg: '#FAFAFA', ac: '#C6FF00', ac2: '#22D3EE', card: '#171717', on: '#0A0A0A' },
        { bg: '#111827', fg: '#F9FAFB', ac: '#F43F5E', ac2: '#FB923C', card: '#1F2937', on: '#111827' }],
      names: ['짐타임', '핏스팟', '리프트', '무브'],
      badge: '지금 예약 가능',
      heads: [['비어 있는 1시간,\n지금 바로 운동.', '회원권 없이 1회권으로. 가장 가까운 빈자리부터.'],
              ['핑계는 끝.\n빈 시간이 열렸다.', '동네 헬스장의 빈 시간을 1회권으로 예약하세요.']],
      cta: '빈 시간 찾기',
      feats: [['1회권부터', '부담 없이 한 번만'], ['가까운 순', '걸어서 5분 거리부터'], ['바로 입장', '예약 즉시 입장 코드 발급']],
      stats: [['38곳', '제휴 헬스장'], ['5분', '평균 거리'], ['9,900원', '1회권부터']] },

    { id: 'food', font: { family: 'Gowun Batang', weight: 700, q: 'Gowun+Batang:wght@700' }, label: '음식·카페', test: /카페|식당|맛집|음식|베이커리|빵|커피|요리|밀키트|도시락|디저트|케이크|반찬/,
      voice: '따뜻하고 군침 돌게', look: '크림·브라운 · 넉넉한 여백 · 메뉴 중심', layout: 'product',
      tone: { r: 14, w: 700, ls: '-0.01em' },
      palettes: [
        { bg: '#FBF6EE', fg: '#3E2723', ac: '#9A4A0B', ac2: '#E3A15A', card: '#FFFFFF', on: '#FFFFFF' },
        { bg: '#FFF4F2', fg: '#4C0519', ac: '#C2185B', ac2: '#F7A7B8', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['오늘의빵', '아침공방', '동네부엌', '갓구운'],
      badge: '오늘의 메뉴',
      heads: [['갓 구운 아침을,\n줄 서지 않고.', '전날 밤 미리 주문하면 아침에 따뜻하게 준비해 둡니다.'],
              ['오늘 나온 메뉴,\n먼저 맛보세요.', '매일 아침 바뀌는 메뉴를 가장 먼저 알려드립니다.']],
      cta: '내일 아침 예약하기',
      feats: [['미리 주문', '전날 밤 10시까지'], ['픽업 알림', '준비되면 바로 연락'], ['단골 도장', '열 번 오면 한 번 무료']],
      stats: [['07:30', '첫 픽업'], ['12종', '오늘의 메뉴'], ['320명', '단골 손님']],
      products: [['소금빵', '3,500원'], ['크루아상', '4,200원'], ['바게트', '5,000원']] },

    { id: 'edu', font: { family: 'IBM Plex Sans KR', weight: 700, q: 'IBM+Plex+Sans+KR:wght@700' }, label: '교육·클래스', test: /과외|강의|클래스|레슨|코칭|교육|스터디|학원|튜터|수업|영어|수학|코딩/,
      voice: '믿음직하고 친절하게', look: '밝은 블루 · 정돈된 카드 · 진도 그래프', layout: 'app',
      tone: { r: 12, w: 800, ls: '-0.02em' },
      palettes: [
        { bg: '#F0F7FF', fg: '#0B2545', ac: '#1D5FE0', ac2: '#10B981', card: '#FFFFFF', on: '#FFFFFF' },
        { bg: '#FBFBEA', fg: '#1A2E05', ac: '#4D7C0F', ac2: '#0EA5E9', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['하루공부', '클래스온', '러닝랩', '배움터'],
      badge: '수강생 모집 중',
      heads: [['혼자서는 안 되던 공부,\n4주면 달라집니다.', '1:1 맞춤 커리큘럼과 매주 진도 리포트.'],
              ['첫 수업은 무료.\n맞는지 먼저 확인하세요.', '수준 진단부터 시작합니다.']],
      cta: '무료 수업 신청',
      feats: [['수준 진단', '첫 수업에서 정확하게'], ['맞춤 커리큘럼', '나에게 맞는 순서로'], ['주간 리포트', '보호자에게도 공유']],
      stats: [['4주', '평균 체감 기간'], ['92%', '재등록률'], ['1:1', '맞춤 수업']] },

    { id: 'pro', font: { family: 'Noto Serif KR', weight: 700, q: 'Noto+Serif+KR:wght@700' }, label: '전문 상담', test: /상담|세무|법률|노무|회계|컨설팅|보험|부동산|변호|세금|특허/,
      voice: '단정하고 신뢰감 있게', look: '네이비·골드 · 직선 · 넉넉한 행간', layout: 'trust',
      tone: { r: 2, w: 700, ls: '-0.01em' },
      palettes: [
        { bg: '#0F1B2D', fg: '#F1F5F9', ac: '#D4AF37', ac2: '#94A3B8', card: '#16263D', on: '#0F1B2D' },
        { bg: '#F8FAFC', fg: '#0F172A', ac: '#0F766E', ac2: '#334155', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['바른세무', '한결상담소', '정도', '온전'],
      badge: '상담 예약 가능',
      heads: [['세금 걱정은\n전문가에게 맡기세요.', '첫 상담 무료. 비용은 먼저 안내합니다.'],
              ['복잡한 일일수록,\n한 번에 정확하게.', '48시간 안에 답변드립니다.']],
      cta: '무료 상담 신청',
      feats: [['첫 상담 무료', '부담 없이 물어보세요'], ['비용 먼저 안내', '추가 청구 없이'], ['48시간 답변', '기다리지 않게']],
      stats: [['12년', '실무 경력'], ['1,800건', '상담 실적'], ['48시간', '답변 약속']],
      checks: ['종합소득세 신고', '부가세 신고', '절세 진단'],
      quote: ['“처음으로 세금이 이해됐어요.”', '1인 사업자 고객'] },

    { id: 'folio', label: '포트폴리오', test: /포트폴리오|이력서|취업|취준|구직|디자이너|개발자|마케터|기획자|PM|자기소개/i,
      voice: '담백하고 자신 있게', look: '흑백 · 큰 이름 · 결과 중심 목록', layout: 'profile',
      tone: { r: 0, w: 800, ls: '-0.045em' },
      palettes: [
        { bg: '#FAFAFA', fg: '#0A0A0A', ac: '#0A0A0A', ac2: '#737373', card: '#FFFFFF', on: '#FAFAFA' },
        { bg: '#0B0B0F', fg: '#EDEDED', ac: '#A3E635', ac2: '#6B7280', card: '#15151B', on: '#0B0B0F' }],
      names: ['홍길동'],
      badge: '구직 중',
      heads: [['문제를 정의하고,\n끝까지 만드는 사람.', '기획부터 출시까지, 결과로 이야기합니다.'],
              ['숫자로 증명한\n3년의 작업.', '지금 함께할 팀을 찾고 있습니다.']],
      cta: '이력서 보기',
      roles: ['기획', '데이터 분석', '협업'],
      projects: [['2026', '결제 전환율 18% 개선'], ['2025', '신규 서비스 0→1 출시'], ['2024', '사내 업무 자동화']],
      stats: [['3년', '실무 경력'], ['12개', '출시한 기능'], ['18%', '최고 개선율']] },

    { id: 'shop', font: { family: 'Nanum Myeongjo', weight: 800, q: 'Nanum+Myeongjo:wght@800' }, label: '쇼핑·브랜드', test: /쇼핑|판매|스토어|브랜드|굿즈|옷|의류|화장품|커머스|구독|소품|가구|향수/,
      voice: '감각적이고 짧게', look: '넓은 여백 · 제품 중심 · 가격 강조', layout: 'product',
      tone: { r: 6, w: 700, ls: '-0.035em' },
      palettes: [
        { bg: '#F5F0E8', fg: '#1C1917', ac: '#1C1917', ac2: '#A16207', card: '#FFFFFF', on: '#F5F0E8' },
        { bg: '#FDF2F8', fg: '#500724', ac: '#BE185D', ac2: '#F472B6', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['오브젝트', '데일리룸', '소소마켓', '결'],
      badge: '신상품 입고',
      heads: [['매일 쓰는 것일수록,\n좋은 걸로.', '오래 쓸 물건만 고릅니다.'],
              ['첫 구매 15% 할인,\n오늘까지.', '가입하고 바로 받으세요.']],
      cta: '첫 구매 혜택 받기',
      feats: [['무료 배송', '3만 원 이상'], ['30일 교환', '써 보고 결정'], ['정기 구독', '떨어지기 전에']],
      stats: [['4.8', '구매 후기'], ['2,400+', '재구매'], ['30일', '무료 교환']],
      products: [['데일리 머그', '18,000원'], ['린넨 앞치마', '32,000원'], ['우드 트레이', '24,000원']] },

    { id: 'trip', font: { family: 'Gowun Dodum', weight: 400, q: 'Gowun+Dodum' }, label: '여행·숙소', test: /여행|숙소|캠핑|투어|호텔|펜션|게스트하우스|스테이|휴가/,
      voice: '설레고 여유롭게', look: '바다색 · 큰 풍경 · 부드러운 곡선', layout: 'split',
      tone: { r: 20, w: 800, ls: '-0.02em' },
      palettes: [
        { bg: '#ECFEFF', fg: '#083344', ac: '#0E7490', ac2: '#F59E0B', card: '#FFFFFF', on: '#FFFFFF' },
        { bg: '#FFFBEB', fg: '#422006', ac: '#C2410C', ac2: '#0EA5E9', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['쉼표', '머무름', '바람길', '로컬트립'],
      badge: '이번 달 예약 가능',
      heads: [['아무것도 하지 않아도\n좋은 하루.', '바다 앞 작은 숙소, 하루 네 팀만 받습니다.'],
              ['이번 주말,\n가까운 바다로.', '현지인이 고른 동네만 모았습니다.']],
      cta: '날짜 확인하기',
      feats: [['하루 네 팀', '조용한 휴식'], ['바다까지 1분', '창문 너머 바다'], ['동네 지도', '현지인 맛집 추천']],
      stats: [['4.9', '후기 평점'], ['1분', '바다까지'], ['4팀', '하루 정원']],
      rows: [['오션뷰 더블', '주말 2자리'], ['패밀리 룸', '평일 가능'], ['조식 포함', '+12,000원']] },

    { id: 'saas', label: 'AI·업무 도구', test: /AI|인공지능|앱|자동화|플랫폼|SaaS|툴|업무|데이터|챗봇|에이전트|대시보드|관리/i,
      voice: '명확하고 똑똑하게', look: '다크 · 그라데이션 · 실제 화면 보여주기', layout: 'app',
      tone: { r: 12, w: 800, ls: '-0.035em' },
      palettes: [
        { bg: '#0B1020', fg: '#E6EAF2', ac: '#9277FF', ac2: '#5EEAD4', card: '#131A2E', on: '#0B1020' },
        { bg: '#FFFFFF', fg: '#0F172A', ac: '#4F46E5', ac2: '#06B6D4', card: '#F4F6FB', on: '#FFFFFF' }],
      names: ['플로우', '레버', '하이브', '오토'],
      badge: '14일 무료 체험',
      heads: [['반복 업무는\n이제 알아서.', '클릭 한 번으로 매주 10시간을 돌려받으세요.'],
              ['일은 줄이고,\n결과는 그대로.', '쓰던 도구에 그대로 연결됩니다.']],
      cta: '무료로 시작하기',
      feats: [['10분 연결', '쓰던 도구 그대로'], ['자동 보고서', '매주 월요일 아침'], ['팀 요금제', '쓰는 만큼만']],
      stats: [['10시간', '주당 절약'], ['24종', '연결 도구'], ['14일', '무료 체험']] },

    { id: 'club', font: { family: 'Gaegu', weight: 700, q: 'Gaegu:wght@700' }, label: '모임·커뮤니티', test: /모임|커뮤니티|동호회|네트워킹|매칭|친구|소모임|클럽/,
      voice: '활기차고 반갑게', look: '알록달록 · 사람 중심 · 동그란 프로필', layout: 'split',
      tone: { r: 18, w: 800, ls: '-0.02em' },
      palettes: [
        { bg: '#FFF7ED', fg: '#431407', ac: '#C2410C', ac2: '#8B5CF6', card: '#FFFFFF', on: '#FFFFFF' },
        { bg: '#F0FDF4', fg: '#052E16', ac: '#15803D', ac2: '#F59E0B', card: '#FFFFFF', on: '#FFFFFF' }],
      names: ['같이', '모여', '한자리', '온동네'],
      badge: '새 모임 모집 중',
      heads: [['혼자보다 같이,\n이번 주 모임에서.', '관심사가 같은 동네 사람들과 만나 보세요.'],
              ['낯설어도 괜찮아요.\n첫 모임은 가볍게.', '처음 온 분을 위한 자리부터 시작합니다.']],
      cta: '이번 주 모임 보기',
      feats: [['동네 기반', '걸어서 갈 수 있는 곳'], ['소규모', '한 모임 8명까지'], ['첫 모임 무료', '가볍게 시작']],
      stats: [['86개', '진행 중인 모임'], ['8명', '모임 정원'], ['4.8', '만족도']],
      rows: [['토요 러닝', '6/8명'], ['책 모임', '4/8명'], ['보드게임', '7/8명']] },

    { id: 'base', label: '새 서비스', test: /[\s\S]*/,
      voice: '명확하고 친근하게', look: '포인트 색 하나 · 깔끔한 카드 · 숫자 강조', layout: 'center',
      tone: { r: 12, w: 800, ls: '-0.025em' },
      palettes: [
        { bg: '#F8FAFC', fg: '#0F172A', ac: '#5B5BF0', ac2: '#EC4899', card: '#FFFFFF', on: '#FFFFFF' },
        { bg: '#111827', fg: '#F9FAFB', ac: '#34D399', ac2: '#60A5FA', card: '#1F2937', on: '#052E16' }],
      names: ['첫걸음', '오픈런', '새싹', '시작'],
      badge: '오픈 준비 중',
      heads: [['{x},\n이제 한 번에.', '오픈 전 사전 신청을 받습니다. 가장 먼저 써 보세요.'],
              ['불편했던 그 순간,\n{x}로 바꿉니다.', '지금 신청하면 오픈 소식을 가장 먼저 보내드립니다.']],
      cta: '사전 신청하기',
      feats: [['가입 1분', '복잡한 절차 없이'], ['3개월 무료', '먼저 써 보세요'], ['오픈 알림', '가장 먼저']],
      stats: [['500+', '사전 신청'], ['1분', '가입'], ['3개월', '무료']] }
  ];

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(arr, h, salt) { return arr[(h >>> (salt || 0)) % arr.length]; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function sk(node, d) { node.setAttribute('data-sk', ''); if (d != null) { node.classList.add('pv-anim'); node.style.setProperty('--d', d); } return node; }
  function kids(parent, list) { list.forEach(function (c) { if (c) parent.appendChild(c); }); return parent; }

  function short(idea) { return idea.length > 14 ? idea.slice(0, 14) + '…' : idea; }

  function visual(cat, h) {
    var v = el('div', 'pv-vis'), i;
    if (cat.layout === 'split') {
      cat.rows.forEach(function (r, n) {
        var row = sk(el('div', 'pv-row'), n + 1);
        kids(row, [el('i'), kids(el('span'), [el('b', null, r[0])]), el('em', null, r[1])]);
        v.appendChild(row);
      });
    } else if (cat.layout === 'product') {
      v.classList.add('tiles');
      cat.products.forEach(function (p, n) {
        var t = sk(el('div', 'pv-tile'), n + 1);
        kids(t, [el('i'), el('b', null, p[0]), el('span', null, p[1])]);
        v.appendChild(t);
      });
    } else if (cat.layout === 'app') {
      v.classList.add('dash');
      var kpi = el('div', 'pv-kpi');
      cat.stats.slice(0, 2).forEach(function (s, n) { kpi.appendChild(kids(sk(el('div'), n + 1), [el('b', null, s[0]), el('span', null, s[1])])); });
      var bars = el('div', 'pv-bars');
      for (i = 0; i < 7; i++) {
        var b = el('i', 'pv-bar'); b.style.height = (34 + ((h >>> i) % 60)) + '%'; b.style.setProperty('--d', i); bars.appendChild(b);
      }
      kids(v, [kpi, bars]);
    } else if (cat.layout === 'trust') {
      v.classList.add('trust');
      var ul = el('ul', 'pv-checks');
      cat.checks.forEach(function (c, n) { ul.appendChild(sk(el('li', null, c), n + 1)); });
      var q = sk(el('blockquote', 'pv-quote'), 4);
      kids(q, [el('p', null, cat.quote[0]), el('cite', null, cat.quote[1])]);
      kids(v, [ul, q]);
    } else if (cat.layout === 'profile') {
      v.classList.add('profile');
      var av = sk(el('div', 'pv-avatar', '홍'), 1);
      var chips = el('div', 'pv-roles');
      cat.roles.forEach(function (r, n) { chips.appendChild(sk(el('span', null, r), n + 2)); });
      kids(v, [av, chips]);
    }
    return v;
  }

  function render(idea) {
    var cat = CATS.find(function (c) { return c.test.test(idea); });
    var h = hash(idea);
    var pal = pick(cat.palettes, h, 3);
    var head = pick(cat.heads, h, 7);
    var name = cat.id === 'base' && idea.length <= 8 && !/\s/.test(idea) ? idea : pick(cat.names, h, 11);
    var title = head[0].replace('{x}', short(idea));

    var page = el('div', 'pv-page pv-' + cat.layout + ' cat-' + cat.id + (cat.tone.italic ? ' is-italic' : ''));
    var st = page.style;
    ['bg', 'fg', 'ac', 'ac2', 'card', 'on'].forEach(function (k) { st.setProperty('--' + k, pal[k]); });
    st.setProperty('--r', cat.tone.r + 'px'); st.setProperty('--w', cat.tone.w); st.setProperty('--ls', cat.tone.ls);
    if (cat.font) { st.setProperty('--df', "'" + cat.font.family + "', 'Pretendard Variable', Pretendard, sans-serif"); st.setProperty('--dw', cat.font.weight); }

    var nav = kids(el('div', 'pv-nav'), [
      kids(sk(el('span', 'pv-logo')), [el('i'), document.createTextNode(name)]),
      kids(el('span', 'pv-links'), [sk(el('span', null, '소개')), sk(el('span', null, '후기')), sk(el('span', null, '문의'))]),
      sk(el('span', 'pv-nbtn', cat.layout === 'profile' ? '연락하기' : '시작하기'))
    ]);

    var titleEl = sk(el('p', 'pv-title', title));
    var copy = kids(el('div', 'pv-copy'), [
      sk(el('span', 'pv-badge', cat.badge)),
      sk(el('span', 'pv-eyebrow', idea.length > 30 ? idea.slice(0, 30) + '…' : idea)),
      titleEl,
      sk(el('p', 'pv-sub', head[1])),
      kids(el('div', 'pv-actions'), [sk(el('span', 'pv-cta', cat.cta)), sk(el('span', 'pv-proof', '★ ' + cat.stats[0][0] + ' ' + cat.stats[0][1]))])
    ]);
    var hero = kids(el('div', 'pv-hero'), [copy, cat.layout === 'center' ? null : visual(cat, h)]);

    var stats = el('div', 'pv-stats');
    cat.stats.forEach(function (s, n) { stats.appendChild(kids(sk(el('div'), n + 1), [el('b', null, s[0]), el('span', null, s[1])])); });

    var body;
    if (cat.layout === 'profile') {
      body = el('div', 'pv-list');
      cat.projects.forEach(function (p, n) { body.appendChild(kids(sk(el('div', 'pv-item'), n + 2), [el('span', null, p[0]), el('b', null, p[1]), el('em', null, '→')])); });
    } else {
      body = el('div', 'pv-feats');
      cat.feats.forEach(function (f, n) { body.appendChild(kids(sk(el('div', 'pv-feat'), n + 2), [el('i'), el('b', null, f[0]), el('span', null, f[1])])); });
    }

    var band = kids(sk(el('div', 'pv-band'), 5), [el('b', null, cat.layout === 'profile' ? '함께 일할 팀을 찾고 있습니다.' : '지금 신청하면 가장 먼저 안내드립니다.'), el('span', null, cat.cta)]);
    var foot = sk(el('div', 'pv-foot', '© 2026 ' + name));

    kids(page, cat.layout === 'center' ? [nav, hero, stats, body, band, foot] : [nav, hero, body, stats, band, foot]);

    var slug = name.replace(/\s+/g, '');
    return {
      page: page, titleEl: titleEl, title: title, domain: slug + (cat.id === 'folio' ? '.me' : '.com'),
      cat: cat, note: [['업종', cat.label], ['톤', cat.voice], ['화면', cat.look]]
    };
  }

  /* Display fonts per industry, fetched once and only for the letters the titles use. */
  var fontsLoaded = false;
  function loadFonts() {
    if (fontsLoaded) return; fontsLoaded = true;
    var chars = {}, fams = [];
    CATS.forEach(function (c) {
      if (!c.font) return;
      fams.push('family=' + c.font.q);
      [c.label].concat(c.names, c.heads.map(function (h) { return h[0]; })).join('').split('').forEach(function (ch) { if (ch.trim()) chars[ch] = 1; });
    });
    var link = document.createElement('link'); link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap&text=' + encodeURIComponent(Object.keys(chars).join(''));
    document.head.appendChild(link);
  }

  window.BibiPreview = { render: render, hash: hash, cats: CATS, loadFonts: loadFonts };
})();
