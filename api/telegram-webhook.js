async function askGroq(userText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('[TG Webhook] GROQ_API_KEY not set');
    return null;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Ты ИИ-ассистент ремонтной компании Atelier Buils (Алматы). Отвечай кратко — 2-3 предложения. Цены: базовый от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м². Предлагай оставить заявку или позвонить +7 700 123-45-67.'
          },
          { role: 'user', content: userText }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (data.error) { console.error('[TG Groq]', data.error.message); return null; }
    const text = data.choices?.[0]?.message?.content;
    if (text) { console.log('[TG Groq] Success'); return text; }
  } catch (e) {
    console.error('[TG Groq] fetch error:', e.message);
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

  const aiReply = await askGroq(userText);
  const reply = aiReply || 'Здравствуйте! Напишите нам в WhatsApp или позвоните: +7 700 123-45-67. Мы поможем с вопросами о ремонте.';

  await telegramReply(chatId, reply);
  return res.status(200).json({ ok: true });
};
