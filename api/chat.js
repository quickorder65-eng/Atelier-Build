const SYSTEM_PROMPT = `Ты ИИ-ассистент ремонтной компании Atelier Buils (Алматы).
Отвечай кратко — 2-3 предложения. Пиши по-русски.
Помогай клиентам с вопросами о ремонте, уточняй детали (площадь, тип объекта, бюджет).
Цены: базовый от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м².
Не обещай точную стоимость без менеджера.
Если клиент готов оставить заявку — попроси имя и телефон.`;

const DEMO_REPLIES = [
  'Здравствуйте! Подскажите, какой тип объекта вас интересует — квартира, дом или офис?',
  'Чтобы рассчитать примерную стоимость, уточните площадь помещения.',
  'Наши цены: базовый от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м².',
  'Точную стоимость подготовит менеджер после замера. Оставите контакты — свяжемся в течение часа.',
  'Работаем по договору, делаем фото-отчёты, гарантия 1-2 года. Записаться можно прямо сейчас.',
  'Чтобы оставить заявку, подскажите ваше имя и номер телефона.',
  'Сроки: квартира 50-80 м² — 2-4 месяца. Уточните ваш объект?',
];
let _demoIdx = 0;

async function askGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('[Groq] GROQ_API_KEY not set — using demo mode');
    return null;
  }

  const body = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.parts?.[0]?.text || m.text || '' }))
    ],
    max_tokens: 300,
    temperature: 0.7
  };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.error) {
      console.error('[Groq] error:', JSON.stringify(data.error));
      return null;
    }

    const text = data.choices?.[0]?.message?.content;
    if (text) {
      console.log('[Groq] Success');
      return text;
    }
  } catch (e) {
    console.error('[Groq] fetch error:', e.message);
  }

  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const messages = [
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const aiReply = await askGroq(messages);

  if (aiReply) {
    return res.status(200).json({ reply: aiReply, mode: 'groq' });
  }

  const reply = DEMO_REPLIES[_demoIdx % DEMO_REPLIES.length];
  _demoIdx++;
  return res.status(200).json({ reply, mode: 'demo' });
};
