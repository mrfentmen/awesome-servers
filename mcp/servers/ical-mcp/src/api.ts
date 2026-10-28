/**
 * iCalendar — keyless public API client.
 */

export class SourceError extends Error {}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

import { randomUUID } from "node:crypto"

type Prop = { name: string; params: Record<string, string>; value: string }
type Comp = { name: string; props: Prop[]; children: Comp[] }

function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  const lines: string[] = []
  for (const line of raw) {
    if (/^[ \t]/.test(line) && lines.length) lines[lines.length - 1] += line.slice(1)
    else if (line !== "") lines.push(line)
  }
  return lines
}

function parseProp(line: string): Prop {
  const colon = line.indexOf(":")
  if (colon < 0) throw new SourceError(`property without a colon: "${line.slice(0, 60)}"`)
  const head = line.slice(0, colon)
  const value = line.slice(colon + 1)
  const bits = head.split(";")
  const params: Record<string, string> = {}
  for (const bit of bits.slice(1)) {
    const eq = bit.indexOf("=")
    const key = (eq < 0 ? bit : bit.slice(0, eq)).toUpperCase()
    params[key] = eq < 0 ? "" : bit.slice(eq + 1)
  }
  return { name: bits[0].toUpperCase(), params, value }
}

function parseComponents(text: string): Comp[] {
  const top: Comp[] = []
  const stack: Comp[] = []
  for (const line of unfold(text)) {
    const prop = parseProp(line)
    if (prop.name === "BEGIN") {
      const comp: Comp = { name: prop.value.toUpperCase(), props: [], children: [] }
      if (stack.length) stack[stack.length - 1].children.push(comp)
      else top.push(comp)
      stack.push(comp)
      continue
    }
    if (prop.name === "END") {
      const open = stack.pop()
      if (!open) throw new SourceError(`END:${prop.value} without a matching BEGIN`)
      if (open.name !== prop.value.toUpperCase()) throw new SourceError(`BEGIN:${open.name} closed by END:${prop.value}`)
      continue
    }
    const current = stack[stack.length - 1]
    if (!current) throw new SourceError("property outside any BEGIN/END block")
    current.props.push(prop)
  }
  if (stack.length) throw new SourceError(`BEGIN:${stack[stack.length - 1].name} is never closed`)
  return top
}

function propValue(comp: Comp, name: string): string {
  return comp.props.find((p) => p.name === name)?.value ?? ""
}

function fmtDt(value: string): string {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!m) return value
  const [, y, mo, d, h, mi, s, z] = m
  return h ? `${y}-${mo}-${d} ${h}:${mi}:${s}${z ? " UTC" : " (local)"}` : `${y}-${mo}-${d}`
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\")
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

function fold(line: string): string {
  const out: string[] = []
  let current = ""
  let bytes = 0
  for (const ch of line) {
    const size = Buffer.byteLength(ch, "utf8")
    if (bytes + size > 75) {
      out.push(current)
      current = " " + ch
      bytes = 1 + size
    } else {
      current += ch
      bytes += size
    }
  }
  out.push(current)
  return out.join("\r\n")
}

