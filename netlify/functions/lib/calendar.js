const { getAccessToken, publicError } = require("./google");

const TIME_ZONE = "Europe/Madrid";
const MAX_RESULTS = 100;

async function fetchCalendarEvents({ authClient, calendarId, range }) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.search = new URLSearchParams({ singleEvents: "true", orderBy: "startTime", timeMin: range.start.toISOString(), timeMax: range.end.toISOString(), timeZone: TIME_ZONE, maxResults: String(MAX_RESULTS) }).toString();
  const token = await getAccessToken(authClient, "Calendar");
  const googleResponse = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  const payload = await googleResponse.json().catch(() => ({}));
  if (!googleResponse.ok) {
    throw publicError(googleResponse.status, payload.error?.message || "Google Calendar API error", "Google Calendar no ha retornat les activitats.");
  }
  return Array.isArray(payload.items) ? payload.items : [];
}

module.exports = { TIME_ZONE, fetchCalendarEvents };
