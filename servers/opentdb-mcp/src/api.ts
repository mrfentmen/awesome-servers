/**
 * Open Trivia DB client, keyless.
 * Public trivia API; session tokens stop the same question repeating.
 */

export class TriviaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TriviaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-opentdb-mcp/1.0"
const BASE = "https://opentdb.com"

export const DIFFICULTIES = ["easy", "medium", "hard"] as const

export interface Question {
  category: string
  type: string
  difficulty: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

export interface Categories {
  trivia_categories: Array<{ id: number; name: string }>
}

interface ApiEnvelope<T> {
  response_code: number
  results?: T
}

const RESPONSE_CODES: Record<number, string> = {
  0: "Success",
  1: "No results - not enough questions for that combination, try a lower amount.",
  2: "Invalid parameter - check the category id and difficulty.",
  3: "Session token not found - request a new one.",
  4: "Session token exhausted - reset it or request a new one.",
  5: "Rate limited - wait a moment and retry.",
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function get(path: string, attempt = 0): Promise<string> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new TriviaError(`Could not reach opentdb.com: ${errorMessage(e)}`)
  }
  if (res.status === 429) {
    // opentdb allows one request every 5 seconds; wait it out once before giving up.
    if (attempt === 0) {
      await sleep(5200)
      return get(path, 1)
    }
    throw new TriviaError("Open Trivia DB is rate limiting (one request every 5 seconds). Retry in a moment.")
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new TriviaError(`opentdb.com returned HTTP ${res.status}: ${body}`)
  }
  return res.text()
}

function envelope<T>(path: string, raw: string): T {
  let parsed: ApiEnvelope<T>
  try {
    parsed = JSON.parse(raw) as ApiEnvelope<T>
  } catch {
    throw new TriviaError("opentdb.com returned a non-JSON response.")
  }
  if (typeof parsed.response_code === "number" && parsed.response_code !== 0) {
    throw new TriviaError(RESPONSE_CODES[parsed.response_code] ?? `opentdb error ${parsed.response_code}.`)
  }
  if (parsed.results === undefined) throw new TriviaError(`No results returned for ${path}.`)
  return parsed.results
}

/** opentdb HTML-escapes question text and answers. */
export function decode(raw: string): string {
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
}

export async function listCategories(): Promise<Categories> {
  return JSON.parse(await get("/api_category.php")) as Categories
}

export interface CategoryCount {
  category_id: number
  category_question_count: {
    total_question_count: number
    total_easy_question_count: number
    total_medium_question_count: number
    total_hard_question_count: number
  }
}

export async function categoryCounts(category: string): Promise<CategoryCount> {
  const id = categoryId(category)
  return JSON.parse(await get(`/api_count.php?category=${id}`)) as CategoryCount
}

export interface GlobalCount {
  overall: {
    total_num_of_questions: number
    total_num_of_pending_questions: number
    total_num_of_verified_questions: number
    total_num_of_rejected_questions: number
  }
  categories: Record<string, { total_num_of_questions: number }>
}

export async function globalCounts(): Promise<GlobalCount> {
  return JSON.parse(await get("/api_count_global.php")) as GlobalCount
}

function params(amount: number, category?: string, difficulty?: string, token?: string, type?: string): string {
  const q = new URLSearchParams({ amount: String(amount) })
  if (category && category.trim()) q.set("category", categoryId(category))
  if (difficulty && difficulty.trim()) {
    const d = difficulty.trim().toLowerCase()
    if (!(DIFFICULTIES as readonly string[]).includes(d)) {
      throw new TriviaError(`Difficulty must be easy, medium or hard - got "${difficulty}".`)
    }
    q.set("difficulty", d)
  }
  if (type && type.trim()) q.set("type", type.trim())
  if (token && token.trim()) q.set("token", token.trim())
  return q.toString()
}

function categoryId(category: string): string {
  const c = category.trim()
  if (!/^\d+$/.test(c)) {
    throw new TriviaError(`"${category}" is not a numeric category id - call list_categories for the ids.`)
  }
  return c
}

export async function questions(
  amount: number,
  category?: string,
  difficulty?: string,
  token?: string,
  type?: string
): Promise<Question[]> {
  const size = Math.min(Math.max(Math.round(amount) || 5, 1), 50)
  const path = `/api.php?${params(size, category, difficulty, token, type)}`
  return envelope<Question[]>(path, await get(path))
}

export async function sessionToken(action: "request" | "reset"): Promise<string> {
  const raw = await get(`/api_token.php?command=${action}`)
  let parsed: { response_code: number; token?: string }
  try {
    parsed = JSON.parse(raw) as { response_code: number; token?: string }
  } catch {
    throw new TriviaError("opentdb.com returned a non-JSON token response.")
  }
  if (parsed.response_code !== 0 || !parsed.token) {
    throw new TriviaError(RESPONSE_CODES[parsed.response_code] ?? "Could not get a session token.")
  }
  return parsed.token
}

export function formatQuestion(q: Question, index: number): string {
  const answers = [q.correct_answer, ...q.incorrect_answers].map(decode)
  const shown = answers.map((a) => `     - ${a}`).join("\n")
  return [
    `${index + 1}. ${decode(q.question)}`,
    `   [${q.difficulty} · ${q.category} · ${q.type === "boolean" ? "true/false" : "multiple choice"}]`,
    shown,
  ].join("\n")
}

export function formatQuiz(list: Question[], title: string): string {
  if (list.length === 0) return `No questions available for ${title}.`
  const questions = list.map((q, i) => formatQuestion(q, i))
  const key = list.map((q, i) => `  ${i + 1}. ${decode(q.correct_answer)}`)
  return [
    `${title} - ${list.length} question(s)`,
    "",
    questions.join("\n\n"),
    "",
    "Answer key:",
    key.join("\n"),
  ].join("\n")
}
