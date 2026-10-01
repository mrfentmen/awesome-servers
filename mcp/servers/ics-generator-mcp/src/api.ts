import { writeFileSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export class IcsError extends Error {}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function toIcal(dt: string, allDay: boolean): string {
  const s = dt.replace(/[-:]/g, "").replace(/\.\d+/, "").replace("Z", "")
  return allDay ? s.slice(0, 8) : s
}

export async function createEvent(args: {
  title?: string; start?: string; end?: string; description?: string; location?: string; filename?: string
}): Promise<string> {
  const title = args.title ?? "Event"
  const start = args.start ?? ""
  if (!start) throw new IcsError("Provide a start time in ISO format")
  const end = args.end ?? start
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").replace("Z", "Z")
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mrfentmen//ics-generator//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@mrfentmen`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcal(start, false)}`,
    `DTEND:${toIcal(end, false)}`,
    `SUMMARY:${esc(title)}`,
    ...(args.description ? [`DESCRIPTION:${esc(args.description)}`] : []),
    ...(args.location ? [`LOCATION:${esc(args.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const dir = mkdtempSync(join(tmpdir(), "ics-"))
  const path = join(dir, /^[\w.\- ]+$/.test(args.filename ?? "") ? args.filename! : `event-${Date.now()}.ics`)
  writeFileSync(path, ics)
  return `Created ${path} (${ics.length} bytes)`
}

export async function createReminder(args: { title?: string; date?: string }): Promise<string> {
  const date = args.date ?? ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new IcsError("Provide a date in YYYY-MM-DD format")
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").replace("Z", "Z")
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mrfentmen//ics-generator//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@mrfentmen`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`,
    `SUMMARY:${esc(args.title ?? "Reminder")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const dir = mkdtempSync(join(tmpdir(), "ics-"))
  const path = join(dir, `reminder-${Date.now()}.ics`)
  writeFileSync(path, ics)
  return `Created ${path}`
}

// ---- muxB tools:
const NAGER_BASE = 'https://date.nager.at/api/v3';
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

function write(name: string, ics: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ics-'));
  const path = join(dir, name);
  writeFileSync(path, ics);
  return `Created ${path} (${ics.length} bytes, ${ics.split('BEGIN:VEVENT').length - 1} events)`;
}

type NagerHoliday = {
  date?: string;
  localName?: string;
  name?: string;
  county?: string;
  counties?: string[] | null;
  fixed?: boolean;
  types?: string[];
};

export async function createHolidayCalendar(args: {
  country?: string; year?: number; limit?: number; filename?: string;
}): Promise<string> {
  const country = (args.country ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new IcsError('Provide a two letter ISO country code, for example GB or US');
  const year = Math.max(1970, Math.min(Math.trunc(Number(args.year ?? new Date().getFullYear())), 2200));
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 60) || 60), 400));
  const res = await fetch(`${NAGER_BASE}/PublicHolidays/${year}/${country}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new IcsError(`No holiday data for ${country} in ${year}`);
  if (!res.ok) throw new IcsError(`Holiday service returned ${res.status}`);
  const data = (await res.json()) as NagerHoliday[];
  if (!Array.isArray(data) || !data.length) throw new IcsError(`No public holidays reported for ${country} in ${year}`);
  const used = data.slice(0, limit);
  const now = stamp();
  const events = used.map((h) => [
    'BEGIN:VEVENT',
    `UID:${now}-${h.date ?? 'nodate'}@muffinlabs`,
    `DTSTAMP:${now}Z`,
    `DTSTART;VALUE=DATE:${(h.date ?? '').replace(/-/g, '')}`,
    `SUMMARY:${esc(h.localName ?? h.name ?? 'Public holiday')}`,
    `DESCRIPTION:${esc([h.name ?? null, h.types?.join('/') ?? null, h.county ?? null].filter(Boolean).join(' | ') || 'no extra detail reported')}`,
    'END:VEVENT',
  ].join('\r\n'));
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mrfentmen//ics-generator//EN',
    'X-WR-CALNAME:Public holidays ' + country + ' ' + year,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
  const note = data.length > used.length ? ` (${data.length} available, wrote ${used.length})` : '';
  return `${write(`holidays-${country}-${year}.ics`, ics)}${note}`;
}

type OmDaily = { time?: string[]; sunrise?: string[]; sunset?: string[] };

export async function createSunCalendar(args: {
  latitude?: number; longitude?: number; days?: number; filename?: string;
}): Promise<string> {
  const lat = Number(args.latitude);
  const lon = Number(args.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new IcsError('Provide a latitude between -90 and 90');
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new IcsError('Provide a longitude between -180 and 180');
  const days = Math.max(1, Math.min(Math.trunc(Number(args.days ?? 7) || 7), 31));
  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset&timezone=UTC&forecast_days=${days}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new IcsError(`Sun service returned ${res.status}`);
  const d = (await res.json()) as { daily?: OmDaily };
  const daily = d.daily;
  if (!daily?.time?.length) throw new IcsError('The sun service returned no days for that location');
  const now = stamp();
  const events: string[] = [];
  daily.time.forEach((date, i) => {
    const rise = daily.sunrise?.[i];
    const set = daily.sunset?.[i];
    if (rise) {
      events.push([
        'BEGIN:VEVENT',
        `UID:sunrise-${date}@muffinlabs`,
        `DTSTAMP:${now}Z`,
        `DTSTART:${toIcal(rise, false)}Z`,
        `DTEND:${toIcal(rise, false)}Z`,
        `SUMMARY:${esc('Sunrise at ' + lat + ', ' + lon)}`,
        `LOCATION:${esc(lat + ', ' + lon)}`,
        'END:VEVENT',
      ].join('\r\n'));
    }
    if (set) {
      events.push([
        'BEGIN:VEVENT',
        `UID:sunset-${date}@muffinlabs`,
        `DTSTAMP:${now}Z`,
        `DTSTART:${toIcal(set, false)}Z`,
        `DTEND:${toIcal(set, false)}Z`,
        `SUMMARY:${esc('Sunset at ' + lat + ', ' + lon)}`,
        `LOCATION:${esc(lat + ', ' + lon)}`,
        'END:VEVENT',
      ].join('\r\n'));
    }
  });
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mrfentmen//ics-generator//EN',
    'X-WR-CALNAME:Sun times ' + lat + ', ' + lon,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
  return write(`sun-${lat}-${lon}.ics`, ics);
}
