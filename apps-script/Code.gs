/**
 * bibiis.ai 상담 폼 수신기
 * 상담 폼 → 이 웹 앱 → 구글 시트 한 줄 + hello@bibiis.ai 알림 메일
 * 설치 방법은 같은 폴더의 README.md를 보세요.
 */
var SHEET_NAME = '상담';
var NOTIFY_TO = 'hello@bibiis.ai';
var FIELDS = ['submittedAt', 'source', 'name', 'channel', 'contact', 'situation', 'audience', 'action', 'idea', 'have', 'when', 'budget', 'agree'];

function doPost(e) {
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false }); }
  var sheet = sheet_();
  sheet.appendRow(FIELDS.map(function (k) { return String(data[k] || '').slice(0, 1000); }).concat(['새 상담']));
  MailApp.sendEmail({
    to: NOTIFY_TO,
    subject: '[bibi is listening] ' + (data.name || '이름 없음') + ' · ' + (data.situation || ''),
    body: FIELDS.map(function (k) { return k + ': ' + (data[k] || ''); }).join('\n')
  });
  return out_({ ok: true });
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(FIELDS.concat(['상태']));
  return sh;
}

/** 매일 한 번 돌려서, 3개월 지난 미계약 상담을 지워요 (트리거로 등록) */
function purgeOld() {
  var sh = sheet_();
  var rows = sh.getDataRange().getValues();
  var limit = Date.now() - 1000 * 60 * 60 * 24 * 92;
  for (var i = rows.length - 1; i >= 1; i--) {
    var t = Date.parse(rows[i][0]);
    var status = rows[i][FIELDS.length];
    if (t && t < limit && status !== '계약') sh.deleteRow(i + 1);
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
