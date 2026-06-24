// Storage abstraction layer
// CRM_STORAGE_MODE=mock  → in-memory seed data (non-persistent on Vercel)
// CRM_STORAGE_MODE=google_sheets → Google Apps Script webhook

const SEED_LEADS = [
  {
    id: 'demo-001',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    name: 'Алия Сейткалиева',
    phone: '+7 701 234-56-78',
    objectType: 'Квартира',
    area: '80–120 м²',
    renovationType: 'Комфорт',
    designProject: 'Нет',
    timeline: 'В течение месяца',
    comment: 'Хочу сделать ремонт в новостройке, интересует пакет Комфорт',
    estimatedAmount: '4 400 000 – 9 900 000 ₸',
    status: 'В работе',
    source: 'Сайт',
    followUpStatus: null,
    lastFollowUpAt: null,
    managerComment: 'Созвонились, выезжаем на замер в пятницу'
  },
  {
    id: 'demo-002',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    name: 'Дмитрий Ноздрин',
    phone: '+7 705 987-65-43',
    objectType: 'Дом / коттедж',
    area: '120+ м²',
    renovationType: 'Премиум',
    designProject: 'Дизайн + ремонт',
    timeline: 'Через 2–3 месяца',
    comment: 'Дом 160 кв.м, нужен полный ремонт с дизайн-проектом',
    estimatedAmount: 'от 14 400 000 ₸',
    status: 'Записан на замер',
    source: 'Сайт',
    followUpStatus: null,
    lastFollowUpAt: null,
    managerComment: 'Встреча назначена на 28 июня в 11:00'
  },
  {
    id: 'demo-003',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    name: 'Мария Лукина',
    phone: '+7 707 321-00-11',
    objectType: 'Квартира',
    area: '50–80 м²',
    renovationType: 'Базовый',
    designProject: 'Нет',
    timeline: 'Как можно скорее',
    comment: 'Нужно быстро, квартира под сдачу',
    estimatedAmount: '1 750 000 – 2 800 000 ₸',
    status: 'Новая',
    source: 'Сайт',
    followUpStatus: null,
    lastFollowUpAt: null,
    managerComment: ''
  },
  {
    id: 'demo-004',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    name: 'Тимур Ахметов',
    phone: '+7 702 555-44-33',
    objectType: 'Офис',
    area: '80–120 м²',
    renovationType: 'Комфорт',
    designProject: 'Ремонт + комплектация',
    timeline: 'В течение месяца',
    comment: 'Офисное помещение 115 кв.м, нужен современный стиль',
    estimatedAmount: '4 400 000 – 6 600 000 ₸',
    status: 'Не ответил',
    source: 'Сайт',
    followUpStatus: null,
    lastFollowUpAt: null,
    managerComment: 'Звонили 2 раза — не берёт трубку'
  }
];

// Module-level cache (persists within same Vercel function instance)
let _inMemoryLeads = null;

function getMemoryLeads() {
  if (!_inMemoryLeads) _inMemoryLeads = [...SEED_LEADS];
  return _inMemoryLeads;
}

function generateId() {
  return 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

async function gasRequest(method, payload) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) throw new Error('GOOGLE_SHEETS_WEBHOOK_URL not set');
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (payload) opts.body = JSON.stringify(payload);
  const res = await fetch(method === 'GET' ? url + '?action=list' : url, opts);
  if (!res.ok) throw new Error('GAS error: ' + res.status);
  return res.json();
}

async function getLeads() {
  const mode = process.env.CRM_STORAGE_MODE || 'mock';
  if (mode === 'google_sheets') {
    try {
      const data = await gasRequest('GET');
      return Array.isArray(data.leads) ? data.leads : SEED_LEADS;
    } catch (e) {
      console.error('[Storage] Google Sheets read failed:', e.message);
      return SEED_LEADS;
    }
  }
  return getMemoryLeads();
}

async function createLead(leadData) {
  const lead = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'Новая',
    source: 'Сайт',
    followUpStatus: null,
    lastFollowUpAt: null,
    managerComment: '',
    ...leadData
  };

  const mode = process.env.CRM_STORAGE_MODE || 'mock';
  if (mode === 'google_sheets') {
    try {
      await gasRequest('POST', { action: 'create', lead });
    } catch (e) {
      console.error('[Storage] Google Sheets write failed:', e.message);
      getMemoryLeads().push(lead);
    }
  } else {
    getMemoryLeads().push(lead);
    console.log('[CRM MOCK] New lead saved:', JSON.stringify(lead, null, 2));
  }
  return lead;
}

async function updateLead(id, updates) {
  const mode = process.env.CRM_STORAGE_MODE || 'mock';
  if (mode === 'google_sheets') {
    try {
      const data = await gasRequest('POST', { action: 'update', id, updates });
      return data.lead || { id, ...updates };
    } catch (e) {
      console.error('[Storage] Google Sheets update failed:', e.message);
    }
  }
  const leads = getMemoryLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...updates };
  console.log('[CRM MOCK] Lead updated:', id, JSON.stringify(updates));
  return leads[idx];
}

async function getLeadById(id) {
  const leads = await getLeads();
  return leads.find(l => l.id === id) || null;
}

module.exports = { getLeads, createLead, updateLead, getLeadById, SEED_LEADS };
