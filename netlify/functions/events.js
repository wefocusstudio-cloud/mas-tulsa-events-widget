const { CALENDAR_READONLY_SCOPE, getGoogleAuthClient } = require("./lib/google");
const { fetchCalendarEvents } = require("./lib/calendar");
const { normalizeEvent } = require("./lib/event-metadata");

const DEFAULT_CALENDAR_ID =
  "50cc82acbe3cd97d12d3a1968ed61b223a64e72731d15e8f517eeb9e913059da@group.calendar.google.com";
const TIME_ZONE = "Europe/Madrid";
const DEFAULT_RANGE_DAYS = 90;
const MAX_RANGE_DAYS = 370;
const MAX_RESULTS = 100;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(204, "");
  }

  if (event.httpMethod !== "GET") {
    return response(405, { error: "Method not allowed" });
  }

  try {
    const range = getDateRange(event.queryStringParameters || {});
    const calendarId = process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
    const authClient = getGoogleAuthClient([CALENDAR_READONLY_SCOPE]);
    const googleEvents = await fetchCalendarEvents({ authClient, calendarId, range });

    return response(200, {
      events: googleEvents.map(normalizeEvent).map(toPublicEvent)
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    console.error("Calendar events function error", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      stack: error.stack
    });

    return response(statusCode, {
      error: error.publicMessage || "No s'han pogut carregar les activitats.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};


function getDateRange(query) {
  const now = new Date();
  const start = parseQueryDate(query.start, now);
  const fallbackEnd = addDays(start, DEFAULT_RANGE_DAYS);
  const end = parseQueryDate(query.end, fallbackEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const error = new Error("Invalid date range");
    error.statusCode = 400;
    error.publicMessage = "El rang de dates no és vàlid.";
    throw error;
  }

  if (end <= start) {
    const error = new Error("End date must be after start date");
    error.statusCode = 400;
    error.publicMessage = "La data final ha de ser posterior a la data inicial.";
    throw error;
  }

  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    const error = new Error("Date range too large");
    error.statusCode = 400;
    error.publicMessage = "El rang de dates sol·licitat és massa ampli.";
    throw error;
  }

  return { start, end };
}

function parseQueryDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+01:00`);
  }

  return new Date(value);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function toPublicEvent({ margin, ...event }) {
  return event;
}

exports.toPublicEvent = toPublicEvent;

function response(statusCode, body) {
  const isJson = body !== "";

  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      ...(isJson ? { "Content-Type": "application/json; charset=utf-8" } : {})
    },
    body: isJson ? JSON.stringify(body) : ""
  };
}
