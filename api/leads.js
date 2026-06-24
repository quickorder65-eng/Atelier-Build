// GET /api/leads  — list all leads (requires admin password)
// POST /api/leads — create new lead (from quiz/chat/contact form)

const { getLeads, createLead } = require('./_storage');
const { sendTelegramMessage, buildLeadMessage } = require('./_telegram');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
}

function estimateAmount(area, renovationType) {
  const prices = {
    'Базовый': 35000, 'Только ремонт': 35000,
    'Комфорт': 55000,
    'Премиум': 90000,
    'Дизайн + ремонт': 90000,
    'Ремонт + комплектация': 75000
  };
  const areaRanges = {
    'До 50 м²': [30, 50], '50–80 м²': [50, 80],
    '80–120 м²': [80, 120], '120+ м²': [120, 200]
  };
  const pricePerM2 = prices[renovationType] || 55000;
  const [minA, maxA] = areaRanges[area] || [60, 80];
  const min = (minA * pricePerM2).toLocaleString('ru-RU');
  const max = (maxA * pricePerM2).toLocaleString('ru-RU');
  return `${min} – ${max} ₸`;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: list leads (admin only) ──────────────────────
  if (req.method === 'GET') {
    const pwd = req.headers['x-admin-password'];
    if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const leads = await getLeads();
    return res.status(200).json({ leads });
  }

  // ── POST: create lead ─────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};

    if (!body.name || !body.phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const lead = await createLead({
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      objectType:      body.objectType      || body.q1 || '—',
      area:            body.area            || body.q2 || '—',
      renovationType:  body.renovationType  || body.q3 || body.q4 || '—',
      designProject:   body.designProject   || body.q3 || '—',
      timeline:        body.timeline        || body.q5 || '—',
      comment:         body.comment         || body.message || '',
      preferredContact:body.preferredContact|| body.q6 || '',
      estimatedAmount: body.estimatedAmount || estimateAmount(
        body.area || body.q2,
        body.renovationType || body.q4 || body.q3
      ),
      calendarDate:    body.calendarDate    || null,
      calendarTime:    body.calendarTime    || null
    });

    // Send Telegram notification (non-blocking — don't fail if Telegram is down)
    sendTelegramMessage(buildLeadMessage(lead)).catch(() => {});

    return res.status(201).json({ ok: true, lead });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
