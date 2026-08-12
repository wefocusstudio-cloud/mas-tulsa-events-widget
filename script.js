const API_ENDPOINT = "/api/events";
const TIME_ZONE = "Europe/Madrid";
const DEFAULT_LANGUAGE = "es";
const SUPPORTED_LANGUAGES = ["es", "ca", "en", "fr"];
const EVENT_IMAGE_DIRECTORY = "/images/events/";
const EVENT_IMAGE_EXTENSION = ".jpg";
const MAS_TULSA_LOCATION_LABEL = "Mas Tulsà · Palol de Revardit, Girona";
const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=";

const TRANSLATIONS = {
  es: {
    locale: "es-ES",
    documentTitle: "Agenda de actividades | Mas Tulsà",
    metaDescription: "Agenda mensual de actividades de Mas Tulsà.",
    today: "Hoy",
    calendarEyebrow: "Calendario",
    activitiesEyebrow: "Mas Tulsà · Agenda",
    activitiesTitle: "Actividades de {month}",
    activityCount: {
      zero: "Sin actividades",
      one: "1 actividad",
      other: "{count} actividades"
    },
    legend: "Día con actividad",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    selectDate: "Seleccionar {date}",
    eventsOnDate: {
      one: "1 actividad",
      other: "{count} actividades"
    },
    loading: "Cargando las actividades del mes…",
    emptyTitle: "Un mes para disfrutar con calma.",
    emptyCopy: "No hay actividades programadas este mes.",
    errorTitle: "No hemos podido cargar la agenda.",
    errorCopy: "Inténtalo de nuevo dentro de unos instantes.",
    retry: "Volver a intentar",
    untitledEvent: "Actividad sin título",
    allDay: "Todo el día",
    location: "Lugar",
    duration: "Duración",
    places: "Plazas",
    price: "Precio",
    imageAlt: "{title}, actividad de Mas Tulsà",
    defaultCta: "Reservar",
    eventSelected: "Actividades destacadas para {date}"
  },
  ca: {
    locale: "ca-ES",
    documentTitle: "Agenda d'activitats | Mas Tulsà",
    metaDescription: "Agenda mensual d'activitats de Mas Tulsà.",
    today: "Avui",
    calendarEyebrow: "Calendari",
    activitiesEyebrow: "Mas Tulsà · Agenda",
    activitiesTitle: "Activitats · {month}",
    activityCount: {
      zero: "Sense activitats",
      one: "1 activitat",
      other: "{count} activitats"
    },
    legend: "Dia amb activitat",
    previousMonth: "Mes anterior",
    nextMonth: "Mes següent",
    selectDate: "Seleccionar {date}",
    eventsOnDate: {
      one: "1 activitat",
      other: "{count} activitats"
    },
    loading: "Carregant les activitats del mes…",
    emptyTitle: "Un mes per gaudir amb calma.",
    emptyCopy: "No hi ha activitats programades aquest mes.",
    errorTitle: "No hem pogut carregar l'agenda.",
    errorCopy: "Torna-ho a provar d'aquí a uns instants.",
    retry: "Tornar-ho a provar",
    untitledEvent: "Activitat sense títol",
    allDay: "Tot el dia",
    location: "Lloc",
    duration: "Durada",
    places: "Places",
    price: "Preu",
    imageAlt: "{title}, activitat de Mas Tulsà",
    defaultCta: "Reservar",
    eventSelected: "Activitats destacades per al {date}"
  },
  en: {
    locale: "en-GB",
    documentTitle: "Activities calendar | Mas Tulsà",
    metaDescription: "Mas Tulsà's monthly activities calendar.",
    today: "Today",
    calendarEyebrow: "Calendar",
    activitiesEyebrow: "Mas Tulsà · What’s on",
    activitiesTitle: "{month} activities",
    activityCount: {
      zero: "No activities",
      one: "1 activity",
      other: "{count} activities"
    },
    legend: "Day with an activity",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    selectDate: "Select {date}",
    eventsOnDate: {
      one: "1 activity",
      other: "{count} activities"
    },
    loading: "Loading this month’s activities…",
    emptyTitle: "A month to enjoy at your own pace.",
    emptyCopy: "There are no activities scheduled this month.",
    errorTitle: "We couldn’t load the calendar.",
    errorCopy: "Please try again in a few moments.",
    retry: "Try again",
    untitledEvent: "Untitled activity",
    allDay: "All day",
    location: "Location",
    duration: "Duration",
    places: "Places",
    price: "Price",
    imageAlt: "{title}, an activity at Mas Tulsà",
    defaultCta: "Book now",
    eventSelected: "Highlighted activities for {date}"
  },
  fr: {
    locale: "fr-FR",
    documentTitle: "Agenda des activités | Mas Tulsà",
    metaDescription: "Agenda mensuel des activités de Mas Tulsà.",
    today: "Aujourd’hui",
    calendarEyebrow: "Calendrier",
    activitiesEyebrow: "Mas Tulsà · Agenda",
    activitiesTitle: "Activités en {month}",
    activityCount: {
      zero: "Aucune activité",
      one: "1 activité",
      other: "{count} activités"
    },
    legend: "Jour avec une activité",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    selectDate: "Sélectionner le {date}",
    eventsOnDate: {
      one: "1 activité",
      other: "{count} activités"
    },
    loading: "Chargement des activités du mois…",
    emptyTitle: "Un mois à savourer en toute tranquillité.",
    emptyCopy: "Aucune activité n’est programmée ce mois-ci.",
    errorTitle: "Nous n’avons pas pu charger l’agenda.",
    errorCopy: "Veuillez réessayer dans quelques instants.",
    retry: "Réessayer",
    untitledEvent: "Activité sans titre",
    allDay: "Toute la journée",
    location: "Lieu",
    duration: "Durée",
    places: "Places",
    price: "Prix",
    imageAlt: "{title}, activité de Mas Tulsà",
    defaultCta: "Réserver",
    eventSelected: "Activités mises en avant pour le {date}"
  }
};

