/**
 * Loops API v1 client. Needs LOOPS_API_KEY (free at https://app.loops.so/).
 * Docs: https://loops.so/docs/api-reference
 */
const BASE = "https://app.loops.so/api/v1"

export class LoopsError extends Error {}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.LOOPS_API_KEY
  if (!key) throw new LoopsError("Set LOOPS_API_KEY first (free at app.loops.so).")
  return { "User-Agent": "loops-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}`, ...extra }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new LoopsError("Loops rejected the key (401/403).")
  if (res.status === 404) throw new LoopsError("Not found.")
  if (!res.ok) throw new LoopsError(`Loops error ${res.status}`)
  return (await res.json()) as T
}

async function postJson<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new LoopsError("Loops rejected the key (401/403).")
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new LoopsError(`Loops error ${res.status}: ${msg.slice(0, 160)}`)
  }
  return (await res.json()) as T
}

export interface Contact {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
}

export async function findContact(email: string): Promise<Contact | null> {
  if (!email.includes("@")) throw new LoopsError(`Not an email: "${email}".`)
  const data = await getJson<Raw>(`/contacts/find?email=${encodeURIComponent(email.trim())}`)
  const list: Raw[] = Array.isArray(data) ? data : data.contacts ?? []
  const c: Raw | undefined = list[0]
  if (!c) return null
  return { id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName }
}

export async function createContact(email: string, firstName = "", lastName = ""): Promise<string> {
  if (!email.includes("@")) throw new LoopsError(`Not an email: "${email}".`)
  const body: Raw = { email: email.trim() }
  if (firstName.trim()) body.firstName = firstName.trim()
  if (lastName.trim()) body.lastName = lastName.trim()
  const data = await postJson<Raw>("/contacts/create", body)
  return `Contact ${email.trim()} created${data.id ? ` [${data.id}]` : ""}.`
}

export async function sendEvent(email: string, eventName: string, properties: Raw = {}): Promise<string> {
  if (!email.includes("@")) throw new LoopsError(`Not an email: "${email}".`)
  if (!eventName.trim()) throw new LoopsError("Event name is empty.")
  await postJson<Raw>("/events/send", { email: email.trim(), eventName: eventName.trim(), eventProperties: properties })
  return `Event ${eventName.trim()} sent for ${email.trim()}.`
}

export function formatContact(c: Contact): string {
  return `${c.email ?? "?"}${c.firstName ? ` — ${c.firstName}${c.lastName ? ` ${c.lastName}` : ""}` : ""}${c.id ? ` [${c.id}]` : ""}`
}

// ---- muxF tools:
/**
 * Keyless surfaces around an email platform: the DNS records a sending domain
 * publishes, and the links a campaign actually points at. Both are read from
 * the public internet, no LOOPS_API_KEY involved.
 */
const DNS_RESOLVE = "https://dns.google/resolve";
interface DnsAnswer {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
}

interface DnsReply {
  Status?: number;
  Answer?: DnsAnswer[];
}

