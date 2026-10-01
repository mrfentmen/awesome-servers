export class TorahError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TorahError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://www.sefaria.org/api"

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

function stripHtml(html: string): string {
  return html
    .replace(/<sup class="footnote-marker">.*?<\/sup>/gi, "")
    .replace(/<i class="footnote">[\s\S]*?<\/i>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanSegments(segs: unknown): string[] {
  if (!Array.isArray(segs)) return []
  return segs.map((s) => stripHtml(String(s ?? ""))).filter((s) => s.length > 0)
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new TorahError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getWeeklyPortion(latitude?: number, longitude?: number, timezone?: string): Promise<string> {
  const qs = new URLSearchParams()
  if (latitude !== undefined) qs.append("latitude", String(latitude))
  if (longitude !== undefined) qs.append("longitude", String(longitude))
  if (timezone !== undefined) qs.append("timezone", timezone)
  const qstr = qs.toString()
  const url = `${BASE}/calendars${qstr ? "?" + qstr : ""}`
  const data = (await req(url)) as { date?: string; calendar_items?: Array<{ title?: { en?: string }; displayValue?: { en?: string }; url?: string; ref?: string; category?: string }> }
  const items = data.calendar_items ?? []
  if (items.length === 0) return `No calendar items for ${data.date ?? "today"}.`
  const lines = items.map((i) => `- ${i.title?.en ?? "?"}: ${i.displayValue?.en ?? ""}${i.ref ? ` (${i.ref})` : ""}`)
  return `Jewish calendar for ${data.date ?? "today"}:\n${lines.join("\n")}`
}

export async function getTanakhText(ref: string, language?: string): Promise<string> {
  const r = ref.trim()
  if (!r) throw new TorahError("Provide a reference like 'Genesis.1', 'Exodus 20' or 'Psalms.23'.")
  const data = (await req(`${BASE}/texts/${encodeURIComponent(r)}?commentary=0`)) as {
    ref?: string; heRef?: string; text?: unknown; he?: unknown; versions?: Array<{ language?: string; versionTitle?: string }>
  };
  const en = cleanSegments(data.text)
  const he = cleanSegments(data.he)
  const out: string[] = [`${data.ref ?? r}${data.heRef ? ` / ${data.heRef}` : ""}`]
  const showHe = !language || language === "he" || language === "both"
  const showEn = !language || language === "en" || language === "both"
  if (showEn && en.length > 0) out.push(`\nEnglish:\n${en.map((v, i) => `${i + 1}. ${v}`).join("\n")}`)
  if (showHe && he.length > 0) out.push(`\nHebrew:\n${he.map((v, i) => `${i + 1}. ${v}`).join("\n")}`)
  if (out.length === 1) {
    const vers = (data.versions ?? []).map((v) => `${v.versionTitle ?? "?"} [${v.language ?? "?"}]`).join(", ")
    throw new TorahError(`No text returned for "${r}".${vers ? ` Available versions: ${vers}` : ""}`)
  }
  return pretty(out.join("\n"))
}

export async function getCommentaries(ref: string, commentator?: string, maxResults?: number): Promise<string> {
  const r = ref.trim()
  if (!r) throw new TorahError("Provide a reference like 'Genesis.1.1'.")
  const links = (await req(`${BASE}/links/${encodeURIComponent(r)}`)) as Array<{ ref?: string; category?: string }>;
  const needle = (commentator ?? "").trim().toLowerCase()
  const comm = links.filter(
    (l) => (l.category ?? "") === "Commentary" && (!needle || (l.ref ?? "").toLowerCase().includes(needle))
  )
  if (comm.length === 0) return `No commentaries found for "${r}"${needle ? ` matching "${commentator}"` : ""}.`
  const n = Math.min(Math.max(maxResults ?? 3, 1), 5)
  const parts: string[] = []
  for (const c of comm.slice(0, n)) {
    const data = (await req(`${BASE}/texts/${encodeURIComponent(c.ref ?? "")}?commentary=0`)) as {
      ref?: string; text?: unknown; he?: unknown
    };
    const en = cleanSegments(data.text).join(" ")
    const he = cleanSegments(data.he).join(" ")
    const body = (en || he).slice(0, 1500)
    parts.push(`${data.ref ?? c.ref ?? ""}:\n${body}`)
  }
  return pretty(`Commentaries on ${r} (showing ${parts.length} of ${comm.length}):\n\n${parts.join("\n\n")}`)
}

export async function getConnections(ref: string, category?: string): Promise<string> {
  const r = ref.trim()
  if (!r) throw new TorahError("Provide a verse reference like 'Genesis.1.1'.")
  const data = (await req(`${BASE}/links/${encodeURIComponent(r)}`)) as Array<{ ref?: string; category?: string; type?: string; anchorRef?: string }>;
  const needle = (category ?? "").trim().toLowerCase()
  const list = needle ? data.filter((l) => `${l.category ?? ""} ${l.type ?? ""}`.toLowerCase().includes(needle)) : data
  if (list.length === 0) return `No linked sources found for "${r}".`
  const shown = list.slice(0, 25)
  return pretty(`Sources linked to ${r} (${list.length} shown ${shown.length}):\n${shown.map((l) => `- ${l.ref ?? "?"} [${l.category ?? l.type ?? "?"}]`).join("\n")}`)
}

export async function searchTexts(query: string, size?: number): Promise<string> {
  const q = query.trim()
  if (!q) throw new TorahError("Provide a search query.")
  const n = Math.min(size ?? 5, 20)
  const data = (await req(`${BASE}/search-wrapper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, type: "text", size: n }),
  })) as { hits?: { hits?: Array<{ _id?: string; _score?: number; highlight?: { exact?: string[] } }> } };
  const hits = data.hits?.hits ?? []
  if (hits.length === 0) return `No texts match "${q}".`
  const parts = hits.map((h) => {
    const hl = (h.highlight?.exact ?? []).map((s) => stripHtml(s)).join(" … ").slice(0, 300)
    return `- ${h._id ?? "?"}${hl ? `\n  ${hl}` : ""}`
  })
  return pretty(`Results for "${q}":\n${parts.join("\n")}`)
}

// ---- muxC tools:

interface SefariaIndex {
  title?: string
  heTitle?: string
  categories?: string[]
  schema?: { nodeType?: string; depth?: number; addressTypes?: string[]; nodeTypes?: Array<{ name?: string; depth?: number }> }
  enDesc?: string
  compDate?: string
  compPlace?: string
  pubDate?: string
  pubPlace?: string
  sectionNames?: string[]
  depth?: number
}

interface SefariaLexiconSense {
  definition?: string
  // grammar is an object of grammatical labels, e.g. {verbal_stem: "Qal"}
  grammar?: Record<string, string> | string
  senses?: SefariaLexiconSense[]
}

interface SefariaLexiconEntry {
  headword?: string
  parent_lexicon?: string
  content?: { morphology?: string; senses?: SefariaLexiconSense[] }
}

