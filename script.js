const API_ENDPOINT = "/api/events";
const TIME_ZONE = "Europe/Madrid";
const LOCALE = "ca-ES";

const elements = {
  eventsSection: document.querySelector(".events"),
  list: document.querySelector("[data-events-list]"),
  today: document.querySelector("[data-today]"),
  errorMessage: document.querySelector("[data-error-message]"),
  states: {
    loading: document.querySelector('[data-state="loading"]'),
    empty: document.querySelector('[data-state="empty"]'),
    error: document.querySelector('[data-state="error"]')
  }
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  renderToday();
  await loadEvents();
}

async function loadEvents() {
  setState("loading");

  try {
    const events = await fetchEvents();
    const processedEvents = processEvents(events);
    renderEvents(processedEvents);
    setState(processedEvents.length ? "ready" : "empty");
  } catch (error) {
    setState("error", error);
  }
}

async function fetchEvents() {
  const params = new URLSearchParams({
    start: new Date().toISOString()
  });
  const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "No s'ha pogut obtenir la resposta del servidor.");
  }

  return Array.isArray(payload.events) ? payload.events : [];
}

function processEvents(events) {
  return events
    .map((event) => ({
      ...event,
      metadata: parseEventMetadata(event)
    }))
    .sort((firstEvent, secondEvent) => {
      return getSortableDate(firstEvent.start) - getSortableDate(secondEvent.start);
    });
}

function parseEventMetadata(event) {
  return {
    category: event.category || null,
    price: event.price || null,
    places: event.places || null,
    duration: event.duration || null,
    image: event.image || null,
    button: event.button || null
  };
}

function renderEvents(events) {
  elements.list.replaceChildren(...events.map(createEventCard));
}

function createEventCard(event) {
  const article = document.createElement("article");
  article.className = "event-card";

  const title = event.title || "Activitat sense títol";
  const dateInfo = formatEventDate(event);
  const timeInfo = formatEventTime(event);

  article.innerHTML = `
    <div class="event-card__date" aria-hidden="true">
      <span class="event-card__day">${escapeHtml(dateInfo.day)}</span>
      <span class="event-card__month">${escapeHtml(dateInfo.month)}</span>
    </div>
    <div class="event-card__content">
      <p class="event-card__label">${escapeHtml(dateInfo.weekday)}</p>
      <h2>${escapeHtml(title)}</h2>
      <dl class="event-card__details">
        <div>
          <dt>Data</dt>
          <dd>${escapeHtml(dateInfo.fullDate)}</dd>
        </div>
        <div>
          <dt>Inici</dt>
          <dd>${escapeHtml(timeInfo.start)}</dd>
        </div>
        <div>
          <dt>Final</dt>
          <dd>${escapeHtml(timeInfo.end)}</dd>
        </div>
        <div>
          <dt>Ubicació</dt>
          <dd>${escapeHtml(event.location || "Per confirmar")}</dd>
        </div>
      </dl>
      ${event.description ? `<p class="event-card__description">${escapeHtml(event.description)}</p>` : ""}
    </div>
  `;

  return article;
}

function setState(stateName, error = null) {
  const isReady = stateName === "ready";

  Object.entries(elements.states).forEach(([name, element]) => {
    element.hidden = name !== stateName;
  });

  elements.list.hidden = !isReady;
  elements.eventsSection.setAttribute("aria-busy", stateName === "loading" ? "true" : "false");

  if (error && elements.errorMessage) {
    elements.errorMessage.textContent = error.message;
  }
}

function renderToday() {
  const formatter = new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "full",
    timeZone: TIME_ZONE
  });
  elements.today.textContent = `Avui: ${formatter.format(new Date())}`;
}

function formatEventDate(event) {
  const startDate = parseCalendarDate(event.start);
  const day = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    timeZone: TIME_ZONE
  }).format(startDate);
  const month = new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    timeZone: TIME_ZONE
  }).format(startDate);
  const weekday = new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    timeZone: TIME_ZONE
  }).format(startDate);
  const fullDate = new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "full",
    timeZone: TIME_ZONE
  }).format(startDate);

  return { day, month, weekday, fullDate };
}

function formatEventTime(event) {
  if (event.allDay) {
    return {
      start: "Tot el dia",
      end: "Tot el dia"
    };
  }

  const formatter = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE
  });

  return {
    start: formatter.format(parseCalendarDate(event.start)),
    end: formatter.format(parseCalendarDate(event.end))
  };
}

function parseCalendarDate(value) {
  if (!value) {
    return new Date();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00+01:00`);
  }

  return new Date(value);
}

function getSortableDate(value) {
  return parseCalendarDate(value).getTime();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
