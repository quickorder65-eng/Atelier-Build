// POST /api/telegram-webhook
// Receives Telegram messages → sends to Gemini → replies back
// This is the demo/imitation of a future WhatsApp AI assistant
//
// To connect:
//   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//        -H "Content-Type: application/json" \
//        -d '{"url":"https://your-domain.vercel.app/api/telegram-webhook"}'

async function askGemini(userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const SYSTEM = `Ты ИИ-ассистент ремонтной компании Atelier Buils (Алматы).
Отвечай кратко и по делу. Помогай клиентам с вопросами о ремонте.
Цены: базовый от 35 000 ₸/м², комфорт от 55 000 ₸/м², премиум от 90 000 ₸/м².
Предлагай оставить заявку или позвонить +7 700 123-45-67.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.7 }
        })
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('[TG Webhook Gemini]', e.message);
    return null;
  }
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
  if (!msg) return res.status(200).end();

  const chatId = msg.chat?.id;
  const userText = msg.text || '';

  if (!userText) return res.status(200).json({ ok: true });

  const aiReply = await askGemini(userText);
  const reply = aiReply ||
    'Здравствуйте! Я помогу с вопросами о ремонте. Позвоните нам: +7 700 123-45-67 или оставьте заявку на сайте.';

  await telegramReply(chatId, reply);
  return res.status(200).json({ ok: true });
};
