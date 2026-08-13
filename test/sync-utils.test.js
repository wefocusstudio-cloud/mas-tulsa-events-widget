const test = require("node:test");
const assert = require("node:assert/strict");
const { parseMetadata, normalizeEvent, isReservableEvent } = require("../netlify/functions/lib/event-metadata");
const { getDefaultMargin, countConfirmedParticipants, getEventStatus, buildEventRow, buildUpsertValues } = require("../netlify/functions/lib/sync-utils");
const { toPublicEvent } = require("../netlify/functions/events");

test("parses marge aliases as a positive integer and omits metadata from the description", () => {
  for (const key of ["marge", "margen", "margin"]) {
    const { metadata, description } = parseMetadata(`Taller\n---\nplaces=15\n${key}=3\nboto=Reserva`);
    assert.equal(metadata.margin, 3);
    assert.equal(description, "Taller");
  }
  assert.equal(parseMetadata("marge=0").metadata.margin, null);
  assert.equal(parseMetadata("marge=3.5").metadata.margin, null);
});

test("only events with positive places and a non-empty button are reservable", () => {
  const base = { id: "event-1", summary: "Taller", start: { dateTime: "2026-08-20T10:00:00+02:00" }, description: "places=15\nboto=Reserva" };
  assert.equal(isReservableEvent(normalizeEvent(base)), true);
  assert.equal(isReservableEvent(normalizeEvent({ ...base, description: "places=15" })), false);
  assert.equal(isReservableEvent(normalizeEvent({ ...base, description: "places=0\nboto=Reserva" })), false);
  assert.equal(isReservableEvent(normalizeEvent({ ...base, description: "places=15\nboto=   " })), false);
});

test("keeps margin server-side when serializing public events", () => {
  const normalized = normalizeEvent({ id: "event-1", summary: "Taller", start: { dateTime: "2026-08-20T10:00:00+02:00" }, description: "places=15\nmarge=3\nboto=Reserva" });
  assert.equal(normalized.margin, 3);
  const publicEvent = toPublicEvent(normalized);
  assert.equal("margin" in publicEvent, false);
  assert.equal(publicEvent.places, 15);
  assert.equal(publicEvent.button, "Reserva");
});

test("uses CONFIG fallback, counts confirmed people, calculates capacity and state", () => {
  assert.equal(getDefaultMargin([["Configuració", "Valor"], ["MARGE_EXTRA_PREDETERMINAT", "3"]]), 3);
  assert.throws(() => getDefaultMargin([["MARGE_EXTRA_PREDETERMINAT", "3.5"]]));
  const counts = countConfirmedParticipants([["r1", "event-1", "", "", "", "", "", "", "", "CONFIRMADA"], ["r2", "event-1", "", "", "", "", "", "", "", "CANCEL·LADA"], ["r3", "event-1", "", "", "", "", "", "", "", "CONFIRMADA"]]);
  assert.equal(counts.get("event-1"), 2);
  assert.equal(getEventStatus({ planned: 15, reserved: 15, maximum: 18 }), "OBERT");
  assert.equal(getEventStatus({ planned: 15, reserved: 16, maximum: 18 }), "ÚLTIMES PLACES");
  assert.equal(getEventStatus({ planned: 15, reserved: 18, maximum: 18 }), "COMPLET");
  const row = buildEventRow({ id: "event-1", title: "Taller", start: "2026-08-20T10:00:00+02:00", allDay: false, places: 15, margin: null }, 3, counts, "2026-08-13 10:00");
  assert.deepEqual(row.slice(4, 10), [15, 3, 18, 2, 16, "OBERT"]);
});

test("upserts by Event ID and never appends a second matching row", () => {
  const header = ["Event ID", "Activitat"];
  const existing = [header, ["event-1", "Antic títol"], ["event-2", "Sense canvis"]];
  const updated = buildUpsertValues(existing, [["event-1", "Nou títol"], ["event-3", "Nou"]]);
  assert.equal(updated.length, 4);
  assert.equal(updated[1][1], "Nou títol");
  assert.equal(updated[3][0], "event-3");
});
