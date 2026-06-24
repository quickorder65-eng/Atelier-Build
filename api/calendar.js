// POST /api/calendar — create Google Calendar event for a lead

const { getLeadById, updateLead } = require('./_storage');

async function getAccessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const data = await res.json();
  return data.access_token || null;
}

async function createCalendarEvent(accessToken, lead, dateStr, timeStr) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const startDateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
  const endDateTime   = new Date(new Date(startDateTime).getTime() + 30 * 60 * 1000).toISOString();

  const event = {
    summary: `Заявка на ремонт — ${lead.name}`,
    description: `📱 Телефон: ${lead.phone}\n📐 Площадь: ${lead.area}\n🔨 Тип ремонта: ${lead.renovationType}\n💬 Комментарий: ${lead.comment || '—'}\n🌐 Источник: сайт\n🆔 ID заявки: ${lead.id}`,
    start: { dateTime: startDateTime, timeZone: 'Asia/Almaty' },
    end:   { dateTime: endDateTime,   timeZone: 'Asia/Almaty' }
  };

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  );
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pwd = req.headers['x-admin-password'];
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { leadId, date, time, type = 'Записан на созвон' } = req.body || {};
  if (!leadId || !date || !time) {
    return res.status(400).json({ error: 'leadId, date and time are required' });
  }

  const lead = await getLeadById(leadId).catch(() => null) || { id: leadId, name: '—', phone: '—', area: '—', renovationType: '—', comment: '—' };

  const accessToken = await getAccessToken().catch(() => null);
  if (!accessToken) {
    await updateLead(leadId, { status: type, calendarDate: date, calendarTime: time }).catch(() => {});
    console.log(`[Calendar MOCK] lead ${leadId} on ${date} at ${time}`);
    return res.status(200).json({
      ok: true,
      mode: 'mock',
      message: 'Дата сохранена. Для синхронизации с Google Calendar добавьте GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в Vercel.',
      lead: { ...lead, status: type, calendarDate: date, calendarTime: time }
    });
  }

  try {
    const event = await createCalendarEvent(accessToken, lead, date, time);
    await updateLead(leadId, { status: type, calendarDate: date, calendarTime: time });
    return res.status(200).json({ ok: true, mode: 'google_calendar', event });
  } catch (e) {
    console.error('[Calendar] Error:', e.message);
    return res.status(500).json({ error: 'Calendar error: ' + e.message });
  }
};
