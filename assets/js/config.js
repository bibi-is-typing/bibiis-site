// 여기 값만 바꾸면 사이트 전체에 반영돼요.
// 링크가 비어 있으면 버튼은 상담 폼(/listening/)으로 연결돼요.
window.BIBI = {
  links: {
    kmongPitch: '',   // 크몽 설득용 랜딩 상품 주소
    kmongFixing: '',  // 크몽 뒷수습 상품 주소
    kmongProfile: '', // 크몽 판매자 프로필 주소
    soomgo: ''        // 숨고 고수 프로필 주소
  },
  threads: '',        // 스레드 아이디 (@ 없이). 예: 'bibi_is_building'
  formEndpoint: '',   // 상담 폼을 받을 구글 앱스 스크립트 웹 앱 주소 (apps-script/README.md 참고)
  ga4: '',            // 구글 애널리틱스 측정 ID. 예: 'G-XXXXXXX'
  status: { mode: 'building', active: 2, next: '11.12' } // data/status.json이 있으면 그 값을 써요
};
