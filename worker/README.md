# bibiis-try (첫 화면 AI 데모)

사장님이 받는 메시지(근무 카톡·예약 문자·주문 카톡)를 Gemini로 표로 정리해 돌려주는 Cloudflare Worker예요.

## 켜는 법 (처음 한 번)

```bash
cd worker
npx wrangler login                     # Cloudflare 계정으로 로그인
npx wrangler secret put GEMINI_API_KEY # 키 붙여 넣기 (화면에 안 보여요)
npx wrangler deploy                    # 나온 주소(…workers.dev)를 복사
```

그다음 `assets/js/config.js`의 `aiEndpoint`에 그 주소를 넣으면 첫 화면 데모가 진짜 AI로 바뀌어요.
비어 있거나 AI가 실패하면 예시 답으로 대신 보여 줘요.

- 같은 IP에서 1분에 6번까지 (`wrangler.toml`의 `[[ratelimits]]`)
- 입력은 400자까지, 표는 8줄까지
