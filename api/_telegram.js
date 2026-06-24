// Telegram Bot API helper — all calls stay on the server

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram] Credentials not set. Message:\n' + text);
    return { ok: false, reason: 'credentials_missing' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (!data.ok) console.error('[Telegram] API error:', data);
    return data;
  } catch (e) {
    console.error('[Telegram] Network error:', e.message);
    return { ok: false, reason: e.message };
  }
}

function buildLeadMessage(lead) {
  return `<b>🏗 Новая заявка с сайта Atelier Buils</b>

👤 <b>Имя:</b> ${lead.name || '—'}
📱 <b>Телефон:</b> ${lead.phone || '—'}
🏠 <b>Тип объекта:</b> ${lead.objectType || '—'}
📐 <b>Площадь:</b> ${lead.area || '—'}
🔨 <b>Тип ремонта:</b> ${lead.renovationType || '—'}
🎨 <b>Дизайн-проект:</b> ${lead.designProject || '—'}
📅 <b>Сроки начала:</b> ${lead.timeline || '—'}
💬 <b>Комментарий:</b> ${lead.comment || '—'}
💰 <b>Примерная сумма:</b> ${lead.estimatedAmount || '—'}
🕐 <b>Время заявки:</b> ${new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}
🆔 <b>ID:</b> ${lead.id}`;
}

function buildFollowUpMessage(lead) {
  return `<b>⏰ Фоллоу-ап по заявке</b>

Клиент оставил заявку <b>более 24 часов назад</b>.
Проверьте, актуален ли расчёт или созвон.

👤 <b>Имя:</b> ${lead.name || '—'}
📱 <b>Телефон:</b> ${lead.phone || '—'}
🔨 <b>Тип ремонта:</b> ${lead.renovationType || '—'}
📐 <b>Площадь:</b> ${lead.area || '—'}
📌 <b>Статус:</b> ${lead.status}
🕐 <b>Заявка создана:</b> ${new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}
🆔 <b>ID:</b> ${lead.id}`;
}

module.exports = { sendTelegramMessage, buildLeadMessage, buildFollowUpMessage };
