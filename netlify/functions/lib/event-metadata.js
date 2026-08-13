function normalizeDescription(description) {
  return description.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function parseMetadata(description) {
  const metadata = { category: null, price: null, places: null, duration: null, image: null, button: null, margin: null };
  const contentLines = [];
  description.split(/\r?\n/).forEach((line) => {
    if (/^\s*---\s*$/.test(line)) return;
    const match = line.match(/^\s*([a-zA-ZÀ-ÿ_-]+)\s*[:=]\s*(.*?)\s*$/);
    if (!match) return contentLines.push(line);
    const key = normalizeMetadataKey(match[1]);
    if (!key) return contentLines.push(line);
    metadata[key] = normalizeMetadataValue(key, match[2].trim());
  });
  return { metadata, description: contentLines.join("\n").trim() };
}

function normalizeMetadataKey(key) {
  const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const aliases = { categoria: "category", category: "category", preu: "price", price: "price", precio: "price", places: "places", plazas: "places", durada: "duration", duration: "duration", imatge: "image", imagen: "image", image: "image", boto: "button", boton: "button", button: "button", marge: "margin", margen: "margin", margin: "margin" };
  return aliases[normalizedKey] || null;
}

function normalizeMetadataValue(key, value) {
  if (key === "places" || key === "margin") return parsePositiveInteger(value);
  return value;
}

function parsePositiveInteger(value) {
  if (!/^\d+$/.test(String(value).trim())) return null;
  const parsedValue = Number.parseInt(value, 10);
  return parsedValue > 0 ? parsedValue : null;
}

function normalizeEvent(calendarEvent) {
  const allDay = Boolean(calendarEvent.start?.date);
  const { metadata, description } = parseMetadata(normalizeDescription(calendarEvent.description || ""));
  return { id: calendarEvent.id, title: calendarEvent.summary || "Activitat sense títol", start: calendarEvent.start?.dateTime || calendarEvent.start?.date || null, end: calendarEvent.end?.dateTime || calendarEvent.end?.date || null, allDay, location: calendarEvent.location || "", description, category: metadata.category, price: metadata.price, places: metadata.places, duration: metadata.duration, image: metadata.image, button: metadata.button, margin: metadata.margin };
}

function isReservableEvent(event) { return Number.isInteger(event.places) && event.places > 0 && typeof event.button === "string" && event.button.trim().length > 0; }

module.exports = { normalizeDescription, parseMetadata, normalizeEvent, isReservableEvent, parsePositiveInteger };
