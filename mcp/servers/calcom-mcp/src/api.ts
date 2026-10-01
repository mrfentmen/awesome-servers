export class CalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.CAL_API_KEY;
  if (!k) throw new CalError("Set CAL_API_KEY (Cal.com API key).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}`, "cal-api-version": "2024-06-14" };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.cal.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CalError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listEventTypes(): Promise<string> {
  return get("/v2/event-types");
}

export function listBookings(): Promise<string> {
  return get("/v2/bookings");
}

export function listSchedules(): Promise<string> {
  return get("/v2/schedules");
}



export function eventType(typeId: string): Promise<string> {
  return get(`/v2/event-types/${encodeURIComponent(typeId)}`);
}

export function booking(uid: string): Promise<string> {
  return get(`/v2/bookings/${encodeURIComponent(uid)}`);
}

export function schedule(scheduleId: string): Promise<string> {
  return get(`/v2/schedules/${encodeURIComponent(scheduleId)}`);
}

export function teams(): Promise<string> {
  return get("/v2/teams");
}

export function teamDetails(teamId: string): Promise<string> {
  return get(`/v2/teams/${encodeURIComponent(teamId)}`);
}

export function webhooks(): Promise<string> {
  return get("/v2/webhooks");
}

export function me(): Promise<string> {
  return get("/v2/me");
}

// ---- muxD tools:

