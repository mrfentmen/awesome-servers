/**
 * Mailjet API v3 client. Needs MJ_APIKEY_PUBLIC + MJ_APIKEY_PRIVATE
 * (free at https://app.mailjet.com/). Basic auth.
 * Docs: https://dev.mailjet.com/email/reference/
 */
const BASE = "https://api.mailjet.com/v3"

export class MailjetError extends Error {}

function headers(): Record<string, string> {
  const pub = process.env.MJ_APIKEY_PUBLIC
  const priv = process.env.MJ_APIKEY_PRIVATE
  if (!pub || !priv) throw new MailjetError("Set MJ_APIKEY_PUBLIC and MJ_APIKEY_PRIVATE first (free at app.mailjet.com).")
  return {
    "User-Agent": "mailjet-mcp/1.0",
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${pub}:${priv}`).toString("base64")}`,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new MailjetError("Mailjet refused (401/403). Check API keys.")
  if (res.status === 404) throw new MailjetError("Not found.")
  if (!res.ok) throw new MailjetError(`Mailjet error ${res.status}`)
  return (await res.json()) as T
}

export interface Contact {
  email?: string
  name?: string
  created?: string
  unsubscribed?: boolean
}

export async function listContacts(limit = 10): Promise<Contact[]> {
  const data = await getJson<Raw>(`/REST/contact?Limit=${Math.min(Math.max(limit, 1), 1000)}`)
  const rows: Raw[] = Array.isArray(data.Data) ? data.Data : []
  return rows.slice(0, limit).map((c) => ({
    email: c.Email,
    name: c.Name || undefined,
    created: c.CreatedAt ? String(c.CreatedAt).slice(0, 10) : undefined,
    unsubscribed: c.IsExcludedFromCampaigns,
  }))
}

export interface EmailMsg {
  id?: number
  to?: string
  subject?: string
  status?: string
  date?: string
}

export async function recentMessages(limit = 10): Promise<EmailMsg[]> {
  const data = await getJson<Raw>(`/REST/message?Limit=${Math.min(Math.max(limit, 1), 1000)}&ShowSubject=true&ShowContactAlt=true`)
  const rows: Raw[] = Array.isArray(data.Data) ? data.Data : []
  return rows.slice(0, limit).map((m) => ({
    id: m.ID,
    to: m.ContactAlt,
    subject: m.Subject,
    status: m.Status,
    date: m.ArrivedAt ? String(m.ArrivedAt).slice(0, 16).replace("T", " ") : undefined,
  }))
}

export function formatContact(c: Contact, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${c.email ?? "?"}${c.name ? ` (${c.name})` : ""}${c.unsubscribed ? " [unsubscribed]" : ""}${c.created ? ` — since ${c.created}` : ""}`
}

export function formatMessage(m: EmailMsg, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${m.id ?? "?"}] ${m.subject ?? "(no subject)"} → ${m.to ?? "?"}${m.status ? ` [${m.status}]` : ""}${m.date ? ` (${m.date})` : ""}`
}

// ---- muxF tools:
/**
 * No Mailjet key needed for either of these: one is a local check of a message
 * you already have in front of you, the other is arithmetic on time zones.
 */
const MJ_LOCALS = new Set([
  "admin", "abuse", "billing", "bounce", "bounces", "compliance", "contact", "do-not-reply",
  "feedback", "hello", "help", "info", "mail", "marketing", "noreply", "no-reply",
  "notifications", "postmaster", "sales", "support", "team", "unsubscribe", "webmaster",
]);

const mjHeaderBlock = (raw: string): Map<string, string[]> => {
  const unfolded = raw.replace(/\r?\n[ \t]+/g, " ");
  const map = new Map<string, string[]>();
  for (const line of unfolded.split(/\r?\n/)) {
    if (!line.trim()) break;
    if (!/^[!-9;-~]+:/.test(line)) continue;
    const at = line.indexOf(":");
    const name = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(value);
  }
  return map;
};

const mjFirst = (headers: Map<string, string[]>, name: string): string | null => headers.get(name)?.[0] ?? null;

const mjAddressProblem = (value: string): string | null => {
  const addresses = value.match(/<[^>]+>|[^\s,;]+@[^<>\s,;]+/g) ?? [];
  if (!addresses.length) return "no address found";
  for (const raw of addresses) {
    const address = raw.replace(/[<>]/g, "").trim();
    const at = address.lastIndexOf("@");
    if (at <= 0) return `"${address}" has no @`;
    const local = address.slice(0, at);
    const domain = address.slice(at + 1);
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain)) {
      return `"${domain}" is not a domain name`;
    }
    if (local.length > 64) return "local part is longer than the 64 characters RFC 5321 allows";
    if (/[^\x21-\x7e]/.test(local)) return "local part has a character that needs quoting";
  }
  return null;
};

