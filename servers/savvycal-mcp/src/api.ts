export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * Every calculation here uses the IANA timezone database that ships with Node,
 * so the server needs no account, key or upstream call.
 */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string): Intl.DateTimeFormat {
  const cached = FORMATTERS.get(timeZone)
  if (cached) return cached
  let created: Intl.DateTimeFormat
  try {
    created = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    throw new Error(`"${timeZone}" is not a known IANA timezone. Use a name like Europe/London or America/New_York.`)
  }
  FORMATTERS.set(timeZone, created)
  return created
}

export function isKnownZone(timeZone: string): boolean {
  try {
    formatter(timeZone)
    return timeZone.includes("/") || timeZone === "UTC"
  } catch {
    return false
  }
}

interface Parts { year: number; month: number; day: number; hour: number; minute: number; second: number }

function zonedParts(timeZone: string, instantMs: number): Parts {
  const parts = formatter(timeZone).formatToParts(new Date(instantMs))
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0")
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  }
}

/** Offset of a zone east of UTC, in milliseconds, at one instant. */
export function zoneOffsetMs(timeZone: string, instantMs: number): number {
  const p = zonedParts(timeZone, instantMs)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  // Drop sub-second noise so offsets come out on exact minutes.
  return Math.round((asUtc - instantMs) / 1000) * 1000
}

export function offsetLabel(offsetMs: number): string {
  const totalMinutes = Math.round(offsetMs / 60000)
  const sign = totalMinutes < 0 ? "-" : "+"
  const abs = Math.abs(totalMinutes)
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`
}

export function formatInZone(timeZone: string, instantMs: number): string {
  const p = zonedParts(timeZone, instantMs)
  const pad = (n: number) => String(n).padStart(2, "0")
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(new Date(instantMs))
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)} ${weekday}`
}

/** Converts a wall-clock time in one zone to the matching instant, DST aware. */
export function zonedTimeToInstant(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const naive = Date.UTC(year, month - 1, day, hour, minute)
  // Two passes settle the offset even when the target falls next to a DST change.
  let instant = naive - zoneOffsetMs(timeZone, naive)
  instant = naive - zoneOffsetMs(timeZone, instant)
  return instant
}

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/

export function parseDateTime(input: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const raw = (input ?? "").trim()
  const match = DATE_TIME.exec(raw)
  if (!match) throw new Error(`"${input}" is not a date and time. Use YYYY-MM-DD HH:MM.`)
  const [, y, mo, d, h, mi] = match
  const parsed = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: h ? Number(h) : 9,
    minute: mi ? Number(mi) : 0,
  }
  if (parsed.month < 1 || parsed.month > 12 || parsed.day < 1 || parsed.day > 31 || parsed.hour > 23 || parsed.minute > 59) {
    throw new Error(`"${input}" is not a valid date and time.`)
  }
  return parsed
}

export async function convertTime(args: {
  dateTime: string
  fromTimeZone: string
  toTimeZone: string
}): Promise<string> {
  const from = args.fromTimeZone?.trim()
  const to = args.toTimeZone?.trim()
  if (!isKnownZone(from)) throw new Error(`"${from}" is not a known IANA timezone, for example America/New_York.`)
  if (!isKnownZone(to)) throw new Error(`"${to}" is not a known IANA timezone, for example Europe/London.`)
  const t = parseDateTime(args.dateTime)
  const instant = zonedTimeToInstant(from, t.year, t.month, t.day, t.hour, t.minute)

  const fromOffset = zoneOffsetMs(from, instant)
  const toOffset = zoneOffsetMs(to, instant)
  const deltaMinutes = (toOffset - fromOffset) / 60000
  const deltaLabel = deltaMinutes === 0
    ? "no time difference"
    : `${deltaMinutes > 0 ? "+" : ""}${deltaMinutes / 60} hour(s)`

  const dayShift = new Date(instant + toOffset).getUTCDate() - new Date(instant + fromOffset).getUTCDate()

  return [
    `${args.dateTime} in ${from}`,
    `  = ${formatInZone(to, instant)} in ${to}`,
    "",
    `Absolute (UTC): ${new Date(instant).toISOString()}`,
    `${from}: ${offsetLabel(fromOffset)} | ${to}: ${offsetLabel(toOffset)}`,
    `Offset difference: ${deltaLabel}`,
    dayShift === 0 ? "Same calendar day in both zones." : `Attention: this lands on a ${dayShift > 0 ? "later" : "previous"} calendar day in ${to}.`,
  ].join("\n")
}

