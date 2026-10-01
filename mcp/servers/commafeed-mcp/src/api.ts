export class CommaFeedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CommaFeedError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function base(): string {
  return (process.env.COMMAFEED_BASE_URL ?? "https://www.commafeed.com").replace(/\/$/, "")
}

function authHeaders(): Record<string, string> {
  const u = process.env.COMMAFEED_USERNAME
  const p = process.env.COMMAFEED_PASSWORD
  if (!u || !p) throw new CommaFeedError("Set COMMAFEED_USERNAME and COMMAFEED_PASSWORD (HTTP Basic auth).")
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(`${u}:${p}`).toString("base64") : btoa(`${u}:${p}`)
  return { Authorization: "Basic " + b64 }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(base() + path, {
    headers: { ...UA, ...authHeaders(), ...(init.headers ?? {}) },
    ...init,
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new CommaFeedError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function getFeedEntries(feedId: string, readType?: string, limit?: string): Promise<string> {
  const p = new URLSearchParams({ id: feedId, readType: readType ?? "all" })
  if (limit) p.set("limit", limit)
  return req(`/rest/feed/entries?${p.toString()}`)
}

export function markEntry(entryId: string, read: string): Promise<string> {
  return req("/rest/entry/mark", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: entryId, read: read === "true" }),
  })
}

export function listEntryTags(): Promise<string> {
  return req("/rest/entry/tags")
}

export function subscribeFeed(url: string): Promise<string> {
  return req(`/rest/feed/subscribe?url=${encodeURIComponent(url)}`)
}