/** Check a raw message the way a receiving MTA would read it, before it is ever sent. */
export async function messageHeaderLint(args: { message: string }): Promise<string> {
  const raw = String(args?.message ?? "").replace(/\r\n/g, "\n");
  if (!raw.trim()) throw new MailjetError("Paste the raw message, headers and all.");
  const split = raw.indexOf("\n\n");
  const headerText = split >= 0 ? raw.slice(0, split) : raw;
  const body = split >= 0 ? raw.slice(split + 2) : "";
  const headers = mjHeaderBlock(headerText);
  if (!headers.size) throw new MailjetError("No header line found: a message has to start with a From: or Subject: line.");

  const get = (name: string) => mjFirst(headers, name);
  const findings: string[] = [];
  const notes: string[] = [];

  const from = get("from");
  const to = get("to");
  const subject = get("subject") ?? "";
  const messageId = get("message-id");
  const date = get("date");
  const returnPath = get("return-path");
  const dkim = get("dkim-signature");
  const received = headers.get("received") ?? [];
  const listUnsubscribe = get("list-unsubscribe");

  if (!from) findings.push("no From: header, which every message needs");
  else {
    const problem = mjAddressProblem(from);
    if (problem) findings.push(`From: ${problem}`);
  }
  if (!to) findings.push("no To: header");
  else {
    const problem = mjAddressProblem(to);
    if (problem) findings.push(`To: ${problem}`);
  }
  if (!subject.trim()) findings.push("no Subject: header");
  else if (subject.length > 78) notes.push(`Subject is ${subject.length} characters, past the roughly 78 most clients show`);
  if (!date) findings.push("no Date: header, which receivers use to spot a clock that is wrong");
  if (!messageId) notes.push("no Message-ID, so a bounce cannot be matched to this send");
  if (!dkim) findings.push("no DKIM-Signature header, so nothing here is cryptographically tied to your domain");
  if (!listUnsubscribe && !/unsubscribe|opt[ -]?out/i.test(body)) {
    findings.push("no List-Unsubscribe header and no unsubscribe link in the body");
  }
  if (!returnPath) notes.push("no Return-Path, so the envelope sender is only set at submission time");
  if (!/^Content-Type:\s*multipart\//im.test(headerText) && body.includes("--")) {
    notes.push("body looks like a multipart document but the Content-Type is not multipart");
  }

  const lines = [
    `Message lint: ${headers.size} distinct header(s), ${body.length} character(s) of body`,
    `  From: ${from ?? "not reported"}`,
    `  To: ${to ?? "not reported"}`,
    `  Subject: ${subject ? `${subject.slice(0, 120)}${subject.length > 120 ? "..." : ""} (${subject.length} characters)` : "not reported"}`,
    `  Date: ${date ?? "not reported"}${date ? `, parsed as ${Number.isFinite(Date.parse(date)) ? new Date(Date.parse(date)).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "unparseable"}` : ""}`,
    `  Message-ID: ${messageId ?? "not reported"}`,
    `  Return-Path: ${returnPath ?? "not reported"}`,
    `  DKIM-Signature: ${dkim ? dkim.slice(0, 120) : "not reported"}`,
    `  List-Unsubscribe: ${listUnsubscribe ?? "not reported"}`,
    `  Received: ${received.length} hop(s), first added by ${received.length ? received[0].split(";")[0].slice(0, 60) : "nothing, so this is the raw submitted message"}`,
  ];
  const contentType = get("content-type");
  if (contentType) lines.push(`  Content-Type: ${contentType.slice(0, 120)}`);
  const fromLocal = from ? (from.match(/<([^>]+)>/)?.[1] ?? from).split("@")[0].toLowerCase() : "";
  if (fromLocal && MJ_LOCALS.has(fromLocal)) {
    notes.push(`From: local part "${fromLocal}" is a role address, which some receiving systems score down`);
  }
  if (body) {
    const links = (body.match(/https?:\/\/\S+/g) ?? []).length;
    const html = /<html|<body|<div/i.test(body);
    lines.push(`  body: ${html ? "HTML" : "plain text"}${links ? `, ${links} URL(s)` : ", no link found"}`);
    if (html && !/<a\b/i.test(body)) notes.push("body is HTML with no anchor tag at all");
  } else {
    lines.push("  body: empty, so there is nothing to deliver");
  }
  if (notes.length) {
    lines.push("");
    for (const note of notes) lines.push(`  note: ${note}`);
  }
  lines.push("");
  lines.push(findings.length ? `  before sending, fix: ${findings.join("; ")}.` : "  nothing missing that a receiving MTA would object to.");
  return lines.join("\n");
}

