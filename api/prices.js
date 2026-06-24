// GET  /api/prices — public, returns current prices for calculator
// POST /api/prices — admin only, update prices

const DEFAULT_PRICES = {
  basic:          35000,   // ₸/м² Базовый
  comfort:        55000,   // ₸/м² Комфорт
  premium:        90000,   // ₸/м² Премиум
  turnkey:        90000,   // ₸/м² Под ключ
  minBudget:      1500000, // Минимальный бюджет ₸
  notes: {
    basic:   'Черновые работы, выравнивание, плитка, ламинат, двери, базовая электрика',
    comfort: 'Всё из базового + электрика, сантехника, натяжные потолки, санузел',
    premium: 'Всё из комфорт + дизайн-проект, авторский надзор, материалы, умный дом'
  }
};

// Module-level cache (resets on cold start)
let _prices = null;

function getPrices() {
  if (_prices) return _prices;
  const envJson = process.env.PRICES_JSON;
  if (envJson) {
    try { _prices = { ...DEFAULT_PRICES, ...JSON.parse(envJson) }; return _prices; }
    catch (e) { console.error('[Prices] Invalid PRICES_JSON env var'); }
  }
  _prices = { ...DEFAULT_PRICES };
  return _prices;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ prices: getPrices() });
  }

  if (req.method === 'POST') {
    const pwd = req.headers['x-admin-password'];
    if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};
    const allowed = ['basic', 'comfort', 'premium', 'turnkey', 'minBudget'];
    const updates = {};
    for (const k of allowed) {
      if (k in body) {
        const v = Number(body[k]);
        if (!isNaN(v) && v > 0) updates[k] = v;
      }
    }
    if (body.notes && typeof body.notes === 'object') updates.notes = body.notes;

    _prices = { ...getPrices(), ...updates };

    return res.status(200).json({
      ok: true,
      prices: _prices,
      note: 'Prices updated in memory. They reset on next Vercel cold start. To persist, set PRICES_JSON env var in Vercel Dashboard or connect a database.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
