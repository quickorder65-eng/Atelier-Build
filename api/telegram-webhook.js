async function askGemini(userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[TG Webhook] GEMINI_API_KEY not set');
    return null;
  }

  const contents = [
    {
      role: 'user',
      parts: [{ text: '[ИНСТРУКЦИЯ]: Ты ИИ-ассистент ремонтной компании Atelier Buils (Алматы). Отвечай кратко — 2-3 предложения. Цены: базовый от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м². Предлагай оставить заявку или позвонить +7 700 123-45-67.' }]
    },
    { role: 'model', parts: [{ text: 'Понял.' }] },
    { role: 'user', parts: [{ text: userText }] }
  ];

const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 300, temperature: 0.7 } })
        }
      );
      const data = await res.json();
      if (data.error) { console.error('[TG Gemini]', model, data.error.message); continue; }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.error('[TG Gemini] fetch error:', e.message);
    }
  }
  return null;
}

async function telegramReply(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const update = req.body;
  const msg = update?.message;
  if (!msg) return res.status(200).json({ ok: true });

  const chatId = msg.chat?.id;
  const userText = msg.text || '';
  if (!userText || !chatId) return res.status(200).json({ ok: true });

  console.log('[TG Webhook] message from', chatId, ':', userText);

  const aiReply = await askGemini(userText);
  const reply = aiReply || 'Здравствуйте! Напишите нам в WhatsApp или позвоните: +7 700 123-45-67. Мы поможем с вопросами о ремонте.';

  await telegramReply(chatId, reply);
  return res.status(200).json({ ok: true });
};
