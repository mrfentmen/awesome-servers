
export interface m1_TriviaCategory {
  id: number
  name: string
}

export interface m1_Question {
  category?: string
  type?: string
  difficulty?: string
  question?: string
  correct_answer?: string
  incorrect_answers?: string[]
}

const m0 = (() => {
const BASE = "https://opentdb.com/api.php"
const UA = "mrfentmen-trivia-mcp/1.0 (https://github.com/mrfentmen)"
class TriviaError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new TriviaError("Open Trivia rate limit hit, wait and retry")
  if (!res.ok) throw new TriviaError(`Open Trivia error ${res.status}`)
  return (await res.json()) as T
}

const CAT_IDS: Record<string, number> = {
  general: 9, books: 10, film: 11, music: 12, theatre: 13, television: 14,
  video_games: 15, board_games: 16, nature: 17, science: 17, science_nature: 17, computers: 18, math: 19,
  mythology: 20, sports: 21, geography: 22, history: 23, politics: 24,
  art: 25, celebrities: 26, animals: 27, vehicles: 28, comics: 29,
  gadgets: 30, anime: 31, cartoons: 32,
}

async function getQuestion(args: { category?: string; difficulty?: string }): Promise<string> {
  const params = ["amount=1", "type=multiple", "encode=url3986"]
  const cat = (args.category ?? "").trim().toLowerCase().replace(/ /g, "_")
  if (cat) {
    const id = CAT_IDS[cat]
    if (id === undefined) throw new TriviaError(`Unknown category. Use one of: ${Object.keys(CAT_IDS).join(", ")}`)
    params.push(`category=${id}`)
  }
  const diff = (args.difficulty ?? "").trim().toLowerCase()
  if (diff) {
    if (!["easy", "medium", "hard"].includes(diff)) throw new TriviaError("Difficulty must be easy, medium, or hard")
    params.push(`difficulty=${diff}`)
  }
  const d = await get<any>(`${BASE}?${params.join("&")}`)
  const q = d?.results?.[0]
  if (!q) return "No question returned"
  const decode = (s: string) => decodeURIComponent(s)
  const opts = [...(q.incorrect_answers ?? []), q.correct_answer].map(decode)
  const correct = decode(q.correct_answer)
  opts.sort(() => Math.random() - 0.5)
  return `${decode(q.question)}\n\nCategory: ${decode(q.category)} | Difficulty: ${decode(q.difficulty)}\n\n${opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}\n\nAnswer: ${correct}`
}

async function categories(args: Record<string, never>): Promise<string> {
  return Object.keys(CAT_IDS).map((k, i) => `${i + 1}. ${k}`).join("\n")
}

return { TriviaError, categories, getQuestion };
})();

const m1 = (() => {
/**
 * Open Trivia Database client. Keyless trivia questions across dozens of
 * categories with difficulty and type filters.
 */
const BASE = "https://opentdb.com/api.php"
const CATS = "https://opentdb.com/api_category.php"

class TriviaError extends Error {}



/** Decode common HTML entities in trivia text. */
function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;/g, "")
}