const language = getLanguage();
const copy = TRANSLATIONS[language];
const todayParts = getTodayParts();

const state = {
  visibleYear: todayParts.year,
  visibleMonth: todayParts.month - 1,
  selectedDate: null,
  events: [],
  eventsByDate: new Map(),
  requestController: null
};

const elements = {
  metaDescription: document.querySelector("[data-meta-description]"),
  todayLabel: document.querySelector("[data-today-label]"),
  todayNumber: document.querySelector("[data-today-number]"),
  calendarEyebrow: document.querySelector("[data-calendar-eyebrow]"),
  calendarMonth: document.querySelector("[data-calendar-month]"),
  calendarYear: document.querySelector("[data-calendar-year]"),
  previousMonth: document.querySelector("[data-previous-month]"),
  nextMonth: document.querySelector("[data-next-month]"),
  weekdays: document.querySelector("[data-weekdays]"),
  calendarGrid: document.querySelector("[data-calendar-grid]"),
  legendText: document.querySelector("[data-legend-text]"),
  activitiesEyebrow: document.querySelector("[data-activities-eyebrow]"),
  activitiesTitle: document.querySelector("[data-activities-title]"),
  activitiesSummary: document.querySelector("[data-activities-summary]"),
  activitiesBody: document.querySelector("[data-activities-body]"),
  list: document.querySelector("[data-events-list]"),
  loadingText: document.querySelector("[data-loading-text]"),
  emptyTitle: document.querySelector("[data-empty-title]"),
  emptyCopy: document.querySelector("[data-empty-copy]"),
  errorTitle: document.querySelector("[data-error-title]"),
  errorCopy: document.querySelector("[data-error-copy]"),
  retry: document.querySelector("[data-retry]"),
  cardTemplate: document.querySelector("#event-card-template"),
  metadataTemplate: document.querySelector("#metadata-item-template"),
  states: {
    loading: document.querySelector('[data-state="loading"]'),
    empty: document.querySelector('[data-state="empty"]'),
    error: document.querySelector('[data-state="error"]')
  }
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  renderInterfaceCopy();
  renderWeekdays();
  bindInteractions();
  renderCalendar();
  loadMonthEvents();
}

function getLanguage() {
  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  return SUPPORTED_LANGUAGES.includes(requestedLanguage)
    ? requestedLanguage
    : DEFAULT_LANGUAGE;
}

function renderInterfaceCopy() {
  document.documentElement.lang = language;
  document.title = copy.documentTitle;
  elements.metaDescription.content = copy.metaDescription;
  elements.todayLabel.textContent = copy.today;
  elements.todayNumber.textContent = todayParts.day;
  elements.calendarEyebrow.textContent = copy.calendarEyebrow;
  elements.legendText.textContent = copy.legend;
  elements.activitiesEyebrow.textContent = copy.activitiesEyebrow;
  elements.loadingText.textContent = copy.loading;
  elements.emptyTitle.textContent = copy.emptyTitle;
  elements.emptyCopy.textContent = copy.emptyCopy;
  elements.errorTitle.textContent = copy.errorTitle;
  elements.errorCopy.textContent = copy.errorCopy;
  elements.retry.textContent = copy.retry;
  elements.previousMonth.setAttribute("aria-label", copy.previousMonth);
  elements.nextMonth.setAttribute("aria-label", copy.nextMonth);
}

