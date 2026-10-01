export class OdyseeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OdyseeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

async function authHeaders(): Promise<Record<string, string>> {
  return {}
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
    throw new OdyseeError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchClaims(query: string, size?: number): Promise<string> {
  let url = `https://lighthouse.odysee.tv/search`;
  const qs = new URLSearchParams();
  qs.append("s", String(query));
  if (size !== undefined) qs.append("size", String(size));
  qs.append("free_only", "true");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function searchChannel(channel: string, size?: number): Promise<string> {
  let url = `https://lighthouse.odysee.tv/search`;
  const qs = new URLSearchParams();
  qs.append("s", String(channel));
  qs.append("channel", String(channel));
  if (size !== undefined) qs.append("size", String(size));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxC tools:

// lighthouse.odysee.tv/search only understands s/size/channel/free_only, so
// anything richer goes through Odysee's own JSON-RPC proxy, which is the
// documented public API for resolving claims and channels.
const ODYSEE_PROXY = "https://api.na-backend.odysee.com/api/v1/proxy"

interface OdyseeClaim {
  name?: string
  claim_id?: string
  canonical_url?: string
  permanent_url?: string
  short_url?: string
  type?: string
  timestamp?: number
  value?: {
    title?: string
    description?: string
    duration?: number
    view_count?: number
    release_time?: string | number
    license?: string
    language?: string
    tags?: string[]
    thumbnail?: string
  }
  meta?: {
    claims_in_channel?: number
    creation_timestamp?: number
    effective_amount?: string
    reposted?: number
    activation_height?: number
  }
  signing_channel?: { name?: string; canonical_url?: string }
}

async function odyseeRpc(method: string, params: Record<string, unknown>): Promise<Record<string, OdyseeClaim>> {
  let res: Response
  try {
    res = await fetch(ODYSEE_PROXY, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ method, params }),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    throw new OdyseeError(`Odysee API unreachable: ${e instanceof Error ? e.message : String(e)}`)
  }
  const body = (await res.json()) as { result?: Record<string, OdyseeClaim>; error?: { message?: string } }
  if (body.error) throw new OdyseeError(`Odysee API error: ${body.error.message ?? "unknown"}`)
  return body.result ?? {}
}

function claimAtTime(seconds: string | number | undefined): string {
  if (seconds === undefined) return "not reported"
  const n = Number(seconds)
  if (!Number.isFinite(n) || n <= 0) return "not reported"
  return new Date(n * 1000).toISOString().slice(0, 10)
}

function durationText(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return "not reported"
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  return `${m}m ${String(total % 60).padStart(2, "0")}s`
}

// ---- gap4d1 tools:

async function discoverClaims(params: Record<string, unknown>): Promise<{ items?: OdyseeClaim[]; total_items?: number }> {
  const res = await fetch(ODYSEE_PROXY, {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ method: "claim_search", params }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new OdyseeError(`Odysee returned HTTP ${res.status}`)
  const data = await res.json() as { result?: { items?: OdyseeClaim[]; total_items?: number }; error?: { message?: string } }
  if (data.error) throw new OdyseeError(`Odysee API error: ${data.error.message ?? "not reported"}`)
  if (!Array.isArray(data.result?.items)) throw new OdyseeError("Odysee returned no claim list")
  return data.result
}

