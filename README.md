# bibiis.ai

bibi is building 홈페이지. 빌드 도구 없는 정적 사이트(HTML·CSS·JS)라 GitHub Pages에 그대로 올라가요.

## 고칠 곳

| 하고 싶은 것 | 파일 |
|---|---|
| 크몽·숨고 링크, 스레드 아이디, 폼 주소, GA4 넣기 | `assets/js/config.js` |
| 상단 상태 줄 숫자 바꾸기 ("지금 2건 만드는 중") | `data/status.json` |
| 문구 고치기 | `index.html` (기준 문구: 외주-시장조사/copy-deck.md) |
| 색·글꼴 | `assets/css/site.css` 맨 위 변수 (피그마 Color 변수와 같은 이름) |
| 응원 프로젝트 띠 마감 | `index.html`의 `data-ends` (지나면 자동으로 사라짐) |
| 상담 폼 받는 곳 | `apps-script/README.md` |

## 미리보기

```
python3 -m http.server 4173
```
→ http://localhost:4173

## 배포 (GitHub Pages)

1. 깃허브 bibi-is-typing 계정에 저장소를 만들고 올려요.
2. 저장소 Settings → Pages → Branch: main / root
3. Custom domain: `bibiis.ai` (CNAME 파일이 이미 있어요)
4. 클라우드플레어 DNS에 GitHub Pages 주소를 연결해요 (A 레코드 4개 + www CNAME). 연결 후 "Enforce HTTPS" 켜기.
