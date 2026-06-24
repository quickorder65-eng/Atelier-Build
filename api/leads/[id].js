// GET  /api/leads/:id — get single lead
// PATCH /api/leads/:id — update status, managerComment, followUpStatus

const { getLeadById, updateLead } = require('../_storage');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pwd = req.headers['x-admin-password'];
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const lead = await getLeadById(id);
    if (!lead) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ lead });
  }

  if (req.method === 'PATCH') {
    const allowed = ['status', 'managerComment', 'followUpStatus', 'lastFollowUpAt', 'calendarDate', 'calendarTime'];
    const updates = {};
    const body = req.body || {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    const lead = await updateLead(id, updates);
    if (!lead) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true, lead });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
