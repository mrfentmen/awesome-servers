export class InfisicalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InfisicalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new InfisicalError(`Set the ${name} environment variable.`)
  return v
}

let cachedToken = ""
let tokenExpiresAt = 0
async function authHeaders(): Promise<Record<string, string>> {
  const now = Date.now()
  if (!cachedToken || now >= tokenExpiresAt) {
    const site = process.env.INFISICAL_SITE_URL ?? "https://app.infisical.com"
    const res = await fetch(`${site}/api/v1/auth/universal-auth/login`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: envStrict("INFISICAL_CLIENT_ID"), clientSecret: envStrict("INFISICAL_CLIENT_SECRET") }),
    })
    if (!res.ok) throw new InfisicalError(`Infisical login failed: HTTP ${res.status}`)
    const data = (await res.json()) as { accessToken?: string; expiresIn?: number }
    if (!data.accessToken) throw new InfisicalError("Infisical login returned no access token")
    cachedToken = data.accessToken
    tokenExpiresAt = now + (data.expiresIn ?? 7200) * 1000 - 60000
  }
  return { Authorization: "Bearer " + cachedToken }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new InfisicalError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listSecrets(projectId: string, environment?: string, secretPath?: string): Promise<string> {
  const site = (process.env.INFISICAL_SITE_URL ?? "https://app.infisical.com").replace(/\/$/, "");
  let url = `${site}/api/v3/secrets/raw`;
  const qs = new URLSearchParams();
  qs.append("workspaceId", String(projectId));
  if (environment !== undefined) qs.append("environment", String(environment));
  if (secretPath !== undefined) qs.append("secretPath", String(secretPath));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getSecret(projectId: string, key: string, environment?: string, secretPath?: string): Promise<string> {
  const site = (process.env.INFISICAL_SITE_URL ?? "https://app.infisical.com").replace(/\/$/, "");
  let url = `${site}/api/v3/secrets/raw/${encodeURIComponent(String(key))}`;
  const qs = new URLSearchParams();
  qs.append("workspaceId", String(projectId));
  if (environment !== undefined) qs.append("environment", String(environment));
  if (secretPath !== undefined) qs.append("secretPath", String(secretPath));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function createSecret(projectId: string, key: string, value: string, environment?: string, secretPath?: string): Promise<string> {
  const site = (process.env.INFISICAL_SITE_URL ?? "https://app.infisical.com").replace(/\/$/, "");
  let url = `${site}/api/v3/secrets/raw/${encodeURIComponent(String(key))}`;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: projectId, environment, secretPath, secretKey: key, secretValue: value }) });
  return pretty(data);
}

export async function updateSecret(projectId: string, key: string, value: string, environment?: string, secretPath?: string): Promise<string> {
  const site = (process.env.INFISICAL_SITE_URL ?? "https://app.infisical.com").replace(/\/$/, "");
  let url = `${site}/api/v3/secrets/raw/${encodeURIComponent(String(key))}`;
  const data = await req(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: projectId, environment, secretPath, secretKey: key, secretValue: value }) });
  return pretty(data);
}

export async function deleteSecret(projectId: string, key: string, environment?: string, secretPath?: string): Promise<string> {
  const site = (process.env.INFISICAL_SITE_URL ?? "https://app.infisical.com").replace(/\/$/, "");
  let url = `${site}/api/v3/secrets/raw/${encodeURIComponent(String(key))}`;
  const qs = new URLSearchParams();
  qs.append("workspaceId", String(projectId));
  if (environment !== undefined) qs.append("environment", String(environment));
  if (secretPath !== undefined) qs.append("secretPath", String(secretPath));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { method: "DELETE" });
  return pretty(data);
}

// ---- muxB tools:

const INF_CHARSET_EXTRA = 100
const INF_PLACEHOLDER = new Set([
  "changeme", "change_me", "change-me", "password", "passwd", "secret", "token",
  "example", "examplekey", "test", "testing", "todo", "fixme", "xxx", "yyy",
  "yourkeyhere", "your_key_here", "your-password", "your_password", "placeholder",
  "dummy", "sample", "replace", "replaceme", "undefined", "null", "none", "empty",
  "admin", "root", "default", "insert", "value", "secretvalue", "password123",
])

