/**
 * Battery Wale — Contact Form backend
 * -----------------------------------
 * Receives POSTs from the website's contact form, appends a timestamped
 * row to a Google Sheet, and emails a notification to NOTIFY_EMAIL.
 *
 * SETUP
 * 1. Create a new Google Sheet (any name, e.g. "Battery Wale Enquiries").
 * 2. Extensions -> Apps Script. Delete any starter code, paste this file in.
 * 3. Change NOTIFY_EMAIL below to the inbox you want enquiries sent to.
 * 4. Deploy -> New deployment -> select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy, authorize the permissions it asks for (this is your
 *    own script acting on your own Sheet/Gmail, so it's safe to allow).
 * 5. Copy the "Web app URL" it gives you (ends in /exec).
 * 6. Paste that URL into APPS_SCRIPT_URL near the top of script.js.
 *
 * Whenever you edit this file afterwards, go to Deploy -> Manage
 * deployments -> Edit (pencil icon) -> New version -> Deploy, so your
 * existing /exec URL picks up the changes.
 */

var SHEET_NAME = 'Submissions';
var NOTIFY_EMAIL = 'your-email@example.com'; // <-- CHANGE THIS to your real inbox

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var data = (e && e.parameter) || {};

    var name    = (data.name || '').toString().trim();
    var email   = (data.email || '').toString().trim();
    var phone   = (data.phone || '').toString().trim();
    var message = (data.message || '').toString().trim();

    if (!name || !email || !message) {
      return jsonResponse({ result: 'error', error: 'Missing required fields (name, email, message).' });
    }

    var timestamp = new Date();
    var sheet = getOrCreateSheet();
    sheet.appendRow([timestamp, name, email, phone, message]);

    sendNotificationEmail(name, email, phone, message, timestamp);

    return jsonResponse({ result: 'success' });

  } catch (err) {
    return jsonResponse({ result: 'error', error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/** Lets you open the /exec URL directly in a browser to confirm it's alive. */
function doGet(e) {
  return jsonResponse({ status: 'Battery Wale form endpoint is running.' });
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Contact Number', 'Message']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 5);
  }
  return sheet;
}

function sendNotificationEmail(name, email, phone, message, timestamp) {
  var subject = 'New website enquiry — ' + name;
  var body =
    'You have a new enquiry from the Battery Wale website.\n\n' +
    'Name: ' + name + '\n' +
    'Email: ' + email + '\n' +
    'Contact number: ' + (phone || '(not provided)') + '\n' +
    'Message:\n' + message + '\n\n' +
    'Submitted: ' + timestamp.toString();

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: subject,
    body: body
  });
}
