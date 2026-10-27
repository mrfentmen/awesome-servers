export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
/**
 * Every calculation here uses the IANA timezone database that ships with Node,
 * so the server needs no account, key or upstream call.
 */
const FORMATTERS = new Map();
function formatter(timeZone) {
    const cached = FORMATTERS.get(timeZone);
    if (cached)
        return cached;
    let created;
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
        });
    }
    catch {
        throw new Error(`"${timeZone}" is not a known IANA timezone. Use a name like Europe/London or America/New_York.`);
    }
    FORMATTERS.set(timeZone, created);
    return created;
}
export function isKnownZone(timeZone) {
    try {
        formatter(timeZone);
        return timeZone.includes("/") || timeZone === "UTC";
    }
    catch {
        return false;
    }
}
function zonedParts(timeZone, instantMs) {
    const parts = formatter(timeZone).formatToParts(new Date(instantMs));
    const pick = (type) => Number(parts.find((p) => p.type === type)?.value ?? "0");
    return {
        year: pick("year"),
        month: pick("month"),
        day: pick("day"),
        hour: pick("hour"),
        minute: pick("minute"),
        second: pick("second"),
    };
}
/** Offset of a zone east of UTC, in milliseconds, at one instant. */
export function zoneOffsetMs(timeZone, instantMs) {
    const p = zonedParts(timeZone, instantMs);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    // Drop sub-second noise so offsets come out on exact minutes.
    return Math.round((asUtc - instantMs) / 1000) * 1000;
}
export function offsetLabel(offsetMs) {
    const totalMinutes = Math.round(offsetMs / 60000);
    const sign = totalMinutes < 0 ? "-" : "+";
    const abs = Math.abs(totalMinutes);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
export function formatInZone(timeZone, instantMs) {
    const p = zonedParts(timeZone, instantMs);
    const pad = (n) => String(n).padStart(2, "0");
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(new Date(instantMs));
    return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)} ${weekday}`;
}
/** Converts a wall-clock time in one zone to the matching instant, DST aware. */
export function zonedTimeToInstant(timeZone, year, month, day, hour, minute) {
    const naive = Date.UTC(year, month - 1, day, hour, minute);
    // Two passes settle the offset even when the target falls next to a DST change.
    let instant = naive - zoneOffsetMs(timeZone, naive);
    instant = naive - zoneOffsetMs(timeZone, instant);
    return instant;
}
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/;
export function parseDateTime(input) {
    const raw = (input ?? "").trim();
    const match = DATE_TIME.exec(raw);
    if (!match)
        throw new Error(`"${input}" is not a date and time. Use YYYY-MM-DD HH:MM.`);
    const [, y, mo, d, h, mi] = match;
    const parsed = {
        year: Number(y),
        month: Number(mo),
        day: Number(d),
        hour: h ? Number(h) : 9,
        minute: mi ? Number(mi) : 0,
    };
    if (parsed.month < 1 || parsed.month > 12 || parsed.day < 1 || parsed.day > 31 || parsed.hour > 23 || parsed.minute > 59) {
        throw new Error(`"${input}" is not a valid date and time.`);
    }
    return parsed;
}
export async function convertTime(args) {
    const from = args.fromTimeZone?.trim();
    const to = args.toTimeZone?.trim();
    if (!isKnownZone(from))
        throw new Error(`"${from}" is not a known IANA timezone, for example America/New_York.`);
    if (!isKnownZone(to))
        throw new Error(`"${to}" is not a known IANA timezone, for example Europe/London.`);
    const t = parseDateTime(args.dateTime);
    const instant = zonedTimeToInstant(from, t.year, t.month, t.day, t.hour, t.minute);
    const fromOffset = zoneOffsetMs(from, instant);
    const toOffset = zoneOffsetMs(to, instant);
    const deltaMinutes = (toOffset - fromOffset) / 60000;
    const deltaLabel = deltaMinutes === 0
        ? "no time difference"
        : `${deltaMinutes > 0 ? "+" : ""}${deltaMinutes / 60} hour(s)`;
    const dayShift = new Date(instant + toOffset).getUTCDate() - new Date(instant + fromOffset).getUTCDate();
    return [
        `${args.dateTime} in ${from}`,
        `  = ${formatInZone(to, instant)} in ${to}`,
        "",
        `Absolute (UTC): ${new Date(instant).toISOString()}`,
        `${from}: ${offsetLabel(fromOffset)} | ${to}: ${offsetLabel(toOffset)}`,
        `Offset difference: ${deltaLabel}`,
        dayShift === 0 ? "Same calendar day in both zones." : `Attention: this lands on a ${dayShift > 0 ? "later" : "previous"} calendar day in ${to}.`,
    ].join("\n");
}
/** Finds the DST transitions in a year by scanning for offset changes. */
function transitions(timeZone, year) {
    const found = [];
    const start = Date.UTC(year, 0, 1);
    const end = Date.UTC(year + 1, 0, 1);
    let previous = zoneOffsetMs(timeZone, start);
    // Hourly steps are enough: every real transition lands on a whole hour.
    for (let ms = start + 3600000; ms <= end; ms += 3600000) {
        const current = zoneOffsetMs(timeZone, ms);
        if (current !== previous) {
            // Walk back to the exact minute the change happened.
            let low = ms - 3600000;
            let high = ms;
            while (high - low > 60000) {
                const mid = low + Math.floor((high - low) / 120000) * 60000;
                if (zoneOffsetMs(timeZone, mid) === previous)
                    low = mid;
                else
                    high = mid;
            }
            found.push({ at: new Date(high), fromMs: previous, toMs: current });
            previous = current;
        }
    }
    return found;
}
export async function timezoneInfo(args) {
    const zone = args.timeZone?.trim();
    if (!isKnownZone(zone))
        throw new Error(`"${zone}" is not a known IANA timezone, for example Europe/Berlin.`);
    const year = args.year ?? new Date().getUTCFullYear();
    const now = Date.now();
    const offsetNow = zoneOffsetMs(zone, now);
    const january = zoneOffsetMs(zone, Date.UTC(year, 0, 15, 12));
    const july = zoneOffsetMs(zone, Date.UTC(year, 6, 15, 12));
    const shift = transitions(zone, year);
    const lines = [
        `Timezone: ${zone}`,
        `Right now: ${formatInZone(zone, now)} (${offsetLabel(offsetNow)})`,
        `Standard offset in ${year}: ${offsetLabel(Math.min(january, july))} | Summer offset: ${offsetLabel(Math.max(january, july))}`,
        `Observes daylight saving: ${shift.length ? "yes" : "no"}`,
        "",
    ];
    if (shift.length) {
        lines.push(`Clock changes in ${year}:`);
        for (const change of shift) {
            const forward = change.toMs > change.fromMs;
            lines.push(`  ${change.at.toISOString().slice(0, 16).replace("T", " ")} UTC — clocks move ${forward ? "forward" : "back"} one hour (${offsetLabel(change.fromMs)} -> ${offsetLabel(change.toMs)})`);
        }
    }
    else {
        lines.push(`${zone} keeps the same offset all year.`);
    }
    return lines.join("\n");
}
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function parseWeekend(value) {
    const days = value?.length ? value : [0, 6];
    const cleaned = days.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!cleaned.length)
        throw new Error("Weekend days must be numbers from 0 (Sunday) to 6 (Saturday).");
    return new Set(cleaned);
}
const isoDate = (d) => d.toISOString().slice(0, 10);
function parseDateOnly(value) {
    const parsed = parseDateTime(value);
    return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}
export async function businessDays(args) {
    const weekend = parseWeekend(args.weekendDays);
    const holidays = new Set((args.holidays ?? []).map((h) => h.trim()));
    const start = parseDateOnly(args.startDate);
    const end = parseDateOnly(args.endDate);
    if (end < start)
        return "The end date is before the start date.";
    let business = 0;
    let weekendCount = 0;
    let holidayCount = 0;
    const cursor = new Date(start.getTime());
    while (cursor <= end) {
        const weekday = cursor.getUTCDay();
        const day = isoDate(cursor);
        if (weekend.has(weekday))
            weekendCount += 1;
        else if (holidays.has(day))
            holidayCount += 1;
        else
            business += 1;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return [
        `Business days from ${isoDate(start)} to ${isoDate(end)}`,
        `${business} business day(s) out of ${totalDays} calendar day(s)`,
        `Weekend days excluded: ${weekendCount} (${[...weekend].sort().map((d) => DAY_NAMES[d]).join(", ")})`,
        `Holidays excluded: ${holidayCount}`,
        "",
        `Working time available: ${business * 8} hour(s) at 8 hours per business day.`,
    ].join("\n");
}
export async function addBusinessDays(args) {
    const weekend = parseWeekend(args.weekendDays);
    const holidays = new Set((args.holidays ?? []).map((h) => h.trim()));
    const days = Number(args.days);
    if (!Number.isInteger(days) || days === 0)
        return "Provide a whole number of business days, positive or negative.";
    const cursor = parseDateOnly(args.startDate);
    const step = days > 0 ? 1 : -1;
    let remaining = Math.abs(days);
    let guard = 0;
    while (remaining > 0 && guard < 4000) {
        cursor.setUTCDate(cursor.getUTCDate() + step);
        guard += 1;
        if (weekend.has(cursor.getUTCDay()))
            continue;
        if (holidays.has(isoDate(cursor)))
            continue;
        remaining -= 1;
    }
    if (remaining > 0)
        return `Could not count ${days} business day(s) from ${args.startDate}; the weekend or holiday rules exclude too many days.`;
    return [
        `${days > 0 ? "Add" : "Subtract"} ${Math.abs(days)} business day(s) ${days > 0 ? "to" : "from"} ${isoDate(parseDateOnly(args.startDate))}`,
        `Result: ${isoDate(cursor)} (${DAY_NAMES[cursor.getUTCDay()]})`,
        `Holidays excluded: ${holidays.size}`,
    ].join("\n");
}
function parseBusy(block, zone) {
    const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/.exec(block.trim());
    if (!match)
        throw new Error(`Busy block "${block}" must look like 2026-09-28 09:00-10:00.`);
    const [, day, from, to] = match;
    const [y, mo, d] = day.split("-").map(Number);
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    return {
        start: zonedTimeToInstant(zone, y, mo, d, fh, fm),
        end: zonedTimeToInstant(zone, y, mo, d, th, tm),
        label: `${from}-${to}`,
    };
}
export async function meetingSlots(args) {
    const zone = args.timeZone?.trim();
    if (!isKnownZone(zone))
        throw new Error(`"${zone}" is not a known IANA timezone, for example America/Chicago.`);
    const duration = Math.min(Math.max(Number(args.durationMinutes ?? 30) || 30, 5), 480);
    const startHour = Math.min(Math.max(Number(args.workStartHour ?? 9) || 9, 0), 23);
    const endHour = Math.min(Math.max(Number(args.workEndHour ?? 17) || 17, startHour + 1), 24);
    const day = parseDateOnly(args.date);
    if (endHour - startHour <= 0)
        return "The working day must end after it starts.";
    const busy = (args.busy ?? []).filter(Boolean).map((b) => parseBusy(b, zone));
    const alsoShow = (args.alsoShow ?? []).filter(Boolean);
    const dayStart = zonedTimeToInstant(zone, day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), startHour, 0);
    const dayEnd = zonedTimeToInstant(zone, day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), endHour, 0);
    const slots = [];
    for (let t = dayStart; t + duration * 60000 <= dayEnd; t += 15 * 60000) {
        const slotEnd = t + duration * 60000;
        if (!busy.some((b) => t < b.end && slotEnd > b.start))
            slots.push({ start: t, end: slotEnd });
    }
    const lines = [
        `${isoDate(day)} (${DAY_NAMES[day.getUTCDay()]}) — ${duration} minute slot(s) in ${zone}`,
        `Working hours ${String(startHour).padStart(2, "0")}:00-${String(endHour).padStart(2, "0")}:00 ${offsetLabel(zoneOffsetMs(zone, dayStart))}`,
        busy.length ? `Busy blocks excluded: ${busy.map((b) => b.label).join(", ")}` : "No busy blocks given.",
        "",
    ];
    if (!slots.length) {
        lines.push("No free slots: the working day is fully booked or the busy blocks cover it.");
        return lines.join("\n");
    }
    lines.push(`${slots.length} free slot(s):`);
    for (const slot of slots) {
        const extra = alsoShow
            .map((other) => {
            try {
                return ` | ${formatInZone(other, slot.start).slice(11, 16)} ${other}`;
            }
            catch {
                return "";
            }
        })
            .join("");
        lines.push(`  ${formatInZone(zone, slot.start).slice(11, 16)}-${formatInZone(zone, slot.end).slice(11, 16)}${extra}`);
    }
    return lines.join("\n");
}
export async function worldClock(args) {
    const zones = (args.timeZones ?? []).map((z) => String(z).trim()).filter(Boolean).slice(0, 12);
    if (!zones.length)
        return "Provide up to 12 timezones, for example [\"Europe/London\", \"Asia/Tokyo\"].";
    const now = Date.now();
    const lines = [`Current time in ${zones.length} timezone(s)`, ""];
    for (const zone of zones) {
        try {
            lines.push(`${zone.padEnd(24)} ${formatInZone(zone, now)} (${offsetLabel(zoneOffsetMs(zone, now))})`);
        }
        catch (e) {
            lines.push(`${zone.padEnd(24)} unknown timezone (${errorMessage(e)})`);
        }
    }
    return lines.join("\n");
}
export async function teamOverlap(args) {
    const zones = (args.timeZones ?? []).map((z) => String(z).trim()).filter(Boolean).slice(0, 8);
    if (zones.length < 2)
        return "Provide at least two timezones to find overlapping working hours.";
    const startHour = Math.min(Math.max(Number(args.windowStartHour ?? 9) || 9, 0), 23);
    const endHour = Math.min(Math.max(Number(args.windowEndHour ?? 17) || 17, startHour + 1), 24);
    for (const zone of zones) {
        if (!isKnownZone(zone))
            throw new Error(`"${zone}" is not a known IANA timezone.`);
    }
    // Walk one UTC day hour by hour and keep the hours that fall inside everyone's
    // working window. Offsets come from the live timezone database, so DST is handled.
    const today = new Date();
    const dayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const windows = [];
    for (let hour = 0; hour < 24; hour += 1) {
        const instant = dayStart + hour * 3600000;
        const locals = zones.map((zone) => ({ zone, parts: zonedParts(zone, instant) }));
        if (!locals.every((l) => l.parts.hour >= startHour && l.parts.hour < endHour))
            continue;
        const label = `${String(hour).padStart(2, "0")}:00 UTC — ` +
            locals.map((l) => `${l.zone.split("/").pop()} ${String(l.parts.hour).padStart(2, "0")}:${String(l.parts.minute).padStart(2, "0")}`).join(", ");
        windows.push(label);
    }
    const lines = [
        `Overlapping working hours for ${zones.join(", ")}`,
        `Everyone's local time between ${String(startHour).padStart(2, "0")}:00 and ${String(endHour).padStart(2, "0")}:00`,
        "",
    ];
    if (!windows.length) {
        lines.push("No hour today falls inside everyone's working hours. Someone has to take a late or early call, or use an asynchronous update instead.");
        return lines.join("\n");
    }
    lines.push(`${windows.length} overlapping hour(s) on a UTC day (${isoDate(new Date(dayStart))}), by UTC hour:`);
    windows.slice(0, 12).forEach((w) => lines.push(`  ${w}`));
    lines.push("", "Offset to your own date, then confirm in the attendees' own calendars.");
    return lines.join("\n");
}
// ---- muxH tools:
// The tools above move by hours and by working days. These two do the two
// things a calendar actually gets wrong: moving by whole months across a short
// month, and expressing a span of time in the several different units a
// deadline has to be stated in.
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
function parseDay(value) {
    const raw = String(value ?? "").trim();
    const match = ISO_DATE_ONLY.exec(raw);
    if (!match)
        throw new Error(`"${value}" is not a date. Use YYYY-MM-DD.`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day)
        throw new Error(`"${raw}" is not a real calendar date.`);
    return { year, month, day };
}
function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
/** ISO 8601 week numbering: the week of the year that contains a Thursday. */
function isoWeekOf(date) {
    const probe = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const weekday = (probe.getUTCDay() + 6) % 7;
    probe.setUTCDate(probe.getUTCDate() - weekday + 3);
    const weekYear = probe.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
    const firstWeekday = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstWeekday + 3);
    const week = Math.round((probe.getTime() - firstThursday.getTime()) / (7 * 86400000)) + 1;
    return { week, weekYear };
}
function factsFor(date) {
    const year = date.getUTCFullYear();
    const janFirst = Date.UTC(year, 0, 1);
    const dayOfYear = Math.floor((date.getTime() - janFirst) / 86400000) + 1;
    const iso = isoWeekOf(date);
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return {
        iso: isoDate(date),
        weekday: DAY_NAMES[date.getUTCDay()],
        dayOfYear,
        isoWeek: iso.week,
        isoWeekYear: iso.weekYear,
        quarter: Math.floor(date.getUTCMonth() / 3) + 1,
        leap,
    };
}
function stepLine(label, date, note) {
    const f = factsFor(date);
    const week = `ISO ${f.isoWeekYear}-W${String(f.isoWeek).padStart(2, "0")}`;
    const tail = `day ${f.dayOfYear} of the year, ${week}, Q${f.quarter}, ${f.leap ? "leap" : "common"} year`;
    return `  ${label.padEnd(14)} ${f.iso} (${f.weekday}) — ${tail}${note ? ` — ${note}` : ""}`;
}
export async function calendarArithmetic(args) {
    const start = parseDay(args.date);
    const months = Number(args.months ?? 0) || 0;
    const years = Number(args.years ?? 0) || 0;
    const days = Number(args.days ?? 0) || 0;
    for (const [name, value] of [["months", months], ["years", years], ["days", days]]) {
        if (!Number.isInteger(value))
            return `${name} must be a whole number, positive or negative.`;
    }
    if (!months && !years && !days)
        return "Give at least one of months, years or days to move the date by.";
    let cursor = { ...start };
    let cursorDate = new Date(Date.UTC(start.year, start.month - 1, start.day));
    const steps = [stepLine("Start", cursorDate)];
    if (months) {
        const total = cursor.year * 12 + (cursor.month - 1) + months;
        const targetYear = Math.floor(total / 12);
        const targetMonth = ((total % 12) + 12) % 12;
        const wanted = cursor.day;
        const clamped = Math.min(wanted, daysInMonth(targetYear, targetMonth + 1));
        cursorDate = new Date(Date.UTC(targetYear, targetMonth, clamped));
        cursor = { year: targetYear, month: targetMonth + 1, day: clamped };
        const note = clamped < wanted
            ? `${targetYear}-${String(targetMonth + 1).padStart(2, "0")} has only ${clamped} day(s), so day ${wanted} clamps to ${clamped}`
            : "";
        steps.push(stepLine(`${months > 0 ? "+" : ""}${months} month(s)`, cursorDate, note));
    }
    if (years) {
        const targetYear = cursor.year + years;
        const wanted = cursor.day;
        const clamped = Math.min(wanted, daysInMonth(targetYear, cursor.month));
        cursorDate = new Date(Date.UTC(targetYear, cursor.month - 1, clamped));
        cursor = { year: targetYear, month: cursor.month, day: clamped };
        const note = clamped < wanted ? `February of ${targetYear} has only ${clamped} day(s), so day ${wanted} clamps to ${clamped}` : "";
        steps.push(stepLine(`${years > 0 ? "+" : ""}${years} year(s)`, cursorDate, note));
    }
    if (days) {
        cursorDate = new Date(cursorDate.getTime() + days * 86400000);
        steps.push(stepLine(`${days > 0 ? "+" : ""}${days} day(s)`, cursorDate));
    }
    return [
        `Calendar arithmetic from ${start.year}-${String(start.month).padStart(2, "0")}-${String(start.day).padStart(2, "0")}`,
        "Applied in a fixed order: months, then years, then days, each step starting from the previous result.",
        "",
        ...steps,
        "",
        "End-of-month clamping is stated on the step where it happens; nothing is silently rounded.",
    ].join("\n");
}
export async function durationReport(args) {
    const from = parseDay(args.from);
    const to = parseDay(args.to);
    const fromMs = Date.UTC(from.year, from.month - 1, from.day);
    const toMs = Date.UTC(to.year, to.month - 1, to.day);
    const forward = toMs >= fromMs;
    const a = forward ? from : to;
    const b = forward ? to : from;
    const aMs = Date.UTC(a.year, a.month - 1, a.day);
    const bMs = Date.UTC(b.year, b.month - 1, b.day);
    const totalDays = Math.round((bMs - aMs) / 86400000);
    const totalSeconds = totalDays * 86400;
    // Step the start date forward by whole months, clamped, and only keep a month
    // count whose result still lands on or before the end date. Subtracting day
    // numbers directly goes wrong across a short month (31 Jan to 1 Mar).
    let monthsTotal = (b.year - a.year) * 12 + (b.month - a.month);
    const shiftMonths = (months) => {
        const total = a.year * 12 + (a.month - 1) + months;
        const year = Math.floor(total / 12);
        const month = total % 12;
        const day = Math.min(a.day, daysInMonth(year, month + 1));
        return new Date(Date.UTC(year, month, day));
    };
    while (monthsTotal > 0 && shiftMonths(monthsTotal).getTime() > bMs)
        monthsTotal -= 1;
    const monthsAnchor = shiftMonths(monthsTotal);
    const days = Math.round((bMs - monthsAnchor.getTime()) / 86400000);
    const years = Math.trunc(monthsTotal / 12);
    const months = monthsTotal - years * 12;
    const week = new Set((args.workweek?.length ? args.workweek : [1, 2, 3, 4, 5])
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6));
    let working = 0;
    let weekendDays = 0;
    for (let t = aMs; t <= bMs; t += 86400000) {
        if (week.has(new Date(t).getUTCDay()))
            working += 1;
        else
            weekendDays += 1;
    }
    const iso = `P${years ? `${years}Y` : ""}${months ? `${months}M` : ""}${days || (!years && !months) ? `${days}D` : ""}`;
    const dayNames = [...week].sort().map((d) => DAY_NAMES[d]).join(", ") || "none";
    const lines = [
        forward
            ? `Span from ${isoDate(new Date(aMs))} to ${isoDate(new Date(bMs))}`
            : `Span from ${isoDate(new Date(bMs))} to ${isoDate(new Date(aMs))} (the arguments were given the other way round, so this is the absolute span)`,
        "",
        `  ISO 8601 duration   ${iso}`,
        `  Calendar breakdown  ${years ? `${years} year(s) ` : ""}${months ? `${months} month(s) ` : ""}${days} day(s)`,
        `  Total days          ${totalDays.toLocaleString()}`,
        `  Total seconds       ${totalSeconds.toLocaleString()}`,
        `  Days and hours      ${totalDays.toLocaleString()} day(s) and 0 hour(s), because both ends are dates without a time of day`,
        `  Whole weeks         ${Math.floor(totalDays / 7)} week(s) and ${totalDays % 7} day(s)`,
        "",
        `  Working days        ${working.toLocaleString()} of ${(totalDays + 1).toLocaleString()} inclusive day(s)`,
        `  Non-working days    ${weekendDays.toLocaleString()} (working weekdays: ${dayNames})`,
        "",
        "Months and years are counted on the calendar, not as 30- or 365-day blocks, so the breakdown and the total days only agree when you add them back up on the calendar.",
    ];
    return lines.join("\n");
}
