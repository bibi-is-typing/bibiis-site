// bibiis.ai 첫 화면 데모: 사장님이 받는 메시지를 표로 정리해 돌려준다.
// POST /parse  { kind: "work" | "booking" | "order", text: "..." }
// → { title, columns: [..], rows: [[..]], reply, checks: [..] }

const KINDS = {
  work: {
    title: '출퇴근 기록',
    columns: ['이름', '날짜', '출근', '퇴근', '메모'],
    guide: '알바·직원이 보낸 근무 메시지다. 사람과 날짜별로 한 줄씩. 시간은 24시간 HH:MM. 날짜는 "어제/오늘/내일/요일"처럼 메시지에 나온 말 그대로 써도 된다. 결근·예정·불확실한 건 메모에.',
  },
  booking: {
    title: '예약표',
    columns: ['날짜', '시간', '인원', '이름', '연락처', '요청'],
    guide: '손님이 보낸 예약 문의다. 예약 한 건당 한 줄. 연락처는 메시지에 있는 그대로, 없으면 빈칸.',
  },
  order: {
    title: '주문 정리',
    columns: ['메뉴', '수량', '옵션', '받는 방법', '시간'],
    guide: '손님이 보낸 주문 메시지다. 메뉴 하나(옵션이 다르면 따로)당 한 줄. 수량은 숫자만.',
  },
};

const SYSTEM = `너는 작은 가게 사장님의 일을 덜어 주는 정리 도우미다.
메시지를 정해진 열의 표로 바꾸고, 사장님이 확인해야 할 것만 짧게 묻는다.
- 메시지에 없는 내용은 지어내지 말고 빈칸("")으로 둔다.
- checks에는 빠졌거나 애매하거나 평소와 다른 점만 넣는다(최대 3개, 각 25자 이내). 없으면 빈 배열.
- reply는 사장님에게 하는 한두 문장 존댓말("~했어요" 말투). 확인할 게 있으면 그걸 물어보고, 없으면 끝났다고 말한다.
- 인사·잡담·광고 등 정리할 게 없으면 rows를 비우고 reply로 무엇을 붙여 넣으면 되는지 알려 준다.`;

function cors(origin, env) {
  const allow = (env.ALLOW_ORIGINS || '').split(',').map((s) => s.trim());
  const ok = allow.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allow[0] || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const h = cors(origin, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/parse') return json({ error: 'not_found' }, 404, h);

    if (env.LIMIT) {
      const ip = req.headers.get('CF-Connecting-IP') || 'anon';
      const { success } = await env.LIMIT.limit({ key: ip });
      if (!success) return json({ error: 'too_many' }, 429, h);
    }

    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400, h); }
    const kind = KINDS[body.kind] ? body.kind : 'work';
    const text = String(body.text || '').trim().slice(0, 400);
    if (!text) return json({ error: 'empty' }, 400, h);
    if (!env.GEMINI_API_KEY) return json({ error: 'no_key' }, 503, h);

    const k = KINDS[kind];
    const schema = {
      type: 'OBJECT',
      properties: {
        rows: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } },
        checks: { type: 'ARRAY', items: { type: 'STRING' } },
        reply: { type: 'STRING' },
      },
      required: ['rows', 'checks', 'reply'],
    };
    const prompt = `표 이름: ${k.title}\n열(이 순서, 정확히 ${k.columns.length}칸): ${k.columns.join(' | ')}\n규칙: ${k.guide}\n\n메시지:\n"""\n${text}\n"""`;

    const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800, responseMimeType: 'application/json', responseSchema: schema, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!r.ok) return json({ error: 'ai_failed', status: r.status }, 502, h);
    const data = await r.json();
    let out;
    try { out = JSON.parse(data.candidates[0].content.parts[0].text); } catch { return json({ error: 'ai_parse' }, 502, h); }

    const n = k.columns.length;
    const rows = (Array.isArray(out.rows) ? out.rows : []).slice(0, 8).map((row) =>
      Array.from({ length: n }, (_, i) => String((row || [])[i] ?? '').slice(0, 40)));
    const checks = (Array.isArray(out.checks) ? out.checks : []).slice(0, 3).map((c) => String(c).slice(0, 40));
    return json({ title: k.title, columns: k.columns, rows, checks, reply: String(out.reply || '').slice(0, 200) }, 200, h);
  },
};
