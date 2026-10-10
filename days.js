/** Local calendar days as `YYYY-MM-DD` strings, and streaks over sets of them. */

const pad = (number) => String(number).padStart(2, '0');

/**
 * The day `date` belongs to, in local time. Before `startHour` it still counts as the day
 * before, so a check at 1 AM after a late evening lands on that evening's day.
 */
export function dayKey(date, startHour = 0) {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - startHour);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

/** The day `count` days after `key` (before it when negative). */
export function addDays(key, count) {
  const [year, month, day] = key.split('-').map(Number);
  // UTC has no daylight saving jumps, so whole days always add up.
  return new Date(Date.UTC(year, month - 1, day + count)).toISOString().slice(0, 10);
}

/** Noon of that local day, for formatting it. */
export function keyToDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** When the next day begins: the next `startHour`:00 local time after `now`. */
export function nextRollover(now, startHour = 0) {
  const next = new Date(now);
  next.setHours(startHour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Checked days in a row ending today, or ending yesterday while today is not checked yet, so
 * the streak does not look broken in the morning.
 */
export function streak(days, today) {
  let day = days.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (days.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