function renderWeekdays() {
  const monday = new Date(Date.UTC(2024, 0, 1));
  const formatter = new Intl.DateTimeFormat(copy.locale, {
    weekday: "narrow",
    timeZone: "UTC"
  });

  elements.weekdays.replaceChildren(
    ...Array.from({ length: 7 }, (_, index) => {
      const weekday = document.createElement("abbr");
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      weekday.className = "calendar__weekday";
      weekday.textContent = formatter.format(date);
      weekday.title = new Intl.DateTimeFormat(copy.locale, {
        weekday: "long",
        timeZone: "UTC"
      }).format(date);
      return weekday;
    })
  );
}

function bindInteractions() {
  elements.previousMonth.addEventListener("click", () => changeMonth(-1));
  elements.nextMonth.addEventListener("click", () => changeMonth(1));
  elements.retry.addEventListener("click", loadMonthEvents);
}

function changeMonth(offset) {
  const nextMonth = new Date(Date.UTC(state.visibleYear, state.visibleMonth + offset, 1));
  state.visibleYear = nextMonth.getUTCFullYear();
  state.visibleMonth = nextMonth.getUTCMonth();
  state.selectedDate = null;
  state.events = [];
  state.eventsByDate = new Map();
  renderCalendar();
  loadMonthEvents();
}

async function loadMonthEvents() {
  state.requestController?.abort();
  state.requestController = new AbortController();
  setViewState("loading");

  try {
    const events = await fetchMonthEvents(state.requestController.signal);
    state.events = processEvents(events);
    state.eventsByDate = groupEventsByDate(state.events);
    renderCalendar();
    renderEvents();
    setViewState(state.events.length ? "ready" : "empty");
  } catch (error) {
    if (error.name !== "AbortError") {
      setViewState("error");
    }
  }
}

async function fetchMonthEvents(signal) {
  const { start, end } = getVisibleMonthRange();
  const params = new URLSearchParams({ start, end });
  const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error("Events request failed");
  }

  return Array.isArray(payload.events) ? payload.events : [];
}

function getVisibleMonthRange() {
  const nextMonth = new Date(Date.UTC(state.visibleYear, state.visibleMonth + 1, 1));
  return {
    start: createDateKey(state.visibleYear, state.visibleMonth + 1, 1),
    end: createDateKey(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 1)
  };
}

function processEvents(events) {
  const visibleRange = getVisibleMonthRange();

  return events
    .filter((event) => {
      if (!event?.start) return false;
      return !Number.isNaN(parseEventDate(event.start, event.allDay).getTime());
    })
    .map((event) => ({
      ...event,
      dateKey: getEventDateKey(event),
      metadata: {
        duration: hasValue(event.duration) ? event.duration : null,
        places: hasValue(event.places) ? event.places : null,
        price: hasValue(event.price) ? event.price : null
      }
    }))
    .filter((event) => {
      return event.dateKey >= visibleRange.start && event.dateKey < visibleRange.end;
    })
    .sort((firstEvent, secondEvent) => {
      return getSortableDate(firstEvent) - getSortableDate(secondEvent);
    });
}

function groupEventsByDate(events) {
  return events.reduce((eventsByDate, event) => {
    const dayEvents = eventsByDate.get(event.dateKey) || [];
    dayEvents.push(event);
    eventsByDate.set(event.dateKey, dayEvents);
    return eventsByDate;
  }, new Map());
}

function renderCalendar() {
  const monthDate = new Date(Date.UTC(state.visibleYear, state.visibleMonth, 1));
  const monthName = formatMonth(monthDate);
  const daysInMonth = new Date(
    Date.UTC(state.visibleYear, state.visibleMonth + 1, 0)
  ).getUTCDate();
  const mondayOffset = (monthDate.getUTCDay() + 6) % 7;

  elements.calendarMonth.textContent = capitalize(monthName);
  elements.calendarYear.textContent = state.visibleYear;
  elements.activitiesTitle.textContent = interpolate(copy.activitiesTitle, {
    month: monthName
  });
  elements.activitiesSummary.textContent = formatCount(state.events.length, copy.activityCount);

  const calendarCells = Array.from({ length: mondayOffset }, () => {
    const blank = document.createElement("span");
    blank.className = "calendar__blank";
    blank.setAttribute("aria-hidden", "true");
    return blank;
  });

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(createCalendarDay(day));
  }

  elements.calendarGrid.replaceChildren(...calendarCells);
}