const INF_RISKY = [
  /password/i, /passwd/i, /pwd/i, /secret/i, /token/i, /private[_.-]?key/i,
  /^key$/i, /api[_.-]?key/i, /credential/i, /cred[s]?$/i, /auth/i, /private/i,
  /dsn/i, /connection[_.-]?string/i, /(^|_)pass($|_)/i,
]

const INF_SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm",
  "abcdefghijklmnopqrstuvwxyz".toUpperCase(),
]

function infPool(value: string): number {
  let pool = 0
  if (/[a-z]/.test(value)) pool += 26
  if (/[A-Z]/.test(value)) pool += 32
  if (/[0-9]/.test(value)) pool += 10
  if (value.includes(" ")) pool += 1
  if (/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value)) pool += 32
  if (/[^\x20-\x7e]/.test(value)) pool += INF_CHARSET_EXTRA
  return pool
}

function infEntropyPerChar(value: string): number {
  const counts = new Map<string, number>()
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  let h = 0
  for (const n of counts.values()) {
    const p = n / value.length
    h -= p * Math.log2(p)
  }
  return h
}

function infMaxRun(value: string): number {
  let best = 0
  for (const seq of INF_SEQUENCES) {
    for (let len = seq.length; len > best; len--) {
      for (let i = 0; i + len <= seq.length; i++) {
        if (value.includes(seq.slice(i, i + len).toLowerCase())) best = len
      }
    }
  }
  return best
}

function infStrength(bits: number, value: string): string {
  const grade =
    bits < 28 ? "very weak" : bits < 40 ? "weak" : bits < 60 ? "fair" : bits < 80 ? "strong" : "very strong"
  const predictable =
    INF_PLACEHOLDER.has(value.toLowerCase()) ||
    (value.length > 3 && infRepeatShare(value) > 0.5) ||
    infMaxRun(value) >= 6
  if (!predictable) return grade
  return `${grade} on paper, but predictable content - treat as ${bits < 28 ? "very weak" : "weak"}`
}

function infRepeatShare(value: string): number {
  if (!value.length) return 0
  const counts = new Map<string, number>()
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  return 1 - counts.size / value.length
}

function infFlags(key: string, value: string, values: Map<string, string[]>): string[] {
  const notes: string[] = []
  if (value.length === 0) notes.push("empty value")
  const lower = value.toLowerCase()
  if (INF_PLACEHOLDER.has(lower)) notes.push(`value is the placeholder "${value}"`)
  if (value === key) notes.push("value is identical to its key")
  if (value.toLowerCase() === key.toLowerCase()) notes.push("value is the key name in a different case")
  if (value.length > 0 && value.toLowerCase().includes(key.toLowerCase())) notes.push("value contains the key name")
  if (infRepeatShare(value) > 0.5 && value.length > 3) notes.push("value repeats the same few characters")
  const run = infMaxRun(value)
  if (run >= 4) notes.push(`value contains a ${run}-character run of a keyboard/alphabet sequence`)
  const shared = values.get(value)
  if (shared && shared.length > 1) notes.push(`same value is used by ${shared.join(", ")}`)
  if (/^[A-Za-z0-9+/]{24,}={0,2}$/.test(value)) notes.push("value looks like base64-encoded material, not a generated secret")
  if (/^[0-9a-f]{32,}$/i.test(value)) notes.push("value looks like a hex-encoded key or digest")
  if (/^[A-Za-z0-9_-]+$/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && !/[-_]/.test(value) && value.length < 20) {
    notes.push("value mixes cases and digits but has no separator; likely a word with a digit glued on")
  }
  return notes
}

