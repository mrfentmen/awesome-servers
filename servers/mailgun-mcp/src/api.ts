/**
 * Mailgun API client. Needs MAILGUN_API_KEY (free at https://www.mailgun.com/).
 * US region default; set MAILGUN_REGION=eu for EU accounts.
 * Docs: https://documentation.mailgun.com/
 */
const REGIONS: Record<string, string> = { us: "https://api.mailgun.net", eu: "https://api.eu.mailgun.net" }

export class MailgunError extends Error {}

function base(): string {
  const r = (process.env.MAILGUN_REGION ?? "us").trim().toLowerCase()
  if (!REGIONS[r]) throw new MailgunError(`Region must be us or eu, got "${process.env.MAILGUN_REGION}".`)
  return REGIONS[r]
}

function auth(): string {
  const key = process.env.MAILGUN_API_KEY
  if (!key) throw new MailgunError("Set MAILGUN_API_KEY first (free at mailgun.com).")
  return `Basic ${Buffer.from(`api:${key}`).toString("base64")}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { "User-Agent": "mailgun-mcp/1.0", Accept: "application/json", Authorization: auth() },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new MailgunError("Mailgun rejected the key (401/403). Check MAILGUN_API_KEY and MAILGUN_REGION.")
  if (res.status === 404) throw new MailgunError("Not found.")
  if (!res.ok) throw new MailgunError(`Mailgun error ${res.status}`)
  return (await res.json()) as T
}

export interface Domain {
  name: string
  state?: string
  created?: string
}

export async function listDomains(limit = 10): Promise<Domain[]> {
  const data = await getJson<Raw>(`/v3/domains?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.items) ? data.items : []
  return rows.slice(0, limit).map((d) => ({
    name: String(d.name),
    state: d.state,
    created: d.created_at ? String(d.created_at).slice(0, 10) : undefined,
  }))
}

export interface DomainStats {
  sent?: number
  delivered?: number
  opened?: number
  failed?: number
}

export async function domainStats(domain: string): Promise<DomainStats> {
  if (!domain.includes(".")) throw new MailgunError(`Not a domain: "${domain}".`)
  const data = await getJson<Raw>(`/v3/${encodeURIComponent(domain.trim())}/stats/total?event=sent&event=delivered&event=opened&event=failed`)
  const stats: Raw = data.stats ?? {}
  const pick = (ev: string): number | undefined => {
    const row = (stats[ev] ?? {}) as Raw
    const tot = (row.total ?? {}) as Raw
    return typeof tot.count === "number" ? tot.count : undefined
  }
  return { sent: pick("sent"), delivered: pick("delivered"), opened: pick("opened"), failed: pick("failed") }
}