/** Finds the DST transitions in a year by scanning for offset changes. */
function transitions(timeZone: string, year: number): Array<{ at: Date; fromMs: number; toMs: number }> {
  const found: Array<{ at: Date; fromMs: number; toMs: number }> = []
  const start = Date.UTC(year, 0, 1)
  const end = Date.UTC(year + 1, 0, 1)
  let previous = zoneOffsetMs(timeZone, start)
  // Hourly steps are enough: every real transition lands on a whole hour.
  for (let ms = start + 3600000; ms <= end; ms += 3600000) {
    const current = zoneOffsetMs(timeZone, ms)
    if (current !== previous) {
      // Walk back to the exact minute the change happened.
      let low = ms - 3600000
      let high = ms
      while (high - low > 60000) {
        const mid = low + Math.floor((high - low) / 120000) * 60000
        if (zoneOffsetMs(timeZone, mid) === previous) low = mid
        else high = mid
      }
      found.push({ at: new Date(high), fromMs: previous, toMs: current })
      previous = current
    }
  }
  return found
}

export async function timezoneInfo(args: { timeZone: string; year?: number }): Promise<string> {
  const zone = args.timeZone?.trim()
  if (!isKnownZone(zone)) throw new Error(`"${zone}" is not a known IANA timezone, for example Europe/Berlin.`)
  const year = args.year ?? new Date().getUTCFullYear()
  const now = Date.now()
  const offsetNow = zoneOffsetMs(zone, now)
  const january = zoneOffsetMs(zone, Date.UTC(year, 0, 15, 12))
  const july = zoneOffsetMs(zone, Date.UTC(year, 6, 15, 12))
  const shift = transitions(zone, year)

  const lines = [
    `Timezone: ${zone}`,
    `Right now: ${formatInZone(zone, now)} (${offsetLabel(offsetNow)})`,
    `Standard offset in ${year}: ${offsetLabel(Math.min(january, july))} | Summer offset: ${offsetLabel(Math.max(january, july))}`,
    `Observes daylight saving: ${shift.length ? "yes" : "no"}`,
    "",
  ]
  if (shift.length) {
    lines.push(`Clock changes in ${year}:`)
    for (const change of shift) {
      const forward = change.toMs > change.fromMs
      lines.push(`  ${change.at.toISOString().slice(0, 16).replace("T", " ")} UTC — clocks move ${forward ? "forward" : "back"} one hour (${offsetLabel(change.fromMs)} -> ${offsetLabel(change.toMs)})`)
    }
  } else {
    lines.push(`${zone} keeps the same offset all year.`)
  }
  return lines.join("\n")
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function parseWeekend(value?: number[]): Set<number> {
  const days = value?.length ? value : [0, 6]
  const cleaned = days.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  if (!cleaned.length) throw new Error("Weekend days must be numbers from 0 (Sunday) to 6 (Saturday).")
  return new Set(cleaned)
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

function parseDateOnly(value: string): Date {
  const parsed = parseDateTime(value)
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
}

export async function businessDays(args: {
  startDate: string
  endDate: string
  weekendDays?: number[]
  holidays?: string[]
}): Promise<string> {
  const weekend = parseWeekend(args.weekendDays)
  const holidays = new Set((args.holidays ?? []).map((h) => h.trim()))
  const start = parseDateOnly(args.startDate)
  const end = parseDateOnly(args.endDate)
  if (end < start) return "The end date is before the start date."

  let business = 0
  let weekendCount = 0
  let holidayCount = 0
  const cursor = new Date(start.getTime())
  while (cursor <= end) {
    const weekday = cursor.getUTCDay()
    const day = isoDate(cursor)
    if (weekend.has(weekday)) weekendCount += 1
    else if (holidays.has(day)) holidayCount += 1
    else business += 1
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1

  return [
    `Business days from ${isoDate(start)} to ${isoDate(end)}`,
    `${business} business day(s) out of ${totalDays} calendar day(s)`,
    `Weekend days excluded: ${weekendCount} (${[...weekend].sort().map((d) => DAY_NAMES[d]).join(", ")})`,
    `Holidays excluded: ${holidayCount}`,
    "",
    `Working time available: ${business * 8} hour(s) at 8 hours per business day.`,
  ].join("\n")
}

export async function addBusinessDays(args: {
  startDate: string
  days: number
  weekendDays?: number[]
  holidays?: string[]
}): Promise<string> {
  const weekend = parseWeekend(args.weekendDays)
  const holidays = new Set((args.holidays ?? []).map((h) => h.trim()))
  const days = Number(args.days)
  if (!Number.isInteger(days) || days === 0) return "Provide a whole number of business days, positive or negative."
  const cursor = parseDateOnly(args.startDate)
  const step = days > 0 ? 1 : -1
  let remaining = Math.abs(days)
  let guard = 0
  while (remaining > 0 && guard < 4000) {
    cursor.setUTCDate(cursor.getUTCDate() + step)
    guard += 1
    if (weekend.has(cursor.getUTCDay())) continue
    if (holidays.has(isoDate(cursor))) continue
    remaining -= 1
  }
  if (remaining > 0) return `Could not count ${days} business day(s) from ${args.startDate}; the weekend or holiday rules exclude too many days.`
  return [
    `${days > 0 ? "Add" : "Subtract"} ${Math.abs(days)} business day(s) ${days > 0 ? "to" : "from"} ${isoDate(parseDateOnly(args.startDate))}`,
    `Result: ${isoDate(cursor)} (${DAY_NAMES[cursor.getUTCDay()]})`,
    `Holidays excluded: ${holidays.size}`,
  ].join("\n")
}

interface Busy { start: number; end: number; label: string }

function parseBusy(block: string, zone: string): Busy {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/.exec(block.trim())
  if (!match) throw new Error(`Busy block "${block}" must look like 2026-09-28 09:00-10:00.`)
  const [, day, from, to] = match
  const [y, mo, d] = day.split("-").map(Number)
  const [fh, fm] = from.split(":").map(Number)
  const [th, tm] = to.split(":").map(Number)
  return {
    start: zonedTimeToInstant(zone, y, mo, d, fh, fm),
    end: zonedTimeToInstant(zone, y, mo, d, th, tm),
    label: `${from}-${to}`,
  }
}

export async function meetingSlots(args: {
  date: string
  timeZone: string
  durationMinutes?: number
  workStartHour?: number
  workEndHour?: number
  busy?: string[]
  alsoShow?: string[]
}): Promise<string> {
  const zone = args.timeZone?.trim()
  if (!isKnownZone(zone)) throw new Error(`"${zone}" is not a known IANA timezone, for example America/Chicago.`)
  const duration = Math.min(Math.max(Number(args.durationMinutes ?? 30) || 30, 5), 480)
  const startHour = Math.min(Math.max(Number(args.workStartHour ?? 9) || 9, 0), 23)
  const endHour = Math.min(Math.max(Number(args.workEndHour ?? 17) || 17, startHour + 1), 24)
  const day = parseDateOnly(args.date)
  if (endHour - startHour <= 0) return "The working day must end after it starts."

  const busy: Busy[] = (args.busy ?? []).filter(Boolean).map((b) => parseBusy(b, zone))
  const alsoShow = (args.alsoShow ?? []).filter(Boolean)

  const dayStart = zonedTimeToInstant(zone, day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), startHour, 0)
  const dayEnd = zonedTimeToInstant(zone, day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), endHour, 0)

  const slots: Array<{ start: number; end: number }> = []
  for (let t = dayStart; t + duration * 60000 <= dayEnd; t += 15 * 60000) {
    const slotEnd = t + duration * 60000
    if (!busy.some((b) => t < b.end && slotEnd > b.start)) slots.push({ start: t, end: slotEnd })
  }

  const lines = [
    `${isoDate(day)} (${DAY_NAMES[day.getUTCDay()]}) — ${duration} minute slot(s) in ${zone}`,
    `Working hours ${String(startHour).padStart(2, "0")}:00-${String(endHour).padStart(2, "0")}:00 ${offsetLabel(zoneOffsetMs(zone, dayStart))}`,
    busy.length ? `Busy blocks excluded: ${busy.map((b) => b.label).join(", ")}` : "No busy blocks given.",
    "",
  ]
  if (!slots.length) {
    lines.push("No free slots: the working day is fully booked or the busy blocks cover it.")
    return lines.join("\n")
  }
  lines.push(`${slots.length} free slot(s):`)
  for (const slot of slots) {
    const extra = alsoShow
      .map((other) => {
        try {
          return ` | ${formatInZone(other, slot.start).slice(11, 16)} ${other}`
        } catch {
          return ""
        }
      })
      .join("")
    lines.push(`  ${formatInZone(zone, slot.start).slice(11, 16)}-${formatInZone(zone, slot.end).slice(11, 16)}${extra}`)
  }
  return lines.join("\n")
}

export async function worldClock(args: { timeZones: string[] }): Promise<string> {
  const zones = (args.timeZones ?? []).map((z) => String(z).trim()).filter(Boolean).slice(0, 12)
  if (!zones.length) return "Provide up to 12 timezones, for example [\"Europe/London\", \"Asia/Tokyo\"]."
  const now = Date.now()
  const lines = [`Current time in ${zones.length} timezone(s)`, ""]
  for (const zone of zones) {
    try {
      lines.push(`${zone.padEnd(24)} ${formatInZone(zone, now)} (${offsetLabel(zoneOffsetMs(zone, now))})`)
    } catch (e) {
      lines.push(`${zone.padEnd(24)} unknown timezone (${errorMessage(e)})`)
    }
  }
  return lines.join("\n")
}

export async function teamOverlap(args: {
  timeZones: string[]
  windowStartHour?: number
  windowEndHour?: number
}): Promise<string> {
  const zones = (args.timeZones ?? []).map((z) => String(z).trim()).filter(Boolean).slice(0, 8)
  if (zones.length < 2) return "Provide at least two timezones to find overlapping working hours."
  const startHour = Math.min(Math.max(Number(args.windowStartHour ?? 9) || 9, 0), 23)
  const endHour = Math.min(Math.max(Number(args.windowEndHour ?? 17) || 17, startHour + 1), 24)

  for (const zone of zones) {
    if (!isKnownZone(zone)) throw new Error(`"${zone}" is not a known IANA timezone.`)
  }

  // Walk one UTC day hour by hour and keep the hours that fall inside everyone's
  // working window. Offsets come from the live timezone database, so DST is handled.
  const today = new Date()
  const dayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const windows: string[] = []

  for (let hour = 0; hour < 24; hour += 1) {
    const instant = dayStart + hour * 3600000
    const locals = zones.map((zone) => ({ zone, parts: zonedParts(zone, instant) }))
    if (!locals.every((l) => l.parts.hour >= startHour && l.parts.hour < endHour)) continue
    const label = `${String(hour).padStart(2, "0")}:00 UTC — ` +
      locals.map((l) => `${l.zone.split("/").pop()} ${String(l.parts.hour).padStart(2, "0")}:${String(l.parts.minute).padStart(2, "0")}`).join(", ")
    windows.push(label)
  }

  const lines = [
    `Overlapping working hours for ${zones.join(", ")}`,
    `Everyone's local time between ${String(startHour).padStart(2, "0")}:00 and ${String(endHour).padStart(2, "0")}:00`,
    "",
  ]
  if (!windows.length) {
    lines.push("No hour today falls inside everyone's working hours. Someone has to take a late or early call, or use an asynchronous update instead.")
    return lines.join("\n")
  }
  lines.push(`${windows.length} overlapping hour(s) on a UTC day (${isoDate(new Date(dayStart))}), by UTC hour:`)
  windows.slice(0, 12).forEach((w) => lines.push(`  ${w}`))
  lines.push("", "Offset to your own date, then confirm in the attendees' own calendars.")
  return lines.join("\n")
}

// ---- muxH tools:
// The tools above move by hours and by working days. These two do the two
// things a calendar actually gets wrong: moving by whole months across a short
// month, and expressing a span of time in the several different units a
// deadline has to be stated in.

