const { JWT } = require("google-auth-library");

const DEFAULT_CALENDAR_ID =
  "50cc82acbe3cd97d12d3a1968ed61b223a64e72731d15e8f517eeb9e913059da@group.calendar.google.com";
const TIME_ZONE = "Europe/Madrid";
const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
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
    const authClient = getGoogleAuthClient();
    const googleEvents = await fetchCalendarEvents({ authClient, calendarId, range });

    return response(200, {
      events: googleEvents.map(normalizeEvent)
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

function getGoogleAuthClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    const error = new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
    error.statusCode = 500;
    error.publicMessage = "Falta configurar la variable GOOGLE_SERVICE_ACCOUNT_JSON.";
    throw error;
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (parseError) {
    const error = new Error(`Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ${parseError.message}`);
    error.statusCode = 500;
    error.publicMessage = "La variable GOOGLE_SERVICE_ACCOUNT_JSON no és un JSON vàlid.";
    throw error;
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    const error = new Error("Service account JSON missing client_email or private_key");
    error.statusCode = 500;
    error.publicMessage =
      "La variable GOOGLE_SERVICE_ACCOUNT_JSON no conté client_email o private_key.";
    throw error;
  }

  return new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key.replace(/\\n/g, "\n"),
    scopes: [CALENDAR_READONLY_SCOPE]
  });
}

async function fetchCalendarEvents({ authClient, calendarId, range }) {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );

  url.search = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString(),
    timeZone: TIME_ZONE,
    maxResults: String(MAX_RESULTS)
  }).toString();

  const { token } = await authClient.getAccessToken();

  if (!token) {
    const error = new Error("Could not obtain Google access token");
    error.statusCode = 500;
    error.publicMessage = "No s'ha pogut autenticar amb Google Calendar.";
    throw error;
  }

  const googleResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  const payload = await googleResponse.json().catch(() => ({}));

  if (!googleResponse.ok) {
    const message = payload.error?.message || "Google Calendar API error";
    const error = new Error(message);
    error.statusCode = googleResponse.status;
    error.publicMessage = "Google Calendar no ha retornat les activitats.";
    throw error;
  }

  return Array.isArray(payload.items) ? payload.items : [];
}

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

function normalizeEvent(calendarEvent) {
  const allDay = Boolean(calendarEvent.start?.date);
  const rawDescription = normalizeDescription(calendarEvent.description || "");
  const { metadata, description } = parseMetadata(rawDescription);

  return {
    id: calendarEvent.id,
    title: calendarEvent.summary || "Activitat sense títol",
    start: calendarEvent.start?.dateTime || calendarEvent.start?.date || null,
    end: calendarEvent.end?.dateTime || calendarEvent.end?.date || null,
    allDay,
    location: calendarEvent.location || "",
    description,
    category: metadata.category,
    price: metadata.price,
    places: metadata.places,
    duration: metadata.duration,
    image: metadata.image,
    button: metadata.button
  };
}

function normalizeDescription(description) {
  return description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseMetadata(description) {
  const metadata = {
    category: null,
    price: null,
    places: null,
    duration: null,
    image: null,
    button: null
  };
  const contentLines = [];

  description.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([a-zA-ZÀ-ÿ_-]+)\s*[:=]\s*(.+?)\s*$/);

    if (!match) {
      contentLines.push(line);
      return;
    }

    const key = normalizeMetadataKey(match[1]);
    const value = match[2].trim();

    if (!key) {
      contentLines.push(line);
      return;
    }

    metadata[key] = normalizeMetadataValue(key, value);
  });

  return {
    metadata,
    description: contentLines.join("\n").trim()
  };
}

function normalizeMetadataKey(key) {
  const normalizedKey = key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const aliases = {
    categoria: "category",
    category: "category",
    preu: "price",
    price: "price",
    precio: "price",
    places: "places",
    plazas: "places",
    durada: "duration",
    duration: "duration",
    imatge: "image",
    imagen: "image",
    image: "image",
    boto: "button",
    boton: "button",
    button: "button"
  };

  return aliases[normalizedKey] || null;
}

function normalizeMetadataValue(key, value) {
  if (key === "places") {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isNaN(parsedValue) ? value : parsedValue;
  }

  return value;
}

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
