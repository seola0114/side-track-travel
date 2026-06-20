export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  // Convert OpenAI-style messages to Gemini format
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs = messages.filter(m => m.role !== 'system');

  const contents = chatMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // Gemini 무료 등급은 분당 요청 제한(429)이 있어 일시적인 429/503은 재시도로 대부분 해소됨
  const RETRYABLE = new Set([429, 503]);
  const MAX_RETRIES = 3;

  try {
    let response, data;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '(응답 없음)';
        return res.status(200).json({
          choices: [{ message: { role: 'assistant', content: text } }]
        });
      }

      // 재시도 불가능한 오류는 즉시 반환
      if (!RETRYABLE.has(response.status) || attempt === MAX_RETRIES) break;

      // 지수 백오프 (1s, 2s, 4s) + 지터
      await sleep(1000 * 2 ** attempt + Math.random() * 250);
    }

    // 재시도 후에도 실패 — 사용자에게 친절한 메시지 전달
    if (response.status === 429) {
      return res.status(429).json({
        error: '요청이 많아 잠시 후 다시 시도해주세요. (Gemini API 사용량 한도 초과)',
        code: 'rate_limited'
      });
    }
    return res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
