// GET  /api/follow-up      — find & send follow-ups for overdue leads (cron endpoint)
// POST /api/follow-up/:id  — send manual follow-up for specific lead

const { getLeads, getLeadById, updateLead } = require('./_storage');
const { sendTelegramMessage, buildFollowUpMessage } = require('./_telegram');

const FOLLOW_UP_HOURS = 24;
const FOLLOW_UP_STATUSES = ['Новая', 'Не ответил'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pwd = req.headers['x-admin-password'];
  if (!pwd || pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const leadId = body.id || req.query.id;

  // ── Manual follow-up for specific lead ───────────────────
  if (leadId) {
    const lead = await getLeadById(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const result = await sendTelegramMessage(buildFollowUpMessage(lead));
    await updateLead(leadId, {
      followUpStatus: 'sent',
      lastFollowUpAt: new Date().toISOString()
    });

    return res.status(200).json({ ok: true, telegram: result });
  }

  // ── Auto follow-up for overdue leads ──────────────────────
  const leads = await getLeads();
  const now = Date.now();
  const cutoff = FOLLOW_UP_HOURS * 60 * 60 * 1000;
  const overdue = leads.filter(l =>
    FOLLOW_UP_STATUSES.includes(l.status) &&
    (now - new Date(l.createdAt).getTime()) > cutoff &&
    l.followUpStatus !== 'sent'
  );

  const results = [];
  for (const lead of overdue) {
    const tg = await sendTelegramMessage(buildFollowUpMessage(lead));
    await updateLead(lead.id, {
      followUpStatus: 'sent',
      lastFollowUpAt: new Date().toISOString()
    });
    results.push({ id: lead.id, name: lead.name, telegram: tg.ok });
  }

  return res.status(200).json({ ok: true, processed: results.length, results });
};