async function dnsLookup(name: string, type: "MX" | "TXT"): Promise<DnsReply> {
  const url = `${DNS_RESOLVE}?name=${encodeURIComponent(name)}&type=${type}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new LoopsError(`DNS lookup failed for ${name}: ${(e as Error).message}`);
  }
  if (!res.ok) throw new LoopsError(`DNS-over-HTTPS returned HTTP ${res.status} for ${name}.`);
  const body = (await res.text()).trim();
  if (!body) throw new LoopsError(`DNS-over-HTTPS returned an empty body for ${name}.`);
  return JSON.parse(body) as DnsReply;
}

const dnsStrings = (reply: DnsReply): string[] =>
  (reply.Answer ?? []).map((a) => String(a.data ?? "").replace(/^"|"$/g, "")).filter(Boolean);

const bareDomain = (input: string): string => {
  const host = String(input ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split("@").pop() ?? "";
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
    throw new LoopsError(`"${input}" is not a domain name.`);
  }
  return host;
};

/**
 * Everything a domain publishes about its own mail: where mail is delivered,
 * what SPF authorises, and what DMARC demands of senders.
 */
export async function sendingDomainDns(args: { domain: string }): Promise<string> {
  const host = bareDomain(args?.domain);
  const [mx, spf, dmarc] = await Promise.all([
    dnsLookup(host, "MX").catch((e) => ({ Status: -1, Answer: [], error: (e as Error).message } as DnsReply & { error: string })),
    dnsLookup(host, "TXT").catch((e) => ({ Status: -1, Answer: [], error: (e as Error).message } as DnsReply & { error: string })),
    dnsLookup(`_dmarc.${host}`, "TXT").catch((e) => ({ Status: -1, Answer: [], error: (e as Error).message } as DnsReply & { error: string })),
  ]);

  const status = (reply: DnsReply & { error?: string }): string =>
    reply.error ? `lookup failed (${reply.error})` : reply.Status === 3 ? "domain does not exist" : `DNS status ${reply.Status}`;

  const mxRecords = dnsStrings(mx)
    .map((data) => {
      const [priority, host2] = data.split(/\s+/);
      return { priority: Number(priority), host: (host2 ?? "").replace(/\.$/, "") };
    })
    .filter((r) => Number.isFinite(r.priority))
    .sort((a, b) => a.priority - b.priority);
  const nullMx = mxRecords.length === 1 && mxRecords[0].host === "";
  const spfRecords = dnsStrings(spf).filter((t) => /^v=spf1/i.test(t));
  const dmarcRecords = dnsStrings(dmarc).filter((t) => /^v=dmarc1/i.test(t));
  const dmarcPolicy = dmarcRecords.map((t) => (/p=(\w+)/i.exec(t)?.[1] ?? "not reported")).join(", ");
  const dmarcSubdomain = dmarcRecords.map((t) => (/sp=(\w+)/i.exec(t)?.[1] ?? "none")).join(", ");
  const pct = dmarcRecords.map((t) => (/pct=(\d+)/i.exec(t)?.[1] ?? "not reported")).join(", ");

  const lines = [`Mail DNS for ${host}`];
  if (nullMx) {
    lines.push("  MX: a null MX record, which RFC 7505 defines as accepting no mail at all");
  } else if (mxRecords.length) {
    lines.push(`  MX: ${mxRecords.length} record(s), lowest priority first`);
    for (const r of mxRecords.slice(0, 6)) lines.push(`    ${r.priority} ${r.host}`);
    if (mxRecords.length > 6) lines.push(`    ...and ${mxRecords.length - 6} more`);
  } else {
    lines.push(`  MX: none found (${status(mx)}), so mail for this domain is not routed anywhere`);
  }
  if (spfRecords.length) {
    for (const record of spfRecords) {
      const mechanisms = record.split(/\s+/).slice(1).filter((m) => m && !/^v=spf1$/i.test(m));
      const lookups = mechanisms.filter((m) => /^(include|a|mx|ptr|exists|redirect)\b/i.test(m)).length;
      lines.push(`  SPF: ${mechanisms.length} mechanism(s), ${lookups} DNS lookup(s): ${mechanisms.slice(0, 8).join(" ")}`);
      if (lookups > 10) lines.push(`    ${lookups} lookups exceeds the SPF limit of 10, so senders will get a permerror`);
    }
  } else {
    lines.push(`  SPF: no v=spf1 record found (${status(spf)})`);
  }
  if (dmarcRecords.length) {
    lines.push(`  DMARC: p=${dmarcPolicy}, sp=${dmarcSubdomain}, pct=${pct} (${status(dmarc)})`);
  } else {
    lines.push(`  DMARC: no _dmarc record (${status(dmarc)}), so nothing asks receivers to act on SPF or DKIM failures`);
  }
  return lines.join("\n");
}

/** Check that the links in a campaign are reachable, and where they end up. */
export async function campaignLinkAudit(args: { links: string; limit?: number }): Promise<string> {
  const raw = String(args?.links ?? "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  if (!raw.length) throw new LoopsError("Paste the links from the campaign, separated by spaces or commas.");
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const urls = raw.slice(0, n);
  const lines = [`Link audit of ${raw.length} link(s) from a campaign, checking ${urls.length}`];
  let broken = 0;
  for (const url of urls) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      lines.push(`  ${url.slice(0, 90)} — not a URL`);
      broken += 1;
      continue;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      lines.push(`  ${parsed.href.slice(0, 90)} — unsupported scheme ${parsed.protocol}`);
      broken += 1;
      continue;
    }
    let status = 0;
    let finalUrl = parsed.href;
    let redirected = false;
    try {
      const res = await fetch(parsed.href, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "loops-mcp/1.0", Accept: "text/html,*/*" },
        signal: AbortSignal.timeout(20000),
      });
      status = res.status;
      finalUrl = res.url || parsed.href;
      redirected = finalUrl.replace(/\/$/, "") !== parsed.href.replace(/\/$/, "");
    } catch (e) {
      lines.push(`  ${parsed.href.slice(0, 90)} — request failed: ${(e as Error).message}`);
      broken += 1;
      continue;
    }
    if (status >= 400) broken += 1;
    const secure = finalUrl.startsWith("https:") ? "https" : "PLAIN HTTP";
    lines.push(`  ${status || "no status"} ${secure} ${redirected ? `-> ${finalUrl.slice(0, 90)}` : parsed.hostname}${status >= 400 ? "  (broken)" : ""}`);
  }
  if (raw.length > n) lines.push(`  ...and ${raw.length - n} more link(s) not checked.`);
  lines.push(`  ${broken} of ${urls.length} checked link(s) returned an error or were unreachable.`);
  return lines.join("\n");
}