function toBasicUtc(value: string, label: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new SourceError(`${label} must be an ISO 8601 date/time, got "${value}"`)
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

export async function parseIcal(a: { text: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const comps = parseComponents(a.text)
  const calendar = comps.find((c) => c.name === "VCALENDAR")
  if (!calendar) throw new SourceError("no VCALENDAR component found")
  const events = calendar.children.filter((c) => c.name === "VEVENT")
  const others = calendar.children.filter((c) => c.name !== "VEVENT")
  const lines = [
    `Calendar: ${propValue(calendar, "PRODID") || "(no PRODID)"}${propValue(calendar, "VERSION") ? ` · version ${propValue(calendar, "VERSION")}` : ""}`,
    `${events.length} event(s), ${others.length} other component(s)`,
  ]
  for (const event of events.slice(0, limit)) {
    const start = propValue(event, "DTSTART")
    const end = propValue(event, "DTEND") || propValue(event, "DURATION")
    const attendees = event.props.filter((p) => p.name === "ATTENDEE").length
    lines.push(
      "",
      `${unescapeText(propValue(event, "SUMMARY")) || "(no summary)"}`,
      `  start:   ${start ? fmtDt(start) : "n/a"}`,
      end ? `  end:     ${end.startsWith("P") ? `duration ${end}` : fmtDt(end)}` : "",
      propValue(event, "LOCATION") ? `  where:   ${unescapeText(propValue(event, "LOCATION"))}` : "",
      attendees ? `  people:  ${attendees} attendee(s)` : "",
      propValue(event, "RRULE") ? `  repeats: ${propValue(event, "RRULE")}` : "",
      propValue(event, "STATUS") ? `  status:  ${propValue(event, "STATUS")}` : "",
      `  uid:     ${propValue(event, "UID") || "(none)"}`
    )
  }
  if (events.length > limit) lines.push("", `... ${events.length - limit} more event(s) not shown.`)
  return lines.filter((l) => l !== "").join("\n").replace(/\n\n(?=\S)/g, "\n\n")
}

export async function createEvent(a: {
  summary: string
  start: string
  end?: string
  location?: string
  description?: string
  uid?: string
}): Promise<string> {
  const summary = clean(a.summary)
  if (!summary) throw new SourceError("summary is required")
  const dtStart = toBasicUtc(a.start, "start")
  const dtEnd = a.end
    ? toBasicUtc(a.end, "end")
    : toBasicUtc(new Date(new Date(a.start).getTime() + 3600000).toISOString(), "start + 1 hour")
  if (a.end && new Date(a.end).getTime() <= new Date(a.start).getTime()) {
    throw new SourceError("end must be after start")
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const uid = a.uid ? clean(a.uid) : `${randomUUID()}@ical-mcp`
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ical-mcp//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
    a.location ? `LOCATION:${escapeText(clean(a.location))}` : "",
    a.description ? `DESCRIPTION:${escapeText(clean(a.description))}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)
  return [
    `Event created — ${summary} at ${dtStart.slice(0, 4)}-${dtStart.slice(4, 6)}-${dtStart.slice(6, 8)} ${dtStart.slice(9, 11)}:${dtStart.slice(11, 13)} UTC:`,
    "",
    lines.map(fold).join("\r\n"),
  ].join("\n")
}

export async function validateIcal(a: { text: string }): Promise<string> {
  const problems: string[] = []
  const notes: string[] = []
  if (!/^BEGIN:VCALENDAR/m.test(a.text.trimStart())) problems.push("does not start with BEGIN:VCALENDAR")
  if (!/END:VCALENDAR/.test(a.text)) problems.push("has no END:VCALENDAR")
  if (a.text.includes("\r\n")) notes.push("uses CRLF line endings (correct per RFC 5545)")
  else notes.push("uses LF line endings only; RFC 5545 asks for CRLF")
  let comps: Comp[] = []
  try {
    comps = parseComponents(a.text)
  } catch (e) {
    problems.push((e as Error).message)
  }
  const calendar = comps.find((c) => c.name === "VCALENDAR")
  if (comps.length && !calendar) problems.push("top-level component is not VCALENDAR")
  if (calendar) {
    if (propValue(calendar, "VERSION") !== "2.0") problems.push("VERSION:2.0 is missing")
    if (!propValue(calendar, "PRODID")) problems.push("PRODID is missing")
    const events = calendar.children.filter((c) => c.name === "VEVENT")
    events.forEach((event, i) => {
      if (!propValue(event, "UID")) problems.push(`event ${i + 1} has no UID`)
      if (!propValue(event, "DTSTART")) problems.push(`event ${i + 1} has no DTSTART`)
    })
    notes.push(`${events.length} event(s), ${calendar.children.length - events.length} other component(s)`)
  }
  for (const line of unfold(a.text)) {
    if (line.length > 75 && !/^[ \t]/.test(line)) notes.push(`line longer than 75 characters: "${line.slice(0, 40)}..."`)
  }
  return [
    problems.length ? `Invalid iCalendar — ${problems.length} problem(s):` : "Valid iCalendar.",
    "",
    ...problems.map((p) => `- ${p}`),
    ...(notes.length ? ["", "Notes:", ...notes.map((n) => `- ${n}`)] : []),
  ].join("\n")
}
