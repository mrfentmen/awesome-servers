/**
 * memegen.link API client, keyless.
 * Docs: https://api.memegen.link/
 * Image URLs are deterministic: https://api.memegen.link/images/{template}/{top}/{bottom}.png
 */
const BASE = "https://api.memegen.link"

export class MemeError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "memegen-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) throw new MemeError("No such meme template.")
  if (!res.ok) throw new MemeError(`memegen.link error ${res.status}`)
  return (await res.json()) as T
}

export interface Template {
  id: string
  name: string
  lines: number
  blank?: string
  example?: string
}

export async function listTemplates(): Promise<Template[]> {
  const rows = await getJson<Raw[]>("/templates")
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? r.id),
    lines: typeof r.lines === "number" ? r.lines : 2,
    blank: r.blank,
    example: (r.example as Raw)?.url,
  }))
}

export async function getTemplate(id: string): Promise<Template> {
  const clean = id.trim().toLowerCase().replace(/\s+/g, "-")
  const r = await getJson<Raw>(`/templates/${encodeURIComponent(clean)}`)
  return {
    id: String(r.id ?? clean),
    name: String(r.name ?? clean),
    lines: typeof r.lines === "number" ? r.lines : 2,
    blank: r.blank,
    example: (r.example as Raw)?.url,
  }
}

const slug = (s: string): string => {
  const t = s.trim().replace(/ /g, "_").replace(/[^A-Za-z0-9_~%#'\-.,]/g, "") || "_"
  return t
    .replace(/_/g, "__").replace(/-/g, "--").replace(/~/g, "~~")
    .replace(/%/g, "~p").replace(/#/g, "~h").replace(/"/g, "''")
}

export function makeMeme(template: string, lines: string[]): string {
  const clean = template.trim().toLowerCase().replace(/\s+/g, "-")
  if (!/^[a-z0-9-]+$/.test(clean)) throw new MemeError(`Bad template id: "${template}". Use list_templates.`)
  const parts = lines.slice(0, 8).map(slug)
  while (parts.length === 0) parts.push("_")
  return `https://api.memegen.link/images/${clean}/${parts.join("/")}.png`
}

// ---- muxB tools:
const FONT_FIELDS = ["id", "alias", "filename"] as const;

type MemeFont = { id?: string; alias?: string | null; filename?: string };

export async function listFonts(): Promise<string> {
  const res = await fetch(`${BASE}/fonts`, {
    headers: { "User-Agent": "memegen-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new MemeError(`memegen.link error ${res.status}`)
  const rows = (await res.json()) as MemeFont[]
  if (!Array.isArray(rows) || !rows.length) throw new MemeError("No caption fonts reported.")
  const lines = rows.map((f) => {
    const fields = FONT_FIELDS.map((k) => `${k} ${f[k] == null ? "not reported" : f[k]}`).join(" | ")
    return `- ${fields}`
  })
  return `Caption fonts on memegen.link (${rows.length} available)\nAppend the font to the image path, for example https://api.memegen.link/images/fry/one_line/two_lines.png?font=impact\n${lines.join("\n")}`
}

type ZenQuote = { q?: string; a?: string };

export async function randomQuote(): Promise<string> {
  const res = await fetch("https://zenquotes.io/api/random", {
    headers: { "User-Agent": "memegen-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new MemeError(`Quote service error ${res.status}`)
  const data = (await res.json()) as ZenQuote[]
  const q = Array.isArray(data) ? data[0] : undefined
  if (!q?.q) throw new MemeError("The quote service returned no quote.")
  const text = q.q.length > 280 ? `${q.q.slice(0, 280)}...` : q.q
  return `Quote: ${text}\nAttributed to: ${q.a ?? "not reported"}`
}
