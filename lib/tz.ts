// Converts a local wall-clock date+time in an IANA zone to the UTC instant
// it represents, using only Intl (no date library). Two-pass: guess the
// instant assuming UTC, read back what that instant renders as in the
// target zone, then correct by the difference. Converges in one correction
// except right at a DST transition, which is an acceptable inaccuracy for
// a "your window opens in ~X" countdown display.
export function zonedTimeToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const guess = new Date(`${dateStr}T${timeStr}:00Z`);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const renderedAsUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
  );

  const offsetMs = renderedAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

// Today's date (YYYY-MM-DD) as seen from inside an IANA zone.
export function todayInZone(tz: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// UTC instant of the most recent Monday 00:00 local time in an IANA zone —
// the group token leaderboard's weekly reset boundary.
export function startOfWeekInZone(tz: string, now: Date = new Date()): Date {
  const dateStr = todayInZone(tz, now);
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7;
  const monday = new Date(Date.UTC(y, m - 1, d - daysSinceMonday));
  const mondayStr = monday.toISOString().slice(0, 10);
  return zonedTimeToUtc(mondayStr, "00:00", tz);
}

function demo() {
  // A well-known instant: noon UTC on 2026-06-15 is 8:00am America/New_York (EDT, UTC-4).
  const utc = zonedTimeToUtc("2026-06-15", "08:00", "America/New_York");
  console.assert(utc.toISOString() === "2026-06-15T12:00:00.000Z", "EDT conversion: " + utc.toISOString());

  const today = todayInZone("UTC", new Date("2026-01-01T23:30:00Z"));
  console.assert(today === "2026-01-01", "todayInZone UTC: " + today);

  // 2026-06-17 is a Wednesday; the most recent Monday is 2026-06-15.
  const monday = startOfWeekInZone("UTC", new Date("2026-06-17T12:00:00Z"));
  console.assert(monday.toISOString() === "2026-06-15T00:00:00.000Z", "startOfWeekInZone: " + monday.toISOString());

  // A Monday itself should return that same day's midnight, not the prior week.
  const sameMonday = startOfWeekInZone("UTC", new Date("2026-06-15T23:00:00Z"));
  console.assert(sameMonday.toISOString() === "2026-06-15T00:00:00.000Z", "startOfWeekInZone (on Monday): " + sameMonday.toISOString());

  console.log("lib/tz.ts self-check passed");
}

if (require.main === module) demo();
