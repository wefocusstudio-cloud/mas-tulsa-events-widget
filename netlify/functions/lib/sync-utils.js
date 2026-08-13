const { TIME_ZONE } = require("./calendar");
const REQUIRED_SHEETS = ["EVENTS", "PARTICIPANTS", "CONFIG"];

function getDefaultMargin(configRows) {
  const row = configRows.find((values) => values[0] === "MARGE_EXTRA_PREDETERMINAT");
  const value = row?.[1];
  if (!/^\d+$/.test(String(value).trim())) throw new Error("CONFIG MARGE_EXTRA_PREDETERMINAT must be a non-negative integer");
  const margin = Number.parseInt(value, 10);
  return margin;
}

function countConfirmedParticipants(participantRows) {
  return participantRows.reduce((counts, row) => {
    const [reservationCode, eventId, , , , , , , , status] = row;
    if (reservationCode && eventId && status === "CONFIRMADA") counts.set(eventId, (counts.get(eventId) || 0) + 1);
    return counts;
  }, new Map());
}

function getEventStatus({ planned, reserved, maximum }) {
  if (reserved >= maximum) return "COMPLET";
  if (reserved > planned) return "ÚLTIMES PLACES";
  return "OBERT";
}

function toMadridDateTime(start, allDay) {
  if (!start) return { date: "", time: "" };
  if (allDay) return { date: start.slice(0, 10), time: "" };
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(start)).reduce((values, part) => ({ ...values, [part.type]: part.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function buildEventRow(event, defaultMargin, participantCounts, updatedAt) {
  const margin = event.margin === null ? defaultMargin : event.margin;
  const planned = event.places;
  const maximum = planned + margin;
  const reserved = participantCounts.get(event.id) || 0;
  const { date, time } = toMadridDateTime(event.start, event.allDay);
  return [event.id, event.title, date, time, planned, margin, maximum, reserved, Math.max(maximum - reserved, 0), getEventStatus({ planned, reserved, maximum }), updatedAt];
}

function buildUpsertValues(existingRows, eventRows) {
  const rows = existingRows.map((row) => row.slice(0, 11));
  const byEventId = new Map(rows.slice(1).map((row, index) => [row[0], index + 1]).filter(([eventId]) => eventId));
  eventRows.forEach((eventRow) => {
    const existingIndex = byEventId.get(eventRow[0]);
    if (existingIndex === undefined) rows.push(eventRow);
    else rows[existingIndex] = eventRow;
  });
  return rows;
}

function validateSheetNames(sheetNames) {
  const missing = REQUIRED_SHEETS.filter((name) => !sheetNames.includes(name));
  if (missing.length) throw new Error(`Missing required sheets: ${missing.join(", ")}`);
}

module.exports = { getDefaultMargin, countConfirmedParticipants, getEventStatus, toMadridDateTime, buildEventRow, buildUpsertValues, validateSheetNames };
