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

type NagerHoliday = {
  date?: string;
  localName?: string;
  name?: string;
  county?: string;
  counties?: string[] | null;
  fixed?: boolean;
  types?: string[];
};

type OmDaily = { time?: string[]; sunrise?: string[]; sunset?: string[] };

