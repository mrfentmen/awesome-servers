/**
 * LanguageTool public API client, keyless (fair-use limits).
 * Docs: https://languagetool.org/http-api/rest-api
 */
const BASE = "https://api.languagetool.org/v2"

export class LanguageToolError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

export interface Match {
  message: string
  short?: string
  offset: number
  length: number
  fragment: string
  suggestions: string[]
  rule?: string
  category?: string
}

export interface CheckResult {
  matches: Match[]
  truncated: boolean
}

export async function checkText(text: string, language = "auto"): Promise<CheckResult> {
  if (!text || !text.trim()) throw new LanguageToolError("Text is empty.")
  if (text.length > 20000) throw new LanguageToolError("Text too long (max 20000 chars on the public API).")
  const body = new URLSearchParams({ text, language, enabledOnly: "false" })
  const res = await fetch(`${BASE}/check`, {
    method: "POST",
    headers: { "User-Agent": "languagetool-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new LanguageToolError(`LanguageTool error ${res.status}`)
  const data = (await res.json()) as Raw
  const matches: Raw[] = Array.isArray(data.matches) ? data.matches : []
  return {
    truncated: Boolean(data?.warnings?.incompleteResults),
    matches: matches.slice(0, 15).map((m) => {
      const ctx = (m.context ?? {}) as Raw
      const reps: Raw[] = Array.isArray(m.replacements) ? m.replacements : []
      return {
        message: String(m.message ?? "?"),
        short: m.shortMessage ? String(m.shortMessage) : undefined,
        offset: Number(m.offset ?? 0),
        length: Number(m.length ?? 0),
        fragment: String(ctx.text ?? "").slice(
          Math.max(0, Number(ctx.offset ?? 0)), Number(ctx.offset ?? 0) + Number(ctx.length ?? 0)
        ).slice(0, 120),
        suggestions: reps.slice(0, 3).map((r) => String(r.value)),
        rule: (m.rule as Raw)?.id ? String((m.rule as Raw).id) : undefined,
        category: ((m.rule as Raw)?.category as Raw)?.name ? String(((m.rule as Raw).category as Raw).name) : undefined,
      }
    }),
  }
}

export interface Language {
  code: string
  name: string
}

export async function listLanguages(): Promise<Language[]> {
  const rows = await fetch(`${BASE}/languages`, {
    headers: { "User-Agent": "languagetool-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  }).then((r) => {
    if (!r.ok) throw new LanguageToolError(`LanguageTool error ${r.status}`)
    return r.json() as Promise<Raw[]>
  })
  return rows.map((l) => ({ code: String(l.longCode ?? l.code), name: String(l.name ?? l.code) }))
}

export function formatResult(r: CheckResult): string {
  if (r.matches.length === 0) return "No issues found."
  const lines = r.matches.map((m, i) => {
    const sug = m.suggestions.length ? ` → try: ${m.suggestions.join(", ")}` : ""
    const where = m.fragment ? ` ("...${m.fragment}...")` : ""
    return `${i + 1}. ${m.message}${m.category ? ` [${m.category}]` : ""}${where}${sug}`
  })
  if (r.truncated) lines.push("(results truncated by the API)")
  return `Found ${r.matches.length} issue${r.matches.length === 1 ? "" : "s"}:\n\n${lines.join("\n")}`
}

// ---- muxB tools:

const MEM_BASE = "https://api.mymemory.translated.net/get"
const DM_BASE = "https://api.datamuse.com/words"

export interface TranslateTextArgs {
  text: string
  from: string
  to: string
}

export async function translateText(args: TranslateTextArgs): Promise<string> {
  const q = (args.text ?? "").trim()
  if (!q) throw new LanguageToolError("Text is empty.")
  if (q.length > 500) throw new LanguageToolError("Text too long (max 500 chars for the MyMemory public API).")
  const from = (args.from ?? "").trim() || "en"
  const to = (args.to ?? "").trim()
  if (!to) throw new LanguageToolError("Provide a target language code, e.g. \"de\".")
  const url = new URL(MEM_BASE)
  url.searchParams.set("q", q)
  url.searchParams.set("langpair", `${from}|${to}`)
  const res = await fetch(url, {
    headers: { "User-Agent": "languagetool-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new LanguageToolError(`MyMemory error ${res.status}`)
  const data = (await res.json()) as {
    responseData?: { translatedText?: string; match?: number }
    responseStatus?: number
    responseDetails?: string
    matches?: Array<{ quality?: string; match?: number; translation?: string }>
  }
  if (typeof data.responseStatus === "number" && data.responseStatus >= 400) {
    throw new LanguageToolError(`MyMemory error ${data.responseStatus}: ${data.responseDetails || "request rejected"}`)
  }
  const translated = data.responseData?.translatedText
  if (!translated) throw new LanguageToolError("MyMemory returned no translation")
  const lines = [`${from} -> ${to}`, `"${q}"`, `Translation: ${translated}`]
  if (data.responseData?.match != null) lines.push(`Match quality: ${data.responseData.match}`)
  const alts = (data.matches ?? []).filter((m) => m.translation).slice(0, 3)
  if (alts.length) {
    lines.push("Other matched translations:")
    alts.forEach((m, i) => lines.push(`${i + 1}. quality ${m.quality ?? "not reported"}, match ${m.match ?? "not reported"}`))
  }
  return lines.join("\n")
}

export interface WordLookupArgs {
  word: string
  relation: "spelling" | "match" | "rhyme" | "define"
  limit?: number
}

export async function wordLookup(args: WordLookupArgs): Promise<string> {
  const word = (args.word ?? "").trim().toLowerCase()
  if (!word) throw new LanguageToolError("Provide a word to look up.")
  const limit = Math.max(1, Math.min(args.limit ?? 8, 25))
  const param = { spelling: "sp", match: "ml", rhyme: "rel_rhy", define: "def" }[args.relation]
  const url = new URL(DM_BASE)
  url.searchParams.set(param, word)
  url.searchParams.set("max", String(limit))
  const res = await fetch(url, {
    headers: { "User-Agent": "languagetool-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new LanguageToolError(`Datamuse error ${res.status}`)
  const rows = (await res.json()) as Array<{ word?: string; score?: number; tags?: string[]; defs?: string[] }>
  if (!Array.isArray(rows) || !rows.length) return `No ${args.relation} result for "${word}".`
  const head = {
    spelling: `Words that look like "${word}":`,
    match: `Words matching "${word}":`,
    rhyme: `Words rhyming with "${word}":`,
    define: `Definitions of "${word}":`,
  }[args.relation]
  const lines = [`${head} (${rows.length} shown)`]
  rows.slice(0, limit).forEach((r, i) => {
    const bits = [`${i + 1}. ${r.word ?? "not reported"}`]
    if (r.score != null) bits.push(`score ${r.score}`)
    if (r.tags?.length) bits.push(`tags ${r.tags.slice(0, 5).join(", ")}`)
    if (r.defs?.length) bits.push(`definition ${String(r.defs[0]).slice(0, 160)}`)
    lines.push(bits.join(" | "))
  })
  return lines.join("\n")
}
