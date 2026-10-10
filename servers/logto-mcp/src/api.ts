/**
 * Logto Management API client. Needs LOGTO_URL (tenant, e.g.
 * https://abc123.logto.app or self-hosted) plus LOGTO_M2M_ID +
 * LOGTO_M2M_SECRET (machine-to-machine app with Management API access).
 * Uses client-credentials grant; token cached in memory.
 * Docs: https://docs.logto.io/integrate-logto/
 */
function base(): string {
  const url = (process.env.LOGTO_URL ?? "").replace(/\/+$/, "")
  if (!url) throw new LogtoError("Set LOGTO_URL first (your tenant URL).")
  return url
}

export class LogtoError extends Error {}

let cached: { token: string; exp: number } | null = null

async function appToken(): Promise<string> {
  const id = process.env.LOGTO_M2M_ID
  const secret = process.env.LOGTO_M2M_SECRET
  if (!id || !secret) {
    throw new LogtoError("Set LOGTO_M2M_ID and LOGTO_M2M_SECRET (machine-to-machine app).")
  }
  if (cached && cached.exp > Date.now() + 60000) return cached.token
  const body = new URLSearchParams({ grant_type: "client_credentials", resource: "https://default.logto.app/api", scope: "all" })
  const res = await fetch(`${base()}/oidc/token`, {
    method: "POST",
    headers: {
      "User-Agent": "logto-mcp/1.0",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new LogtoError(`Logto OAuth failed (${res.status}). Check tenant URL and M2M credentials.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.access_token) throw new LogtoError("Logto OAuth returned no token.")
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cached.token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { "User-Agent": "logto-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${await appToken()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) {
    cached = null
    throw new LogtoError("Logto refused (401/403). Check M2M credentials and API access.")
  }
  if (res.status === 404) throw new LogtoError("Not found.")
  if (!res.ok) throw new LogtoError(`Logto error ${res.status}`)
  return (await res.json()) as T
}

export interface LogtoUser {
  id: string
  username?: string
  email?: string
  created?: string
}

export async function listUsers(limit = 10): Promise<LogtoUser[]> {
  const rows = await getJson<Raw[]>(`/api/users?page=1&page_size=${Math.min(Math.max(limit, 1), 100)}`)
  return (Array.isArray(rows) ? rows : []).slice(0, limit).map((u) => ({
    id: String(u.id),
    username: u.username,
    email: u.primaryEmail,
    created: u.createdAt ? String(u.createdAt).slice(0, 10) : undefined,
  }))
}

export interface LogtoApp {
  id: string
  name?: string
  type?: string
}

export async function listApplications(limit = 10): Promise<LogtoApp[]> {
  const rows = await getJson<Raw[]>(`/api/applications?page=1&page_size=${Math.min(Math.max(limit, 1), 100)}`)
  return (Array.isArray(rows) ? rows : []).slice(0, limit).map((a) => ({
    id: String(a.id),
    name: a.name,
    type: a.type,
  }))
}

// ---- muxB tools:

import { createHash } from "node:crypto"

const LOGTO_DEFAULT = "https://auth.logto.io"

function logtoTenant(url: string | undefined): string {
  const raw = String(url ?? process.env.LOGTO_URL ?? LOGTO_DEFAULT).trim()
  const base = raw.replace(/\/+$/, "")
  if (!/^https?:\/\//i.test(base)) {
    throw new LogtoError(`"${raw}" is not a tenant URL. Use the base URL of your Logto tenant, e.g. https://abc123.logto.app or your self-hosted LOGTO_URL.`)
  }
  return base
}

async function logtoPublicJson(url: string, path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${url}${path}`, {
    headers: { "User-Agent": "logto-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new LogtoError(`${url}${path} returned 404. Check the tenant URL, it should be the base URL with no /oidc on the end.`)
  if (!res.ok) throw new LogtoError(`Logto returned ${res.status} for ${path}.`)
  const data = (await res.json()) as unknown
  if (!data || typeof data !== "object") throw new LogtoError(`${path} did not return a JSON object.`)
  return data as Record<string, unknown>
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : [])

export async function tenantDiscovery(args: { url?: string }): Promise<string> {
  const base = logtoTenant(args.url)
  const d = await logtoPublicJson(base, "/oidc/.well-known/openid-configuration")
  const grants = asList(d.grant_types_supported)
  const scopes = asList(d.scopes_supported)
  const claims = asList(d.claims_supported)
  const algs = asList(d.id_token_signing_alg_values_supported)
  const authMethods = asList(d.token_endpoint_auth_methods_supported)
  const pkce = asList(d.code_challenge_methods_supported)
  return [
    `OIDC discovery for ${String(d.issuer ?? base + "/oidc")}`,
    "",
    "Endpoints:",
    `  authorize:  ${d.authorization_endpoint ?? "not reported"}`,
    `  token:      ${d.token_endpoint ?? "not reported"}`,
    `  userinfo:   ${d.userinfo_endpoint ?? "not reported"}`,
    `  jwks:       ${d.jwks_uri ?? "not reported"}`,
    `  end session: ${d.end_session_endpoint ?? "not reported"}`,
    `  device:     ${d.device_authorization_endpoint ?? "not reported"}`,
    `  PAR:        ${d.pushed_authorization_request_endpoint ?? "not reported"}`,
    `  introspect: ${d.introspection_endpoint ?? "not reported"}`,
    `  revoke:     ${d.revocation_endpoint ?? "not reported"}`,
    "",
    `Grants: ${grants.join(", ") || "not reported"}`,
    `PKCE challenge methods: ${pkce.join(", ") || "not reported"}`,
    `ID token signing algorithms: ${algs.join(", ") || "not reported"}`,
    `Token endpoint auth methods: ${authMethods.join(", ") || "not reported"}`,
    `Response types: ${asList(d.response_types_supported).join(", ") || "not reported"}`,
    `Response modes: ${asList(d.response_modes_supported).join(", ") || "not reported"}`,
    `Subject types: ${asList(d.subject_types_supported).join(", ") || "not reported"}`,
    `Back-channel logout: ${d.backchannel_logout_supported === true ? "supported" : d.backchannel_logout_supported === false ? "not supported" : "not reported"}`,
    "",
    `Scopes (${scopes.length}): ${scopes.join(", ") || "not reported"}`,
    `Claims Logto will put in an ID token (${claims.length}): ${claims.slice(0, 24).join(", ")}${claims.length > 24 ? ", ..." : ""}`,
    "",
    "A client that wants refresh tokens must ask for the offline_access scope, and an access token for",
    "Management API calls needs the all scope, which a machine-to-machine app gets from the client-credentials grant.",
  ].join("\n")
}

function logtoThumbprint(key: Record<string, unknown>): string {
  const kty = String(key.kty ?? "")
  const members: Record<string, unknown> = {}
  if (kty === "EC") {
    members.crv = key.crv
    members.kty = key.kty
    members.x = key.x
    members.y = key.y
  } else if (kty === "RSA") {
    members.e = key.e
    members.kty = key.kty
    members.n = key.n
  } else if (kty === "oct") {
    members.k = key.k
    members.kty = key.kty
  } else {
    return "thumbprint not computed: unsupported key type"
  }
  const canonical = JSON.stringify(Object.keys(members).sort().reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = members[k]
    return acc
  }, {}))
  return createHash("sha256").update(canonical).digest("base64url")
}

export async function signingKeys(args: { url?: string }): Promise<string> {
  const base = logtoTenant(args.url)
  const jwks = await logtoPublicJson(base, "/oidc/jwks")
  const keys = Array.isArray(jwks.keys) ? (jwks.keys as Array<Record<string, unknown>>) : []
  if (keys.length === 0) return `${base} publishes no signing keys.`
  const out = [
    `${keys.length} signing key(s) published by ${base}/oidc/jwks.`,
    "A JWT's header kid selects one of these, so a token whose kid is not listed was signed with a key that has been rotated away or forged.",
    "",
  ]
  for (const k of keys) {
    out.push(`kid ${String(k.kid ?? "not reported")}`)
    out.push(`  type ${String(k.kty ?? "?")} / alg ${String(k.alg ?? "?")}${k.crv ? ` / curve ${String(k.crv)}` : ""} / use ${String(k.use ?? "not reported")}`)
    out.push(`  RFC 7638 thumbprint: ${logtoThumbprint(k)}`)
    if (k.x) out.push(`  x: ${String(k.x).slice(0, 24)}... (${String(k.x).length} chars)`)
    if (k.y) out.push(`  y: ${String(k.y).slice(0, 24)}... (${String(k.y).length} chars)`)
    if (k.n) out.push(`  modulus n: ${String(k.n).slice(0, 24)}... (${String(k.n).length} chars)`)
    if (k.e) out.push(`  exponent e: ${String(k.e)}`)
  }
  return out.join("\n")
}

function logtoDecodeSegment(segment: string, what: string): Record<string, unknown> {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/")
  let json: string
  try {
    json = Buffer.from(padded, "base64").toString("utf8")
  } catch {
    throw new LogtoError(`The ${what} is not valid base64url.`)
  }
  try {
    const parsed = JSON.parse(json) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new LogtoError(`The ${what} decoded but is not a JSON object.`)
    }
    return parsed as Record<string, unknown>
  } catch (e) {
    if (e instanceof LogtoError) throw e
    throw new LogtoError(`The ${what} is not JSON, so this is not a JWT.`)
  }
}

const iso = (seconds: number): string => new Date(seconds * 1000).toISOString().replace(".000Z", "Z")

export interface LogtoTokenArgs {
  token: string
  expected_issuer?: string
}

export async function tokenInspect(args: LogtoTokenArgs): Promise<string> {
  const token = String(args.token ?? "").trim()
  if (!token) return "Paste a token to look at, as one string. The signature is never checked here, only read."
  const parts = token.split(".")
  if (parts.length !== 3) {
    return `That has ${parts.length} dot-separated part(s). A JWT has three: header, payload and signature.`
  }
  const header = logtoDecodeSegment(parts[0], "header")
  const payload = logtoDecodeSegment(parts[1], "payload")
  const warnings: string[] = []
  const now = Math.floor(Date.now() / 1000)
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
  const out = [
    "Header:",
    `  alg ${String(header.alg ?? "not reported")}${header.typ ? `, typ ${String(header.typ)}` : ""}${header.kid ? `, kid ${String(header.kid)}` : ", no kid"}`,
    `  Signature present, ${parts[2].length} base64url characters, not verified here.`,
    "",
    "Claims:",
    `  iss ${String(payload.iss ?? "not reported")}`,
    `  sub ${String(payload.sub ?? "not reported")}`,
    `  aud ${asList(payload.aud).join(", ") || "not reported"}`,
  ]
  const exp = num(payload.exp)
  const nbf = num(payload.nbf)
  const iat = num(payload.iat)
  if (exp !== null) {
    const left = exp - now
    out.push(`  exp ${iso(exp)} (${left > 0 ? `${left} s left` : `expired ${-left} s ago`})`)
  } else {
    out.push("  exp not reported")
    warnings.push("no exp claim, so nothing limits how long this token can be replayed")
  }
  if (iat !== null) out.push(`  iat ${iso(iat)} (${((now - iat) / 60).toFixed(1)} min old)`)
  else warnings.push("no iat claim")
  if (nbf !== null) {
    out.push(`  nbf ${iso(nbf)} (${nbf > now ? `not valid for another ${nbf - now} s` : "valid"})`)
    if (nbf > now) warnings.push("the token is not valid yet")
  }
  if (exp !== null && iat !== null) {
    const life = exp - iat
    out.push(`  Lifetime ${life} s (${(life / 3600).toFixed(1)} h)`)
    if (life > 86400) warnings.push(`a ${(life / 3600).toFixed(0)} h lifetime is long for an ID token; Logto access tokens are usually far shorter`)
  }
  if (exp !== null && exp <= now) warnings.push("the token is expired")
  const scopes = [...asList(payload.scp), ...asList(payload.scope)].filter(Boolean)
  if (scopes.length > 0) {
    const logtoScopes = scopes.filter((s) => s.startsWith("urn:logto:") || s === "offline_access" || s === "custom_data" || s === "identities" || s === "roles")
    out.push(`  scopes: ${scopes.join(", ")}`)
    if (logtoScopes.length > 0) out.push(`    Logto-specific: ${logtoScopes.join(", ")}`)
  } else {
    out.push("  no scope or scp claim")
  }
  const interesting = ["sid", "roles", "role_names", "organization_ids", "identities", "custom_data", "username", "email", "email_verified", "phone_number_verified", "name", "picture"]
  const found = interesting.filter((k) => payload[k] !== undefined)
  if (found.length > 0) {
    out.push("", "Other claims: " + found.map((k) => `${k} ${JSON.stringify(payload[k])?.slice(0, 120)}`).join("\n              "))
  }
  if (String(header.alg ?? "").toLowerCase() === "none") warnings.push("alg is none, so this token is unsigned and must never be trusted")
  if (!header.alg) warnings.push("the header has no alg, so the verifier has nothing to check the signature with")
  if (!header.kid) warnings.push("the header has no kid, so you cannot tell which published key signed it")
  if (!payload.iss) warnings.push("no iss claim, so you cannot tell which tenant issued it")
  if (!payload.sub) warnings.push("no sub claim, so there is no user or client to bind the token to")
  if (!asList(payload.aud).length) warnings.push("no aud claim, so the token is not scoped to your API and any resource may accept it")
  if (args.expected_issuer && payload.iss && args.expected_issuer.trim().replace(/\/+$/, "") !== String(payload.iss).replace(/\/+$/, "")) {
    warnings.push(`iss does not match the tenant you expected (${args.expected_issuer.trim()})`)
  }
  if (out.join("").includes("not reported") && warnings.length === 0) warnings.push("nothing to flag")
  return [
    ...out,
    "",
    warnings.length ? `Flagged (${warnings.length}):` : "Flagged: none.",
    ...warnings.map((w) => `  - ${w}`),
  ].join("\n")
}
