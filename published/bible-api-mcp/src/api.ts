/**
 * Bible API — keyless public API client.
 */
const BASE = "https://bible-api.com"
const SOURCE = "Bible API"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "bible-api-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function passage(d: any, label: string): string {
  const verses: any[] = Array.isArray(d?.verses) ? d.verses : []
  if (!verses.length) throw new SourceError(`bible-api returned no verses for ${label}`)
  const body = verses.map((v) => `${v.chapter}:${v.verse} ${clean(v.text).replace(/\s+/g, " ").trim()}`).join("\n")
  return [
    `${clean(d.reference) || label} - ${clean(d.translation_name) || "translation"}`,
    "",
    body,
  ].join("\n")
}

export async function getPassage(a: { reference: string; translation?: string }): Promise<string> {
  const reference = clean(a.reference)
  if (reference.length < 3) throw new SourceError("reference must be at least 3 characters")
  const translation = clean(a.translation || "kjv").toLowerCase()
  if (!/^[a-z0-9.-]{2,20}$/.test(translation)) throw new SourceError("translation must look like kjv or web")
  const d = await getJson(`/${encodeURIComponent(reference)}?translation=${encodeURIComponent(translation)}`)
  if (d?.error) throw new SourceError(clean(d.error))
  return passage(d, `${reference} (${translation})`)
}

export async function randomVerse(a: { translation?: string }): Promise<string> {
  const translation = clean(a.translation || "kjv").toLowerCase()
  if (!/^[a-z0-9.-]{2,20}$/.test(translation)) throw new SourceError("translation must look like kjv or web")
  const d = await getJson(`/?random=verse&translation=${encodeURIComponent(translation)}`)
  const verses: any[] = Array.isArray(d?.verses) ? d.verses : []
  if (!verses.length) throw new SourceError("bible-api returned no random verse")
  const v = verses[0]
  return [
    `${clean(d.reference)} - ${clean(d.translation_name) || translation}`,
    "",
    `${v.chapter}:${v.verse} ${clean(v.text).replace(/\s+/g, " ").trim()}`,
  ].join("\n")
}

export async function listTranslations(): Promise<string> {
  const d = await getJson(`/data`)
  const rows: any[] = Array.isArray(d?.translations) ? d.translations : []
  if (!rows.length) throw new SourceError("bible-api returned no translations")
  return [
    `bible-api offers ${rows.length} translations:`,
    "",
    ...rows.map((t) => `- ${clean(t.identifier)}${clean(t.englishName) ? ` (${clean(t.englishName)})` : ""} · ${clean(t.language) || "?"}${clean(t.license) ? ` · ${clean(t.license).slice(0, 90)}` : ""}`),
  ].join("\n")
}