export async function listBounces(domain: string, limit = 10): Promise<string[]> {
  if (!domain.includes(".")) throw new MailgunError(`Not a domain: "${domain}".`)
  const data = await getJson<Raw>(`/v3/${encodeURIComponent(domain.trim())}/bounces?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.items) ? data.items : []
  return rows.slice(0, limit).map((b) => `${String(b.address ?? "?")} — ${String(b.code ?? "?")} ${String(b.error ?? "").slice(0, 100)}`)
}

export function formatStats(domain: string, s: DomainStats): string {
  const lines = [
    `Stats for ${domain}`,
    s.sent !== undefined ? `Sent: ${s.sent.toLocaleString()}` : "",
    s.delivered !== undefined ? `Delivered: ${s.delivered.toLocaleString()}` : "",
    s.opened !== undefined ? `Opened: ${s.opened.toLocaleString()}` : "",
    s.failed !== undefined ? `Failed: ${s.failed.toLocaleString()}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxF tools:
/**
 * Two things a sending domain can be checked on without a Mailgun account:
 * whether any DKIM selector is actually published, and whether Mailgun itself
 * is having a bad day.
 */
const MG_DOH = "https://dns.google/resolve";
const MG_STATUS = "https://status.mailgun.com/api/v2";
const MG_UA = { "User-Agent": "mailgun-mcp/1.0" };
const MG_SELECTORS = [
  "default", "selector1", "selector2", "k1", "k2", "k3", "google", "mailjet", "s1", "s2",
  "mail", "smtp", "dkim", "mandrill", "sendgrid", "zoho", "everlytickey1", "dk",
];

interface MgDns {
  Status?: number;
  Answer?: Array<{ type?: number; data?: string }>;
}

async function mgTxt(name: string): Promise<MgDns> {
  let res: Response;
  try {
    res = await fetch(`${MG_DOH}?name=${encodeURIComponent(name)}&type=TXT`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new MailgunError(`DNS lookup failed for ${name}: ${(e as Error).message}`);
  }
  if (!res.ok) throw new MailgunError(`DNS-over-HTTPS returned HTTP ${res.status} for ${name}.`);
  const body = (await res.text()).trim();
  if (!body) throw new MailgunError(`DNS-over-HTTPS returned an empty body for ${name}.`);
  return JSON.parse(body) as MgDns;
}

const mgHost = (input: string): string => {
  const host = String(input ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
    throw new MailgunError(`"${input}" is not a domain name.`);
  }
  return host;
};

/** Find out which DKIM selector, if any, a domain actually publishes a key under. */
export async function dkimSelectorScan(args: { domain: string; selectors?: string }): Promise<string> {
  const host = mgHost(args?.domain);
  const extra = String(args?.selectors ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => /^[a-z0-9._-]{1,63}$/i.test(s));
  const selectors = [...new Set([...MG_SELECTORS, ...extra])].slice(0, 40);
  if (selectors.length < MG_SELECTORS.length) throw new MailgunError("The selector list could not be read.");

  const lines = [`DKIM selector scan for ${host}: probing ${selectors.length} selector name(s) over DNS-over-HTTPS`];
  const found: string[] = [];
  for (const selector of selectors) {
    const reply = await mgTxt(`${selector}._domainkey.${host}`).catch((e) => ({ Status: -1, error: (e as Error).message }) as MgDns & { error: string });
    if ((reply as { error?: string }).error) {
      lines.push(`  ${selector}: lookup failed (${(reply as { error?: string }).error})`);
      continue;
    }
    if (reply.Status === 3) continue;
    const records = (reply.Answer ?? []).map((a) => String(a.data ?? "").replace(/^"|"$/g, "")).filter((t) => /^v=DKIM1/i.test(t));
    if (!records.length) continue;
    for (const record of records) {
      const keyType = /(k=\s*([a-z0-9-]+))/i.exec(record)?.[2] ?? "not reported";
      const publicKey = /p=([A-Za-z0-9+/=]+)/.exec(record)?.[1] ?? "";
      const bits = publicKey ? Math.round(publicKey.length * 6) : 0;
      const flags = /t=([a-z:]+)/i.exec(record)?.[1] ?? "none";
      const test = /p=TEST/i.test(record) ? "  (p=TEST, the domain is not signing with this key)" : "";
      found.push(selector);
      lines.push(
        `  ${selector}: found, key type ${keyType}, about ${bits} bits of public key, flags t=${flags}${test}`,
      );
    }
  }
  if (!found.length) {
    lines.push(`  none of the ${selectors.length} selector name(s) returned a v=DKIM1 record.`);
    lines.push("  That is not proof the domain is unsigned: a provider can publish a selector name nobody guesses. Check the exact selector the sending service was configured with.");
  } else {
    lines.push(`  ${found.length} selector(s) publish a key: ${found.join(", ")}`);
  }
  return lines.join("\n");
}

/** Mailgun's own status page, component by component, with any open incident. */
export async function mailgunStatusAudit(_args: { instance?: string }): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${MG_STATUS}/summary.json`, { headers: { ...MG_UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new MailgunError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) throw new MailgunError(`The Mailgun status page returned HTTP ${res.status}.`);
  const body = (await res.text()).trim();
  if (!body) throw new MailgunError("The Mailgun status page returned an empty body.");
  const data = JSON.parse(body) as {
    page?: { name?: string; url?: string; updated_at?: string; time_zone?: string };
    status?: { indicator?: string; description?: string };
    components?: Array<{ name?: string; status?: string; updated_at?: string }>;
    incidents?: Array<{ name?: string; status?: string; impact?: string; created_at?: string; incident_updates?: Array<{ body?: string; created_at?: string; status?: string }> }>;
    scheduled_maintenances?: Array<{ name?: string; scheduled_for?: string; status?: string }>;
  };

  const components = data.components ?? [];
  const incidents = data.incidents ?? [];
  const down = components.filter((c) => c.status && c.status !== "operational");
  const lines = [
    `Mailgun status: ${data.status?.description ?? "not reported"} (indicator ${data.status?.indicator ?? "not reported"})`,
    `  status page: ${data.page?.url ?? "not reported"}, last updated ${String(data.page?.updated_at ?? "not reported").slice(0, 19).replace("T", " ")} ${data.page?.time_zone ?? ""}`.trim(),
    `  components: ${components.length} listed, ${down.length} not fully operational`,
  ];
  for (const c of down) lines.push(`    ${c.status}: ${c.name}`);
  if (!down.length) for (const c of components.slice(0, 14)) lines.push(`    ${c.status}: ${c.name}`);
  if (components.length > 14 && !down.length) lines.push(`    ...and ${components.length - 14} more component(s), all operational.`);
  lines.push(`  open incident(s): ${incidents.length}`);
  for (const incident of incidents.slice(0, 5)) {
    lines.push(`    ${incident.name} (${incident.status}, impact ${incident.impact ?? "not reported"}) since ${String(incident.created_at ?? "not reported").slice(0, 10)}`);
    const update = incident.incident_updates?.[0];
    if (update?.body) lines.push(`      latest: ${update.body.replace(/\s+/g, " ").trim().slice(0, 180)}`);
  }
  const maintenance = data.scheduled_maintenances ?? [];
  if (maintenance.length) {
    lines.push(`  scheduled maintenance: ${maintenance.length} planned`);
    for (const m of maintenance.slice(0, 3)) lines.push(`    ${m.name} (${m.status}) for ${String(m.scheduled_for ?? "not reported").slice(0, 16).replace("T", " ")}`);
  }
  return lines.join("\n");
}