function infParsePairs(text: string): Array<{ key: string; value: string }> {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.entries(parsed as Record<string, unknown>)
          .map(([k, v]) => ({ key: k, value: typeof v === "string" ? v : JSON.stringify(v ?? null) }))
          .slice(0, 100)
      }
    } catch {
      throw new InfisicalError("That looks like JSON but does not parse. Send a JSON object of key/value pairs.")
    }
  }
  const out: Array<{ key: string; value: string }> = []
  for (const line of trimmed.split(/\r?\n/).slice(0, 100)) {
    const row = line.trim()
    if (!row || row.startsWith("#")) continue
    const eq = row.indexOf("=")
    if (eq <= 0) continue
    out.push({ key: row.slice(0, eq).trim(), value: row.slice(eq + 1).trim() })
  }
  return out
}

function infValueIndex(pairs: Array<{ key: string; value: string }>): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const p of pairs) {
    if (!p.value) continue
    const list = index.get(p.value) ?? []
    list.push(p.key)
    index.set(p.value, list)
  }
  return index
}

export interface InfisicalEntropyArgs {
  secrets: string
  label?: string
}

export interface InfisicalNamesArgs {
  names: string
  style?: string
}

function infStyleOf(name: string): string {
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(name)) return "SHOUTING_SNAKE_CASE"
  if (/^[a-z][a-z0-9]*([A-Z][a-z0-9]*)+$/.test(name)) return "camelCase"
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)) return "kebab-case"
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(name)) return "snake_case"
  if (/^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/.test(name)) return "dot.separated"
  if (/^[A-Z0-9_]+$/.test(name)) return "SHOUTING_NO_UNDERSCORES"
  return "other"
}

function infCanonical(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase()
}

export async function secretNameHygiene(args: InfisicalNamesArgs): Promise<string> {
  const wanted = (args.style ?? "SHOUTING_SNAKE_CASE").trim()
  const names = (args.names ?? "")
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 100)
  if (names.length === 0) {
    return "Send the secret names to check, one per line or comma separated, e.g. STRIPE_SECRET_KEY, db-password."
  }
  const lower = new Map<string, string[]>()
  for (const n of names) {
    const k = n.toLowerCase()
    lower.set(k, [...(lower.get(k) ?? []), n])
  }
  const rows = names.map((name) => {
    const notes: string[] = []
    const style = infStyleOf(name)
    if (style !== wanted) notes.push(`naming style is ${style}, not ${wanted}`)
    if (/\s/.test(name)) notes.push("contains whitespace, which needs quoting in most .env parsers")
    if (name.length > 40) notes.push(`${name.length} characters is long for an env var name`)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) notes.push("is not a valid environment variable name")
    const risky = INF_RISKY.filter((re) => re.test(name))
    if (risky.length) notes.push(`name says what the secret is: matches ${risky.length} sensitive-word pattern(s)`)
    const perChar = name.length > 0 ? infEntropyPerChar(name) : 0
    if (perChar > 3.4 || /^[A-Za-z0-9+/]{24,}={0,2}$/.test(name) || /^[0-9a-f]{24,}$/i.test(name)) {
      notes.push("looks like a pasted value rather than a name")
    }
    const clashing = (lower.get(name.toLowerCase()) ?? []).filter((n) => n !== name)
    if (clashing.length) notes.push(`collides on case-insensitive lookup with ${clashing.join(", ")}`)
    return { name, style, notes, suggested: infCanonical(name) }
  })
  const flagged = rows.filter((r) => r.notes.length > 0)
  return [
    `${rows.length} secret name(s) checked against ${wanted}.`,
    "",
    ...rows.map((r) =>
      r.notes.length === 0
        ? `${r.name} — clean (${r.style})`
        : `${r.name} (${r.style})\n   - ${r.notes.join("\n   - ")}\n   suggest: ${r.suggested || "(not renameable)"}`
    ),
    "",
    `Clean: ${rows.length - flagged.length}. Needs attention: ${flagged.length}.`,
  ].join("\n")
}

export interface InfisicalDiffArgs {
  left: string
  right: string
  left_label?: string
  right_label?: string
}

function infNormalise(value: string): string {
  return value.trim().toLowerCase()
}