function createCalendarDay(day) {
  const dateKey = createDateKey(state.visibleYear, state.visibleMonth + 1, day);
  const dayEvents = state.eventsByDate.get(dateKey) || [];
  const isToday = dateKey === todayParts.dateKey;
  const isSelected = dateKey === state.selectedDate;
  const dateLabel = formatCalendarDate(state.visibleYear, state.visibleMonth, day);
  const button = document.createElement("button");

  button.className = "calendar__day";
  button.type = "button";
  button.dataset.date = dateKey;
  button.textContent = day;
  button.setAttribute("aria-label", getCalendarDayLabel(dateLabel, dayEvents.length));
  button.setAttribute("aria-pressed", String(isSelected));

  if (isToday) {
    button.classList.add("is-today");
    button.setAttribute("aria-current", "date");
  }
  if (dayEvents.length) button.classList.add("has-events");
  if (isSelected) button.classList.add("is-selected");

  button.addEventListener("click", () => selectDate(dateKey));
  return button;
}

function getCalendarDayLabel(dateLabel, eventCount) {
  const selectionLabel = interpolate(copy.selectDate, { date: dateLabel });

  if (!eventCount) return selectionLabel;

  return `${selectionLabel}. ${formatCount(eventCount, copy.eventsOnDate)}`;
}

function selectDate(dateKey) {
  state.selectedDate = dateKey;
  renderCalendar();
  highlightSelectedEvents();

  const firstMatchingEvent = elements.list.querySelector(`[data-event-date="${dateKey}"]`);
  if (firstMatchingEvent) {
    firstMatchingEvent.scrollIntoView({ behavior: "smooth", block: "center" });
    firstMatchingEvent.focus({ preventScroll: true });
  }
}

function renderEvents() {
  const cards = state.events.map((event, index) => createEventCard(event, index));
  elements.list.replaceChildren(...cards);
  highlightSelectedEvents();
}

function createEventCard(event, index) {
  const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
  const title = event.title || copy.untitledEvent;
  const media = card.querySelector(".event-card__media");
  const image = card.querySelector(".event-card__image");
  const imagePath = resolveEventImage(event.image);

  card.dataset.eventDate = event.dateKey;
  card.tabIndex = -1;
  card.style.animationDelay = `${Math.min(index * 55, 220)}ms`;
  card.querySelector("[data-event-category]").textContent = event.category || "";
  card.querySelector("[data-event-title]").textContent = title;
  card.querySelector("[data-event-date]").textContent = formatEventDateTime(event);
  card.querySelector("[data-event-description]").textContent = cleanEventDescription(
    event.description
  );

  renderEventImage({ image, media, imagePath, title });
  renderLocation(card, event.location);
  renderMetadata(card, event.metadata);
  renderCallToAction(card, event.button);

  return card;
}

function renderEventImage({ image, media, imagePath, title }) {
  if (!imagePath) {
    media.classList.add("has-fallback");
    return;
  }

  image.src = imagePath;
  image.alt = interpolate(copy.imageAlt, { title });
  image.addEventListener("error", () => {
    image.removeAttribute("src");
    image.alt = "";
    media.classList.add("has-fallback");
  });
}

function renderLocation(card, location) {
  const locationRow = card.querySelector("[data-event-location-row]");

  if (!hasValue(location)) {
    locationRow.remove();
    return;
  }

  card.querySelector("[data-location-label]").textContent = copy.location;
  const locationLink = card.querySelector("[data-event-location]");
  locationLink.textContent = getLocationLabel(location);
  locationLink.href = createGoogleMapsUrl(location);
}

function cleanEventDescription(description) {
  if (!hasValue(description)) return "";
  return String(description)
    .trim()
    .replace(/(?:^|\r?\n)[ \t]*---[ \t]*$/, "")
    .trim();
}

function isMasTulsaLocation(location) {
  return String(location)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("mas tulsa");
}

function getLocationLabel(location) {
  return isMasTulsaLocation(location) ? MAS_TULSA_LOCATION_LABEL : location;
}

