import { DateTime } from "luxon";
export const RULES = Object.freeze({
  leadMinutes: 30,
  horizonDays: 30,
  intervalMinutes: 15,
});

export function dateBounds(timezone, now = DateTime.utc()) {
  const local = now.setZone(timezone);
  return {
    today: local.toISODate(),
    lastDate: local.plus({ days: RULES.horizonDays }).toISODate(),
  };
}

export function validDate(date, timezone, now = DateTime.utc()) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const value = DateTime.fromISO(date, { zone: timezone });
  const { today, lastDate } = dateBounds(timezone, now);
  return (
    value.isValid &&
    value.toISODate() === date &&
    date >= today &&
    date <= lastDate
  );
}

// Generate wall-clock times in the business zone, then return explicit UTC instants.
// Nonexistent and ambiguous DST wall times are excluded rather than guessed.
export function candidates(
  date,
  timezone,
  hours,
  duration,
  now = DateTime.utc(),
) {
  if (!validDate(date, timezone, now) || !hours) return [];
  const toMinutes = (time) =>
    Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const close = toMinutes(hours.closes),
    result = [];
  for (
    let minute = toMinutes(hours.opens);
    minute + duration <= close;
    minute += RULES.intervalMinutes
  ) {
    const label = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const wall = `${date}T${label}`;
    const start = DateTime.fromISO(wall, { zone: timezone });
    if (
      !start.isValid ||
      start.toFormat("yyyy-MM-dd'T'HH:mm") !== wall ||
      start.getPossibleOffsets().length > 1
    )
      continue;
    const end = start.plus({ minutes: duration });
    if (
      end.toISODate() !== date ||
      end.hour * 60 + end.minute > close ||
      start < now.plus({ minutes: RULES.leadMinutes })
    )
      continue;
    result.push({
      startsAt: start.toUTC().toISO(),
      endsAt: end.toUTC().toISO(),
      label,
    });
  }
  return result;
}

export function excludeBusy(slots, bookings) {
  return slots.filter(
    (slot) =>
      !bookings.some(
        (b) =>
          new Date(slot.startsAt) < new Date(b.ends_at) &&
          new Date(slot.endsAt) > new Date(b.starts_at),
      ),
  );
}
