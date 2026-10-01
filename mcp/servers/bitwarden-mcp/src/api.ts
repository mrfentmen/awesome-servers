export class BitwardenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BitwardenError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new BitwardenError(`Set the ${name} environment variable.`)
  return v
}

let cachedToken = ""
let tokenExpiresAt = 0
async function authHeaders(): Promise<Record<string, string>> {
  const now = Date.now()
  if (!cachedToken || now >= tokenExpiresAt) {
    const identity = process.env.BITWARDEN_IDENTITY_URL ?? "https://identity.bitwarden.com"
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "api",
      client_id: envStrict("BITWARDEN_CLIENT_ID"),
      client_secret: envStrict("BITWARDEN_CLIENT_SECRET"),
    })
    const res = await fetch(`${identity}/connect/token`, {
      signal: AbortSignal.timeout(30000),
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    if (!res.ok) throw new BitwardenError(`Bitwarden login failed: HTTP ${res.status}`)
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) throw new BitwardenError("Bitwarden login returned no access token")
    cachedToken = data.access_token
    tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 60000
  }
  return { Authorization: "Bearer " + cachedToken }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new BitwardenError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listMembers(): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/members`;
  const data = await req(url);
  return pretty(data);
}

export async function listCollections(): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/collections`;
  const data = await req(url);
  return pretty(data);
}

