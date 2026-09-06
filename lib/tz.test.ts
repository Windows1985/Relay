// Run with: npx tsx lib/tz.test.ts
// Lives in its own file for the same reason as round.test.ts: a Node-only
// `require.main === module` guard inside a lib file crashes any browser
// bundle that imports it.
import { zonedTimeToUtc, todayInZone, startOfWeekInZone } from "./tz";

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
