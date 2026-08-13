const { CALENDAR_READONLY_SCOPE, SPREADSHEETS_SCOPE, getGoogleAuthClient, getAccessToken, publicError } = require("./lib/google");
const { fetchCalendarEvents, TIME_ZONE } = require("./lib/calendar");
const { normalizeEvent, isReservableEvent } = require("./lib/event-metadata");
const { getDefaultMargin, countConfirmedParticipants, buildEventRow, buildUpsertValues, validateSheetNames } = require("./lib/sync-utils");

const DEFAULT_CALENDAR_ID = "50cc82acbe3cd97d12d3a1968ed61b223a64e72731d15e8f517eeb9e913059da@group.calendar.google.com";
const DEFAULT_SPREADSHEET_ID = "10evhMiBahDahEiR1jZJ1N3zgLey-7txLPN2z8oT_eVc";

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return response(405, { error: "Method not allowed" });
    if (!isAuthorized(event)) return response(401, { error: "Unauthorized" });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
    const authClient = getGoogleAuthClient([CALENDAR_READONLY_SCOPE, SPREADSHEETS_SCOPE]);
    const summary = await synchronizeEvents({ authClient, calendarId, spreadsheetId });
    return response(200, summary);
  } catch (error) {
    console.error("Event synchronization error", { name: error.name, message: error.message, statusCode: error.statusCode, code: error.code, stack: error.stack });
    return response(error.statusCode || 500, { error: error.publicMessage || "No s'han pogut sincronitzar les activitats." });
  }
};

function isAuthorized(event) {
  const expectedToken = process.env.SYNC_EVENTS_TOKEN;
  if (!expectedToken) throw publicError(503, "Missing SYNC_EVENTS_TOKEN", "La sincronització manual no està configurada.");
  const suppliedToken = event.headers?.authorization?.replace(/^Bearer\s+/i, "");
  return suppliedToken === expectedToken;
}

async function synchronizeEvents({ authClient, calendarId, spreadsheetId, now = new Date() }) {
  const range = { start: now, end: new Date(now.getTime() + 370 * 24 * 60 * 60 * 1000) };
  const [calendarEvents, spreadsheet] = await Promise.all([fetchCalendarEvents({ authClient, calendarId, range }), getSpreadsheet(authClient, spreadsheetId)]);
  validateSheetNames(spreadsheet.sheets.map((sheet) => sheet.properties.title));
  const [eventsRows, participantRows, configRows] = await Promise.all([
    getValues(authClient, spreadsheetId, "EVENTS!A:K"), getValues(authClient, spreadsheetId, "PARTICIPANTS!A:J"), getValues(authClient, spreadsheetId, "CONFIG!A:C")
  ]);
  const defaultMargin = getDefaultMargin(configRows);
  const participantCounts = countConfirmedParticipants(participantRows.slice(1));
  const updatedAt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, dateStyle: "short", timeStyle: "medium", hourCycle: "h23" }).format(now);
  const eventRows = calendarEvents.map(normalizeEvent).filter(isReservableEvent).map((event) => buildEventRow(event, defaultMargin, participantCounts, updatedAt));
  const upsertedRows = buildUpsertValues(eventsRows.length ? eventsRows : [["Event ID", "Activitat", "Data", "Hora", "Places previstes", "Marge extra", "Límit màxim", "Places reservades", "Places lliures", "Estat", "Última actualització"]], eventRows);
  await updateValues(authClient, spreadsheetId, "EVENTS!A1:K" + upsertedRows.length, upsertedRows);
  return { synchronized: eventRows.length, spreadsheetId, skipped: calendarEvents.length - eventRows.length };
}

async function googleRequest(authClient, url, options = {}) {
  const token = await getAccessToken(authClient, "Google APIs");
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || "Google Sheets API error";
    const publicMessage = response.status === 403 ? "El Service Account no té permís per accedir al full de càlcul." : response.status === 404 ? "No s'ha trobat el full de càlcul." : "Google Sheets no ha pogut completar la sincronització.";
    throw publicError(response.status, message, publicMessage);
  }
  return payload;
}

function getSpreadsheet(authClient, spreadsheetId) { return googleRequest(authClient, `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`); }
function getValues(authClient, spreadsheetId, range) { return googleRequest(authClient, `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`).then((payload) => payload.values || []); }
function updateValues(authClient, spreadsheetId, range, values) { return googleRequest(authClient, `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ values }) }); }
function response(statusCode, body) { return { statusCode, headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) }; }

module.exports.synchronizeEvents = synchronizeEvents;
module.exports.isAuthorized = isAuthorized;