async function getCategories(): Promise<m1_TriviaCategory[]> {
  const res = await fetch(CATS, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new TriviaError(`Trivia API error ${res.status}`)
  const d = await res.json()
  return d?.trivia_categories ?? []
}

async function getQuestions(
  amount = 10,
  category?: number,
  difficulty?: string,
  type?: string,
): Promise<m1_Question[]> {
  const p = new URLSearchParams({ amount: String(Math.min(Math.max(amount, 1), 50)) })
  if (category) p.set("category", String(category))
  if (difficulty) p.set("difficulty", difficulty)
  if (type) p.set("type", type)
  const res = await fetch(`${BASE}?${p}`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new TriviaError(`Trivia API error ${res.status}`)
  const d = await res.json()
  if (d.response_code === 1) throw new TriviaError("No questions match those filters. Try another category or difficulty.")
  if (d.response_code === 2) throw new TriviaError("Invalid parameter.")
  if (d.response_code !== 0) throw new TriviaError(`Trivia API response code ${d.response_code}.`)
  return (d.results ?? []).map((q: m1_Question) => ({
    category: q.category ? decodeHtml(q.category) : undefined,
    type: q.type,
    difficulty: q.difficulty,
    question: q.question ? decodeHtml(q.question) : undefined,
    correct_answer: q.correct_answer ? decodeHtml(q.correct_answer) : undefined,
    incorrect_answers: (q.incorrect_answers ?? []).map(decodeHtml),
  }))
}

function formatQuestion(q: m1_Question, index?: number): string {
  const lines = [
    `${index !== undefined ? `${index + 1}. ` : ""}${q.question ?? "?"}`,
    `Category: ${q.category ?? "?"} | Difficulty: ${q.difficulty ?? "?"} | Type: ${q.type ?? "?"}`,
    `Answer: ${q.correct_answer ?? "?"}`,
    q.incorrect_answers?.length ? `Wrong answers: ${q.incorrect_answers.join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

return { TriviaError, decodeHtml, formatQuestion, getCategories, getQuestions };
})();

export const TriviaError = m0.TriviaError;
export const categories = m0.categories;
export const decodeHtml = m1.decodeHtml;
export const formatQuestion = m1.formatQuestion;
export const getCategories = m1.getCategories;
export const getQuestion = m0.getQuestion;
export const getQuestions = m1.getQuestions;
export const m0_categories = m0.categories;
export const m0_getQuestion = m0.getQuestion;
export const m0_TriviaError = m0.TriviaError;
export const m1_getCategories = m1.getCategories;
export const m1_formatQuestion = m1.formatQuestion;
export const m1_decodeHtml = m1.decodeHtml;
export const m1_TriviaError = m1.TriviaError;
export const m1_getQuestions = m1.getQuestions;

// ---- muxC tools:

// OpenTDB's own category ids, so a caller who already knows the number can use
// it without going through the friendly-name table.
const TRIVIA_BASE = "https://opentdb.com/api.php"
const TRIVIA_UA = "mrfentmen-trivia-mcp/1.0 (https://github.com/mrfentmen)"

class TriviaDbError extends Error {}

async function triviaFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": TRIVIA_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new TriviaDbError("Open Trivia rate limit hit, wait a few seconds and retry")
  if (!res.ok) throw new TriviaDbError(`Open Trivia error ${res.status}`)
  return res.json()
}

const decodeText = (s: unknown): string => {
  const raw = String(s ?? "")
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** True/false questions, which the multiple-choice tools never ask for. */
export async function booleanQuestion(args: { category_id?: number; amount?: number }): Promise<string> {
  const amount = Math.max(1, Math.min(args.amount ?? 3, 20))
  const params = [`amount=${amount}`, "type=boolean", "encode=url3986"]
  const id = args.category_id
  if (id !== undefined) {
    if (!Number.isInteger(id) || id < 9 || id > 32) throw new TriviaDbError("OpenTDB category ids run from 9 (General Knowledge) to 32 (Cartoons & Animations)")
    params.push(`category=${id}`)
  }
  const d = await triviaFetch(`${TRIVIA_BASE}?${params.join("&")}`)
  if (d?.response_code !== 0) throw new TriviaDbError(`Open Trivia answered response_code ${d?.response_code} (4 means the token expired, 5 a rate limit, 0 is success)`)
  const rows = d?.results ?? []
  if (!rows.length) return "Open Trivia returned no true/false questions."
  return `Open Trivia true/false (${rows.length}):\n` +
    rows.map((q: any, i: number) => `${i + 1}. ${decodeText(q.question)}\n   ${decodeText(q.category)} | ${decodeText(q.difficulty)} | answer: ${decodeText(q.correct_answer)}`).join("\n")
}

/** The category list straight from OpenTDB, with each category's question count. */
export async function categoryList(): Promise<string> {
  const d = await triviaFetch("https://opentdb.com/api_category.php?type=multiple")
  const rows = d?.trivia_categories ?? []
  if (!rows.length) return "Open Trivia returned no categories."
  return `Open Trivia categories for multiple-choice questions (${rows.length}):\n` +
    rows.map((c: any, i: number) => `${i + 1}. id ${c.id} - ${c.name}`).join("\n")
}
