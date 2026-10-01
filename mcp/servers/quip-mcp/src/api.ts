export class QuipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QuipError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new QuipError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("QUIP_API_TOKEN") };
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
    throw new QuipError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchThreads(query: string): Promise<string> {
  let url = `https://platform.quip.com/1/threads/search`;
  const qs = new URLSearchParams();
  qs.append("query", String(query));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getThread(threadId: string): Promise<string> {
  let url = `https://platform.quip.com/1/threads/${encodeURIComponent(String(threadId))}`;
  const data = await req(url);
  return pretty(data);
}

export async function listFolders(): Promise<string> {
  let url = `https://platform.quip.com/1/folders`;
  const data = await req(url);
  return pretty(data);
}

export async function getUser(): Promise<string> {
  let url = `https://platform.quip.com/1/users/current`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxH tools:
// The tools above read a Quip workspace behind a token. These two read and
// measure documents without one: an article as a document, with its structure,
// its provenance and the knowledge item behind it.

interface WikiSection {
  level?: string
  line?: string
  anchor?: string
}

interface WikiPage {
  pageid?: number
  ns?: number
  title?: string
  missing?: string
  extract?: string
  length?: number
  lastrevid?: number
  touched?: string
  pageprops?: { wikibase_item?: string; "wikibase-shortdesc"?: string; page_image_free?: string }
  revisions?: Array<{ revid?: number; parentid?: number; user?: string; timestamp?: string }>
}

interface WikiResponse {
  query?: { pages?: Record<string, WikiPage> }
  parse?: { title?: string; pageid?: number; sections?: WikiSection[] }
}

interface DocStats {
  words: number
  sentences: number
  paragraphs: number
  headings: number
  links: number
  flesch: number
  grade: number
  longestWord: string
  longestSentence: number
}

/**
 * How a document actually reads: word and sentence counts, a Flesch reading
 * ease and Flesch-Kincaid grade, the heading count, the links it carries and the
 * longest sentence in it. Runs entirely on the text supplied.
 */
export async function documentProfile(args: { text: string }): Promise<string> {
  const raw = (args.text ?? "").trim()
  if (!raw) throw new QuipError("Give the document text to profile.")
  const capped = raw.slice(0, 500000)

  const words = capped.match(/[A-Za-z0-9'’-]+/g) ?? []
  const sentences = capped.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter((s) => s.split(/\s+/).filter(Boolean).length > 0)
  const paragraphs = capped.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const headings = capped.split("\n").filter((l) => /^\s{0,3}#{1,6}\s+\S/.test(l))
  const links = [...capped.matchAll(/\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1])

  const syllableCount = (word: string): number => {
    const w = word.toLowerCase().replace(/[^a-z]/g, "")
    if (w.length <= 2) return 1
    const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "")
    const groups = trimmed.match(/[aeiouy]{1,2}/g)
    return Math.max(1, groups ? groups.length : 1)
  }
  const syllables = words.reduce((sum, word) => sum + syllableCount(word), 0)
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / Math.max(wordCount, 1))
  const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / Math.max(wordCount, 1)) - 15.59
  const longestWord = words.reduce((a, b) => (b.length > a.length ? b : a), "")
  const longestSentence = Math.max(...sentences.map((s) => s.split(/\s+/).filter(Boolean).length), 0)

  const stats: DocStats = {
    words: wordCount,
    sentences: sentenceCount,
    paragraphs: paragraphs.length,
    headings: headings.length,
    links: links.length,
    flesch: Math.round(flesch * 10) / 10,
    grade: Math.round(grade * 10) / 10,
    longestWord,
    longestSentence,
  }

  const ease = (value: number): string =>
    value >= 90 ? "very easy, roughly a 5th grader" : value >= 80 ? "easy, roughly a 6th grader" : value >= 70 ? "fairly easy, roughly a 7th grader" : value >= 60 ? "plain English, roughly an 8th to 9th grader" : value >= 50 ? "fairly difficult, roughly a 10th to 12th grader" : value >= 30 ? "difficult, roughly a college student" : "very difficult, above college"

  const findings: string[] = []
  if (stats.words / sentenceCount > 25) findings.push(`sentences average ${(stats.words / sentenceCount).toFixed(1)} words, so the document is dense`);
  if (stats.longestSentence > 45) findings.push(`the longest sentence runs ${stats.longestSentence} words`);
  if (stats.words > 0 && stats.words / Math.max(stats.paragraphs, 1) > 120) findings.push("paragraphs average over 120 words each, which reads as a wall");
  if (stats.headings === 0 && stats.words > 300) findings.push("no markdown headings at all, so the document has no navigable structure");
  if (stats.links > 0) {
    const unique = new Set(links).size
    if (unique < stats.links / 2) findings.push(`only ${unique} distinct link target(s) behind ${stats.links} links, so much of the linking is repeated`);
  }

  return [
    `Document profile (${capped.length.toLocaleString()} characters supplied)`,
    `  ${stats.words.toLocaleString()} words | ${stats.sentences.toLocaleString()} sentences | ${stats.paragraphs.toLocaleString()} paragraphs | ${stats.headings} markdown heading(s) | ${stats.links} link(s)`,
    `  ${(stats.words / sentenceCount).toFixed(1)} words per sentence, ${(syllables / Math.max(wordCount, 1)).toFixed(2)} syllables per word`,
    `  longest word: "${stats.longestWord.slice(0, 60)}" | longest sentence: ${stats.longestSentence} words`,
    "",
    `  Flesch reading ease: ${stats.flesch} — ${ease(stats.flesch)}`,
    `  Flesch-Kincaid grade level: ${stats.grade}`,
    "",
    findings.length ? `Findings (${findings.length}):` : "Findings: nothing structural to flag",
    ...findings.map((f) => `  - ${f}`),
    "",
    "Readability is scored from the supplied text alone; no model, no service and no fabricated data is involved.",
  ].join("\n")
}