function createGoogleMapsUrl(location) {
  return `${GOOGLE_MAPS_SEARCH_URL}${encodeURIComponent(location)}`;
}

function renderMetadata(card, metadata) {
  const metadataList = card.querySelector("[data-event-metadata]");
  const items = [
    [copy.duration, metadata.duration],
    [copy.places, metadata.places],
    [copy.price, formatPrice(metadata.price)]
  ].filter(([, value]) => hasValue(value));

  if (!items.length) {
    metadataList.remove();
    return;
  }

  metadataList.replaceChildren(
    ...items.map(([label, value]) => {
      const item = elements.metadataTemplate.content.firstElementChild.cloneNode(true);
      item.querySelector("dt").textContent = label;
      item.querySelector("dd").textContent = value;
      return item;
    })
  );
}

function renderCallToAction(card, buttonLabel) {
  const button = card.querySelector("[data-event-cta]");

  if (!hasValue(buttonLabel)) {
    button.remove();
    return;
  }

  button.querySelector("[data-event-cta-label]").textContent = buttonLabel || copy.defaultCta;
}

function highlightSelectedEvents() {
  const cards = elements.list.querySelectorAll(".event-card");
  cards.forEach((card) => {
    const highlighted = Boolean(state.selectedDate) && card.dataset.eventDate === state.selectedDate;
    const selectedMessage = card.querySelector("[data-selected-message]");
    card.classList.toggle("is-highlighted", highlighted);

    if (highlighted) {
      const dateLabel = formatDateKey(state.selectedDate);
      selectedMessage.textContent = interpolate(copy.eventSelected, { date: dateLabel });
    } else {
      selectedMessage.textContent = "";
    }
  });
}

function setViewState(viewState) {
  const isReady = viewState === "ready";

  if (viewState === "loading" || viewState === "error") {
    elements.activitiesSummary.textContent = "";
  }

  Object.entries(elements.states).forEach(([name, element]) => {
    element.hidden = name !== viewState;
  });

  elements.list.hidden = !isReady;
  elements.activitiesBody.setAttribute("aria-busy", String(viewState === "loading"));
}

function getTodayParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  return { year, month, day, dateKey: createDateKey(year, month, day) };
}

function getEventDateKey(event) {
  if (event.allDay && /^\d{4}-\d{2}-\d{2}$/.test(event.start)) {
    return event.start;
  }

  const date = new Date(event.start);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatEventDateTime(event) {
  const startDate = parseEventDate(event.start, event.allDay);
  const date = new Intl.DateTimeFormat(copy.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: event.allDay ? "UTC" : TIME_ZONE
  }).format(startDate);

  if (event.allDay) {
    return `${capitalize(date)} · ${copy.allDay}`;
  }

  const timeFormatter = new Intl.DateTimeFormat(copy.locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE
  });
  const startTime = timeFormatter.format(startDate);
  const endDate = event.end ? new Date(event.end) : null;
  const endTime = endDate && !Number.isNaN(endDate.getTime()) ? timeFormatter.format(endDate) : null;

  return `${capitalize(date)} · ${startTime}${endTime ? `–${endTime}` : ""}`;
}

function formatCalendarDate(year, month, day) {
  return new Intl.DateTimeFormat(copy.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month, day)));
}

function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return formatCalendarDate(year, month - 1, day);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat(copy.locale, {
    month: "long",
    timeZone: "UTC"
  }).format(date);
}

function formatCount(count, labels) {
  if (count === 0 && labels.zero) return labels.zero;
  return interpolate(count === 1 ? labels.one : labels.other, { count });
}

function formatPrice(price) {
  if (!hasValue(price)) return null;
  const value = String(price).trim();
  return /^\d+(?:[.,]\d+)?$/.test(value) ? `${value} €` : value;
}

function parseEventDate(value, allDay) {
  if (allDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  return new Date(value);
}

function getSortableDate(event) {
  return parseEventDate(event.start, event.allDay).getTime();
}

function resolveEventImage(imageIdentifier) {
  if (!hasValue(imageIdentifier)) return null;
  const identifier = String(imageIdentifier).trim().replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return /^[a-z0-9_-]+$/i.test(identifier)
    ? `${EVENT_IMAGE_DIRECTORY}${encodeURIComponent(identifier)}${EVENT_IMAGE_EXTENSION}`
    : null;
}

function createDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function capitalize(value) {
  return value ? value.charAt(0).toLocaleUpperCase(copy.locale) + value.slice(1) : value;
}

function interpolate(template, values) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}
