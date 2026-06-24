// POST /api/chat — Gemini AI chat for renovation assistant
// Falls back to scripted demo replies if GEMINI_API_KEY is not set

const SYSTEM_PROMPT = `Ты ИИ-ассистент ремонтной компании Atelier Buils (Алматы).
Твоя задача — вежливо отвечать клиентам, уточнять детали ремонта, помогать понять примерный формат работ и подводить клиента к заявке, расчёту или созвону.
Не обещай точную стоимость без менеджера.
Если клиент готов оставить заявку, попроси имя, телефон, площадь, тип ремонта и удобное время для связи.
Отвечай кратко — 2-4 предложения максимум. Пиши по-русски.
Если пишут на другом языке — отвечай на том же языке.
Диапазон цен компании: базовый ремонт от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м².
Работаем с квартирами, домами, офисами и коммерческими помещениями.
Гарантия 1-2 года в зависимости от пакета.`;

const DEMO_REPLIES = [
  'Здравствуйте! Подскажите, какой тип объекта вас интересует — квартира, дом или офис?',
  'Хорошо! Чтобы рассчитать примерную стоимость, уточните площадь помещения.',
  'Наши цены: базовый ремонт от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м².',
  'Точную стоимость подготовит менеджер после замера. Оставите контакты — свяжемся в течение часа.',
  'Работаем по договору, делаем фото-отчёты, гарантия 1-2 года. Записаться на консультацию можно прямо сейчас.',
  'Чтобы оставить заявку, подскажите ваше имя и номер телефона — менеджер перезвонит.',
  'Сроки зависят от площади и объёма работ. Квартира 50-80 м² — 2-4 месяца. Уточните ваш объект?',
];
let _demoIdx = 0;

async function askGemini(history, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents = [
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 256, temperature: 0.7 }
        })
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error('[Gemini] API error:', data.error);
      return null;
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('[Gemini] Network error:', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const aiReply = await askGemini(history, message);

  if (aiReply) {
    return res.status(200).json({ reply: aiReply, mode: 'gemini' });
  }

  // Demo fallback
  const reply = DEMO_REPLIES[_demoIdx % DEMO_REPLIES.length];
  _demoIdx++;
  return res.status(200).json({ reply, mode: 'demo' });
};