export async function listGroups(): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/groups`;
  const data = await req(url);
  return pretty(data);
}

export async function getEvents(start?: string, end?: string): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  let url = `${api}/public/events`;
  const qs = new URLSearchParams();
  if (start !== undefined) qs.append("start", String(start));
  if (end !== undefined) qs.append("end", String(end));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxD tools:

export interface PoliciesArgs {
  continuation_token?: string
}

/**
 * GET /public/policies
 * ListResponseModel: { object: "list", data: PolicyResponseModel[], continuationToken }
 * PolicyResponseModel: { object, id, type, enabled, data, revision_date }
 */
export async function listPolicies(args: PoliciesArgs): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  const qs = new URLSearchParams();
  if (args.continuation_token) qs.set("continuationToken", args.continuation_token);
  const suffix = qs.toString();
  const data = (await req(`${api}/public/policies${suffix ? `?${suffix}` : ""}`)) as { data?: Record<string, unknown>[]; continuationToken?: string };
  const rows = Array.isArray(data?.data) ? data.data : [];
  if (!rows.length) return "Bitwarden returned no organization policies for this API credential.";
  const lines = rows.map((p, i) => {
    const bits = [`${i + 1}. type ${p.type ?? "not reported"} [${p.id ?? "?"}]`]
    bits.push(` | ${p.enabled === true ? "ENABLED and enforced" : p.enabled === false ? "not enforced" : "enabled not reported"}`)
    if (p.revision_date) bits.push(` | revised ${String(p.revision_date).slice(0, 10)}`)
    const settings = p.data && typeof p.data === "object" ? JSON.stringify(p.data) : ""
    if (settings) bits.push(` | settings ${settings.length > 300 ? `${settings.slice(0, 300)}…` : settings}`)
    return bits.join("")
  })
  return [
    `Bitwarden organization policies (${rows.length} shown). Bitwarden reports policy types as numeric codes.`,
    ...lines,
    data.continuationToken ? `More pages available: continuationToken ${data.continuationToken}` : "No further page: this is the last page.",
  ].join("\n")
}

export interface CollectionArgs {
  id: string
}

/**
 * GET /public/collections/{id}
 * CollectionResponseModel: { object, id, externalId, name, groups: [{ id, readOnly, hidePasswords, manage }] }
 */
export async function collectionAccess(args: CollectionArgs): Promise<string> {
  const id = (args.id ?? "").trim();
  if (!id) throw new BitwardenError("Collection id is empty.");
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  const c = (await req(`${api}/public/collections/${encodeURIComponent(id)}`)) as Record<string, unknown>;
  if (!c || typeof c !== "object" || c.id === undefined) throw new BitwardenError(`Bitwarden returned no collection for id ${id}.`);
  const groups = Array.isArray(c.groups) ? (c.groups as Record<string, unknown>[]) : [];
  const lines = [
    `Collection "${c.name ?? "(unnamed)"}" [${c.id}]`,
    c.externalId ? `External id: ${c.externalId}` : "External id: not reported",
    "",
  ];
  if (!groups.length) {
    lines.push("No group grants are reported for this collection.")
  } else {
    lines.push(`Group grants (${groups.length}):`)
    for (const g of groups) {
      const perms = [
        g.readOnly === true ? "read-only" : g.readOnly === false ? "read/write" : "readOnly not reported",
        g.hidePasswords === true ? "passwords hidden" : g.hidePasswords === false ? "passwords visible" : "hidePasswords not reported",
        g.manage === true ? "can manage" : g.manage === false ? "cannot manage" : "manage not reported",
      ]
      lines.push(`  ${g.id ?? "?"} — ${perms.join(", ")}`)
    }
  }
  return lines.join("\n")
}

export interface TwoFactorArgs {
  continuation_token?: string
}

/**
 * GET /public/members, rolled up.
 * MemberResponseModel: { object, id, userId, name, email, twoFactorEnabled, status,
 *                        collections, type, accessAll, externalId }
 * status and type are numeric codes; they are reported as sent rather than labelled.
 */
export async function twoFactorCoverage(args: TwoFactorArgs): Promise<string> {
  const api = process.env.BITWARDEN_API_URL ?? "https://api.bitwarden.com";
  const qs = new URLSearchParams();
  if (args.continuation_token) qs.set("continuationToken", args.continuation_token);
  const suffix = qs.toString();
  const data = (await req(`${api}/public/members${suffix ? `?${suffix}` : ""}`)) as {
    data?: Record<string, unknown>[]
    continuationToken?: string
  };
  const rows = Array.isArray(data?.data) ? data.data : [];
  if (!rows.length) return "Bitwarden returned no organization members for this API credential.";
  const enabled = rows.filter((m) => m.twoFactorEnabled === true);
  const reported = rows.filter((m) => m.twoFactorEnabled === true || m.twoFactorEnabled === false);
  const pct = reported.length ? (enabled.length / reported.length) * 100 : null
  const byType = new Map<string, { total: number; with2fa: number }>();
  for (const m of reported) {
    const key = String(m.type ?? "not reported")
    const bucket = byType.get(key) ?? { total: 0, with2fa: 0 }
    bucket.total += 1
    if (m.twoFactorEnabled === true) bucket.with2fa += 1
    byType.set(key, bucket)
  }
  const admins = reported.filter((m) => m.accessAll === true)
  const lines = [
    `Two-step login coverage across ${rows.length} member(s) on this page`,
    `Members reporting twoFactorEnabled: ${reported.length}${reported.length < rows.length ? ` (${rows.length - reported.length} did not report the field)` : ""}`,
    `With two-step login: ${enabled.length}${pct === null ? "" : ` (${pct.toFixed(1)}%)`}`,
    "",
    "By member type code (Bitwarden reports roles numerically):",
    ...[...byType.entries()].sort((a, b) => b[1].total - a[1].total).map(([type, b]) => `  type ${type}: ${b.with2fa}/${b.total} with two-step login`),
    "",
    `Members with access to all collections: ${admins.length}, of which ${admins.filter((m) => m.twoFactorEnabled === true).length} have two-step login.`,
  ]
  const without = reported.filter((m) => m.twoFactorEnabled === false)
  if (without.length) {
    lines.push("", `Without two-step login (${without.length}):`)
    for (const m of without.slice(0, 25)) lines.push(`  ${m.email ?? "(email not reported)"} | type ${m.type ?? "?"} | accessAll ${m.accessAll === true ? "yes" : "no"}`)
    if (without.length > 25) lines.push(`  ...and ${without.length - 25} more.`)
  } else if (reported.length) {
    lines.push("", "Every member on this page reports two-step login enabled.")
  }
  if (data.continuationToken) lines.push(`More pages available: continuationToken ${data.continuationToken}`)
  return lines.join("\n")
}
