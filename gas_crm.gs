// Google Apps Script — CRM Storage for Atelier Buils
// Вставьте этот код в Apps Script и разверните как веб-приложение:
// Развернуть → Новое развёртывание → Веб-приложение → Доступ: Все
//
// URL веб-приложения → GOOGLE_SHEETS_WEBHOOK_URL в Vercel

var SHEET_NAME = 'Leads';
var HEADERS = [
  'id','createdAt','name','phone','objectType','area','renovationType',
  'designProject','timeline','comment','estimatedAmount','status','source',
  'followUpStatus','lastFollowUpAt','managerComment','calendarDate','calendarTime'
];

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === 'list') {
    return listLeads();
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'create') return createLead(body.lead);
    if (action === 'update') return updateLead(body.id, body.updates);
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function listLeads() {
  var sh = getSheet();
  var data = sh.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ leads: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var leads = data.slice(1).map(function(row) {
    var lead = {};
    headers.forEach(function(h, i) { lead[h] = row[i] || ''; });
    return lead;
  });
  return ContentService.createTextOutput(JSON.stringify({ leads: leads }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createLead(lead) {
  var sh = getSheet();
  var row = HEADERS.map(function(h) { return lead[h] || ''; });
  sh.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, lead: lead }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateLead(id, updates) {
  var sh = getSheet();
  var data = sh.getDataRange().getValues();
  var idCol = HEADERS.indexOf('id');
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      Object.keys(updates).forEach(function(key) {
        var col = HEADERS.indexOf(key);
        if (col >= 0) sh.getRange(i + 1, col + 1).setValue(updates[key] || '');
      });
      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'Lead not found' }))
    .setMimeType(ContentService.MimeType.JSON);
}