/** Turn "send it at 9am their time" into real UTC instants, per recipient time zone. */
export async function sendTimePlanner(args: { zones: string; localHour?: number; days?: number }): Promise<string> {
  const zones = String(args?.zones ?? "")
    .split(/[\s,]+/)
    .map((z) => z.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!zones.length) throw new MailjetError("Give one or more IANA time zones, e.g. Europe/London America/New_York.");
  const hour = Math.min(Math.max(Number(args?.localHour ?? 9) || 9, 0), 23);
  const days = Math.min(Math.max(Number(args?.days ?? 5) || 5, 1), 14);

  const formatters = new Map<string, Intl.DateTimeFormat>();
  for (const zone of zones) {
    try {
      formatters.set(
        zone,
        new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short", hour12: false }),
      );
    } catch {
      throw new MailjetError(`"${zone}" is not an IANA time zone name.`);
    }
  }

  // Walk the next `days` days, one step per candidate day, and find the UTC
  // instant that reads as `hour`:00 local time on a weekday in each zone.
  const now = new Date();
  const slots = new Map<string, Date[]>([...zones].map((z) => [z, []]));
  const lastLocalDay = new Map<string, string>([...zones].map((z) => [z, ""]));
  // Hourly steps across days+2 calendar days: an hour that is skipped by DST
  // must not eat one of the requested slots.
  const steps = (days + 2) * 26;
  for (let step = 0; step < steps; step += 1) {
    const probe = new Date(now.getTime() + step * 3_600_000);
    for (const [zone, formatter] of formatters) {
      const bucket = slots.get(zone)!;
      if (bucket.length >= days) continue;
      const parts = formatter.formatToParts(probe);
      const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
      if (weekday === "Sat" || weekday === "Sun") continue;
      const localHour = Number(parts.find((part) => part.type === "hour")?.value ?? "99") % 24;
      if (localHour !== hour) continue;
      const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "?";
      const localDay = `${value("year")}-${value("month")}-${value("day")}`;
      if (lastLocalDay.get(zone) === localDay) continue;
      lastLocalDay.set(zone, localDay);
      bucket.push(new Date(probe.getTime() - probe.getMinutes() * 60_000 - probe.getSeconds() * 1000 - probe.getMilliseconds()));
    }
    if ([...slots.values()].every((bucket) => bucket.length >= days)) break;
  }

  const lines = [
    `Next ${days} weekday slot(s) at ${String(hour).padStart(2, "0")}:00 local time, per zone:`,
    "",
  ];
  for (const zone of zones) {
    const bucket = slots.get(zone)!;
    const offsetNow = formatters.get(zone)!.formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "unknown";
    lines.push(`  ${zone} (${offsetNow} now)`);
    if (!bucket.length) {
      lines.push(`    no weekday at ${hour}:00 found within the search window`);
      continue;
    }
    for (const slot of bucket) {
      lines.push(`    local ${slot.toISOString().slice(0, 10)} ${String(hour).padStart(2, "0")}:00 -> send at ${slot.toISOString().slice(0, 16).replace("T", " ")} UTC`);
    }
  }
  const all = zones.flatMap((z) => slots.get(z)!.map((slot) => slot.getTime()));
  if (all.length) {
    const spread = (Math.max(...all) - Math.min(...all)) / 3_600_000;
    lines.push("");
    lines.push(`  Across these zones the same local hour falls within ${Math.round(spread)} hour(s) of UTC, so a single send time cannot hit ${hour}:00 everywhere.`);
  }
  return lines.join("\n");
}