interface Slot { time?: string }
interface SlotDay { [day: string]: Slot[] }
interface PublicEventType {
  id?: number; title?: string; slug?: string; description?: string | null;
  lengthInMinutes?: number; lengthInMinutesOptions?: number[]; hidden?: boolean;
  minimumBookingNotice?: number; beforeEventBuffer?: number; afterEventBuffer?: number;
  bookingLimits?: Record<string, unknown> | null; price?: number; currency?: string;
  availableTimes?: unknown[]; seatsPerBooking?: number | null; timeBlocks?: unknown[] | null;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /v2/slots/available - a public endpoint, no key needed.
 * data.slots maps YYYY-MM-DD to an array of { time } entries.
 */
async function slotMap(
  startTime: string,
  endTime: string,
  eventTypeId: string,
  timeZone: string,
): Promise<{ slots: SlotDay; days: string[] }> {
  const params = new URLSearchParams({ startTime, endTime, eventTypeId });
  if (timeZone) params.set("timeZone", timeZone);
  const qs = params.toString();
  let res: Response;
  try {
    res = await fetch(`https://api.cal.com/v2/slots/available?${qs}`, {
      headers: { ...UA, Accept: "application/json", "cal-api-version": "2024-06-14" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CalError(`Network error: ${errorMessage(e)}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CalError(`Cal.com slots endpoint returned ${res.status}: ${body}`);
  }
  const body = (await res.json()) as { data?: { slots?: SlotDay } };
  const slots = body?.data?.slots ?? {};
  return { slots, days: Object.keys(slots).sort() };
}

export interface SlotsArgs {
  event_type_id: string;
  start_date: string;
  end_date: string;
  time_zone?: string;
}

/** Every open slot between two dates, with a per-day count. */
export async function openSlots(args: SlotsArgs): Promise<string> {
  const id = (args.event_type_id ?? "").trim();
  if (!/^\d+$/.test(id)) throw new CalError("Event type id must be numeric.");
  const start = (args.start_date ?? "").trim();
  const end = (args.end_date ?? "").trim();
  if (!ISO_DAY.test(start) || !ISO_DAY.test(end)) throw new CalError("Dates must be YYYY-MM-DD.");
  if (end < start) throw new CalError("end_date must not be before start_date.");
  const spanDays = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
  if (spanDays > 60) throw new CalError("Ask for 60 days or fewer at a time.");
  const tz = (args.time_zone ?? "UTC").trim() || "UTC";

  const { slots, days } = await slotMap(`${start}T00:00:00Z`, `${end}T23:59:59Z`, id, tz);
  const requested = Math.round(spanDays) + 1;
  if (!days.length) {
    return `Cal.com reports no open slots for event type ${id} between ${start} and ${end} (time zone ${tz}).`;
  }
  const total = days.reduce((s, d) => s + (slots[d]?.length ?? 0), 0);
  const lines = [
    `Open Cal.com slots for event type ${id}, ${start} to ${end} (time zone ${tz})`,
    `${total} slot(s) across ${days.length} of the ${requested} day(s) requested.`,
    "",
  ];
  for (const day of days) {
    const row = slots[day] ?? [];
    const times = row.map((s) => String(s.time ?? "").slice(11, 16)).filter(Boolean);
    lines.push(`${day} — ${row.length} slot(s)${times.length ? `: ${times.slice(0, 14).join(", ")}${times.length > 14 ? ", ..." : ""}` : ""}`);
  }
  const closed = days.length < requested ? requested - days.length : 0;
  if (closed > 0) lines.push("", `${closed} day(s) in the range carry no slots at all.`);
  return lines.join("\n");
}

export interface DensityArgs {
  event_type_id: string;
  start_date: string;
  end_date: string;
  time_zone?: string;
}

/** Which days are open and how busy: a per-day slot count with a weekday shape. */
export async function slotDensity(args: DensityArgs): Promise<string> {
  const id = (args.event_type_id ?? "").trim();
  if (!/^\d+$/.test(id)) throw new CalError("Event type id must be numeric.");
  const start = (args.start_date ?? "").trim();
  const end = (args.end_date ?? "").trim();
  if (!ISO_DAY.test(start) || !ISO_DAY.test(end)) throw new CalError("Dates must be YYYY-MM-DD.");
  if (end < start) throw new CalError("end_date must not be before start_date.");
  const spanDays = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
  if (spanDays > 60) throw new CalError("Ask for 60 days or fewer at a time.");
  const tz = (args.time_zone ?? "UTC").trim() || "UTC";

  const { slots, days } = await slotMap(`${start}T00:00:00Z`, `${end}T23:59:59Z`, id, tz);
  const requested = Math.round(spanDays) + 1;
  if (!days.length) {
    return `Cal.com reports no open slots for event type ${id} between ${start} and ${end}, so there is no density to report.`;
  }
  const counts = days.map((d) => ({ day: d, n: slots[d]?.length ?? 0 }));
  const values = counts.map((c) => c.n).sort((a, b) => a - b);
  const busiest = [...counts].sort((a, b) => b.n - a.n)[0];
  const quietest = [...counts].sort((a, b) => a.n - b.n)[0];
  const byWeekday = new Map<string, { days: number; slots: number }>();
  for (const c of counts) {
    const wd = new Date(`${c.day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const b = byWeekday.get(wd) ?? { days: 0, slots: 0 };
    b.days += 1;
    b.slots += c.n;
    byWeekday.set(wd, b);
  }
  const chart = (n: number) => (n === 0 ? "(closed)" : "#".repeat(Math.min(40, Math.max(1, Math.round((n / Math.max(...values, 1)) * 40)))));
  return [
    `Slot density for Cal.com event type ${id}, ${start} to ${end} (time zone ${tz})`,
    `Days with any availability: ${days.length} of ${requested} | total slots ${values.reduce((a, b) => a + b, 0)}`,
    `Quietest open day: ${quietest.day} (${quietest.n} slot(s)) | busiest: ${busiest.day} (${busiest.n} slot(s))`,
    "",
    "Average slots per open day by weekday:",
    ...["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      .filter((wd) => byWeekday.has(wd))
      .map((wd) => {
        const b = byWeekday.get(wd) as { days: number; slots: number };
        return `  ${wd}: ${(b.slots / b.days).toFixed(1)} across ${b.days} open day(s)`;
      }),
    "",
    "Per day:",
    ...counts.map((c) => `  ${c.day}  ${String(c.n).padStart(3)} ${chart(c.n)}`),
  ].join("\n");
}

export interface PublicTypesArgs {
  username: string;
}

/** GET /v2/event-types?username= - public booking pages, no key needed. */
export async function publicEventTypes(args: PublicTypesArgs): Promise<string> {
  const username = (args.username ?? "").trim();
  if (!username) throw new CalError("Provide a Cal.com username, for example john.");
  const res = await fetch(`https://api.cal.com/v2/event-types?username=${encodeURIComponent(username)}`, {
    headers: { ...UA, Accept: "application/json", "cal-api-version": "2024-06-14" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CalError(`Cal.com returned ${res.status} for username ${username}: ${body}`);
  }
  const body = (await res.json()) as { data?: PublicEventType[] };
  const rows = Array.isArray(body?.data) ? body.data : [];
  if (!rows.length) {
    return `Cal.com user "${username}" has no public event types. Event types stay public only if the owner publishes them, so an empty list here is normal.`;
  }
  const lines = [`Public Cal.com event types for "${username}" (${rows.length}):`, ""];
  for (const e of rows) {
    if (e.hidden === true) continue;
    lines.push(`[${e.id ?? "?"}] ${e.title ?? "(untitled)"}`);
    if (e.slug) lines.push(`  booking slug: ${e.slug}`);
    lines.push(`  length: ${e.lengthInMinutes ?? "not reported"} min${Array.isArray(e.lengthInMinutesOptions) && e.lengthInMinutesOptions.length > 1 ? ` (also offered: ${e.lengthInMinutesOptions.join(", ")} min)` : ""}`);
    if (e.seatsPerBooking !== undefined && e.seatsPerBooking !== null) lines.push(`  seats per booking: ${e.seatsPerBooking}`);
    const buffers = [
      typeof e.beforeEventBuffer === "number" ? `before ${e.beforeEventBuffer} min` : null,
      typeof e.afterEventBuffer === "number" ? `after ${e.afterEventBuffer} min` : null,
    ].filter(Boolean);
    if (buffers.length) lines.push(`  buffer: ${buffers.join(", ")}`);
    if (typeof e.minimumBookingNotice === "number") lines.push(`  minimum notice: ${e.minimumBookingNotice} min`);
    if (e.price !== undefined && e.price !== null) lines.push(`  price: ${e.price} ${e.currency ?? "currency not reported"}`);
    const limits = e.bookingLimits && typeof e.bookingLimits === "object" ? Object.entries(e.bookingLimits) : [];
    if (limits.length) lines.push(`  booking limits: ${limits.map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(", ")}`);
    if (e.description) lines.push(`  ${String(e.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
