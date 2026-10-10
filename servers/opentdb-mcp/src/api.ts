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
// ---- batch-5 tools: difficulty planner, category compare, question quality (2026-09-27) ----

interface DifficultyCounts {
  total_question_count: number
  total_easy_question_count: number
  total_medium_question_count: number
  total_hard_question_count: number
}

interface GlobalQuality {
  overall: {
    total_num_of_questions: number
    total_num_of_pending_questions: number
    total_num_of_verified_questions: number
    total_num_of_rejected_questions: number
  }
  categories: Record<string, GlobalQuality["overall"]>
}

/** The category list changes about once a year, and every count call is rate limited. */
let categoryCache: Array<{ id: number; name: string }> | null = null

async function categoryNames(): Promise<Array<{ id: number; name: string }>> {
  if (!categoryCache) categoryCache = (await listCategories()).trivia_categories
  return categoryCache
}

function nameOf(categories: Array<{ id: number; name: string }>, id: number): string {
  return categories.find((c) => c.id === id)?.name ?? `category ${id}`
}

const share = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%")

const difficultyRow = (counts: DifficultyCounts): string =>
  [
    `easy ${counts.total_easy_question_count.toLocaleString()} (${share(counts.total_easy_question_count, counts.total_question_count)})`,
    `medium ${counts.total_medium_question_count.toLocaleString()} (${share(counts.total_medium_question_count, counts.total_question_count)})`,
    `hard ${counts.total_hard_question_count.toLocaleString()} (${share(counts.total_hard_question_count, counts.total_question_count)})`,
  ].join(", ")

/** Two categories side by side, so a quiz can be built from the easier or harder of the pair. */
export async function compareCategories(args: { a: string; b: string }): Promise<string> {
  const first = await categoryCounts(args.a)
  const second = await categoryCounts(args.b)
  const categories = await categoryNames()
  const a = first.category_question_count
  const b = second.category_question_count

  const hardWinner =
    a.total_hard_question_count === b.total_hard_question_count
      ? "both hold the same number of hard questions"
      : `hard questions favour ${nameOf(categories, a.total_hard_question_count > b.total_hard_question_count ? first.category_id : second.category_id)}`

  return [
    "Category difficulty compare",
    `  ${nameOf(categories, first.category_id)} (id ${first.category_id}): ${a.total_question_count.toLocaleString()} questions`,
    `    ${difficultyRow(a)}`,
    `  ${nameOf(categories, second.category_id)} (id ${second.category_id}): ${b.total_question_count.toLocaleString()} questions`,
    `    ${difficultyRow(b)}`,
    "",
    `Totals differ by ${Math.abs(a.total_question_count - b.total_question_count).toLocaleString()} (${nameOf(categories, a.total_question_count >= b.total_question_count ? first.category_id : second.category_id)} is larger); ${hardWinner}.`,
    `Open Trivia DB serves at most 50 questions per request, so a ${Math.min(a.total_question_count, b.total_question_count).toLocaleString()}-question category is plenty.`,
  ].join("\n")
}

/**
 * Whether a planned quiz can actually be served. Open Trivia DB answers a
 * request larger than the pool with response code 1 and no questions at all,
 * which is the failure this check exists to prevent.
 */
export async function quizReadiness(args: { category: string; difficulty: string; amount: number }): Promise<string> {
  const wanted = (args.difficulty ?? "").trim().toLowerCase()
  if (!DIFFICULTIES.includes(wanted as (typeof DIFFICULTIES)[number])) {
    throw new TriviaError(`Difficulty must be one of ${DIFFICULTIES.join(", ")}.`)
  }
  const amount = Math.trunc(args.amount ?? 0)
  if (!Number.isFinite(amount) || amount < 1) throw new TriviaError("Ask for at least one question.")

  const counts = await categoryCounts(args.category)
  const categories = await categoryNames()
  const c = counts.category_question_count
  const available =
    wanted === "easy" ? c.total_easy_question_count : wanted === "medium" ? c.total_medium_question_count : c.total_hard_question_count
  const best = DIFFICULTIES.map((d) => ({
    difficulty: d,
    count: d === "easy" ? c.total_easy_question_count : d === "medium" ? c.total_medium_question_count : c.total_hard_question_count,
  })).sort((x, y) => y.count - x.count)[0]

  const capped = amount > 50
  const fits = amount <= available && !capped
  return [
    `Quiz readiness: ${nameOf(categories, counts.category_id)} (id ${counts.category_id}), ${amount} ${wanted} question(s)`,
    fits
      ? `READY — ${available.toLocaleString()} ${wanted} questions exist, so ${amount} will be served (${available - amount} spare).`
      : `NOT READY — only ${available.toLocaleString()} ${wanted} questions exist in this category.`,
    "",
    `easy ${c.total_easy_question_count.toLocaleString()} | medium ${c.total_medium_question_count.toLocaleString()} | hard ${c.total_hard_question_count.toLocaleString()} | total ${c.total_question_count.toLocaleString()}`,
    capped ? `Open Trivia DB caps one request at 50 questions; ask ${amount} across separate calls instead.` : "",
    !fits
      ? `Ask for at most ${Math.min(available, 50)} ${wanted} question(s), or switch to ${best.difficulty} where ${best.count.toLocaleString()} exist.`
      : "",
    `A ${wanted}-only quiz uses ${share(available, c.total_question_count)} of this category's pool.`,
  ].filter((line) => line !== "").join("\n")
}

/**
 * How well moderated each category is: verified questions are checked by a
 * human, pending and rejected ones are not, and a quiz drawn from a mostly
 * unverified category will contain mistakes.
 */
export async function categoryQuality(args: { limit?: number; minTotal?: number }): Promise<string> {
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 30)
  const minTotal = Math.min(Math.max(Math.trunc(args.minTotal ?? 50), 1), 100000)
  const raw = await get("/api_count_global.php")
  let envelope: GlobalQuality
  try {
    envelope = JSON.parse(raw) as GlobalQuality
  } catch {
    throw new TriviaError("opentdb.com returned a non-JSON response for the global counts.")
  }
  const categories = await categoryNames()
  const rows = Object.entries(envelope.categories ?? {})
    .map(([id, counts]) => ({
      id: Number(id),
      total: counts.total_num_of_questions,
      verified: counts.total_num_of_verified_questions,
      pending: counts.total_num_of_pending_questions,
      rejected: counts.total_num_of_rejected_questions,
    }))
    .filter((row) => row.total >= minTotal)
    .map((row) => ({ ...row, verifiedShare: row.total > 0 ? row.verified / row.total : 0 }))
    .sort((a, b) => b.verifiedShare - a.verifiedShare || b.total - a.total)

  if (!rows.length) throw new TriviaError(`No category has ${minTotal} questions yet.`)
  const worst = rows[rows.length - 1]
  return [
    `Category quality by verified share (${rows.length} categor${rows.length === 1 ? "y" : "ies"} with ${minTotal}+ questions)`,
    `Fleet wide: ${envelope.overall.total_num_of_verified_questions.toLocaleString()} verified, ${envelope.overall.total_num_of_pending_questions.toLocaleString()} pending, ${envelope.overall.total_num_of_rejected_questions.toLocaleString()} rejected`,
    "",
    ...rows.slice(0, limit).map(
      (row) =>
        `  ${share(row.verified, row.total).padStart(4)} verified  ${nameOf(categories, row.id)} (id ${row.id}) — ${row.total.toLocaleString()} questions, ${row.pending.toLocaleString()} pending, ${row.rejected.toLocaleString()} rejected`
    ),
    "",
    rows.length > limit ? `Weakest of those checked: ${nameOf(categories, worst.id)} at ${share(worst.verified, worst.total)} verified.` : "",
    `Verified share is this API's only quality signal and it changes as reviewers work, so check it before a big quiz run.`,
  ].filter((line) => line !== "").join("\n")
}

// ---- muxG tools:
const OT_LIST_CAP = 10

interface OtQuestion {
  category?: string
  type?: string
  difficulty?: string
  question?: string
  correct_answer?: string
  incorrect_answers?: string[]
}

interface OtBatch {
  code: number
  questions: OtQuestion[]
  requested: number
}

/** One batch, reusing the file's own rate-limit-aware fetch. */
async function otBatch(path: string): Promise<OtBatch> {
  const raw = await get(path)
  const parsed = JSON.parse(raw) as { response_code: number; results?: OtQuestion[] }
  if (parsed.response_code !== 0 || !parsed.results) {
    return { code: parsed.response_code, questions: [], requested: Number(/amount=(\d+)/.exec(path)?.[1] ?? 0) }
  }
  return { code: 0, questions: parsed.results, requested: Number(/amount=(\d+)/.exec(path)?.[1] ?? parsed.results.length) }
}

async function otSample(amount: number, category?: number, difficulty?: string): Promise<OtBatch> {
  const capped = Math.max(1, Math.min(50, Math.floor(amount)))
  let qs = `/api.php?amount=${capped}`
  if (category !== undefined) qs += `&category=${category}`
  if (difficulty) qs += `&difficulty=${encodeURIComponent(difficulty)}`
  const b = await otBatch(qs)
  if (b.code !== 0) {
    throw new TriviaError(
      b.code === 1
        ? `Not enough questions for that filter, so opentdb returned none instead of ${capped}. Lower the amount or drop the difficulty.`
        : `opentdb response code ${b.code} for that filter.`
    )
  }
  return b
}

function otNumberish(s: string): number | null {
  const cleaned = s.replace(/[$,%\s]/g, "")
  const m = /^-?\d+(\.\d+)?$/.exec(cleaned)
  if (!m) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Is each question actually fair to ask, judged from the wording and the answer set. */
export async function questionFairnessAudit(args: { amount?: number; category?: number }): Promise<string> {
  const batch = await otSample(Math.max(1, Math.min(50, Math.floor(Number(args?.amount ?? 20)) || 20)), args?.category)
  const qs = batch.questions
  if (!qs.length) throw new TriviaError("No questions were returned to audit.")

  let negated = 0
  let ofTheFollowing = 0
  let bothIn = 0
  let long = 0
  let entityLeak = 0
  let undecodable = 0
  let dupAnswers = 0
  let tooFewDistractors = 0
  let numericClash = 0
  const lengths: number[] = []
  const examples: string[] = []

  for (const q of qs) {
    const text = decode(q.question ?? "")
    const correct = decode(q.correct_answer ?? "")
    const wrong = (q.incorrect_answers ?? []).map(decode)
    lengths.push(text.length)

    if (/\b(not|never|except|false|isn't|aren't)\b/i.test(text)) {
      negated += 1
      if (examples.length < OT_LIST_CAP) examples.push(`negation: "${text.slice(0, 90)}"`)
    }
    if (/which of the following|all of the following|none of the following/i.test(text)) {
      ofTheFollowing += 1
      if (examples.length < OT_LIST_CAP) examples.push(`"which of the following": "${text.slice(0, 90)}"`)
    }
    if (/\bboth\b|\ball\b/i.test(text) && wrong.length >= 3) {
      bothIn += 1
      if (examples.length < OT_LIST_CAP) examples.push(`compound ("all"/"both") with ${wrong.length + 1} options: "${text.slice(0, 90)}"`)
    }
    if (text.length > 140) {
      long += 1
      if (examples.length < OT_LIST_CAP) examples.push(`${text.length} characters, awkward on a phone: "${text.slice(0, 70)}..."`)
    }
    if (/&(amp|quot|#0?39|lt|gt|ldquo|rdquo|eacute);/i.test(q.question ?? "") || /&(amp|quot|#0?39|lt|gt);/i.test(q.correct_answer ?? "")) {
      undecodable += 1
    }
    if (q.type === "boolean" && !/^(true|false)$/i.test(correct)) {
      if (examples.length < OT_LIST_CAP) examples.push(`true/false question whose stored answer is "${correct}": "${text.slice(0, 70)}"`)
    }
    const all = [correct, ...wrong].map((a) => a.trim().toLowerCase())
    if (new Set(all).size !== all.length) {
      dupAnswers += 1
      if (examples.length < OT_LIST_CAP) examples.push(`duplicate answer text in one question: "${text.slice(0, 70)}"`)
    }
    if (q.type !== "boolean" && wrong.length < 2) {
      tooFewDistractors += 1
    }
    const cn = otNumberish(correct)
    if (cn !== null) {
      const wrongNums = wrong.map(otNumberish).filter((n): n is number => n !== null)
      if (wrongNums.some((n) => n !== 0 && Math.abs(n - cn) / Math.max(1, Math.abs(cn)) < 0.02)) {
        numericClash += 1
        if (examples.length < OT_LIST_CAP) examples.push(`numeric distractor within 2% of the correct answer ${correct}: "${text.slice(0, 70)}"`)
      }
    }
    if (/\b(also known as|starred|directed by|written by|born in|located in)\b/i.test(text)) entityLeak += 1
  }

  const sorted = [...lengths].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
  const lines = [
    `Question fairness audit over ${qs.length} question(s) from opentdb${args?.category !== undefined ? `, category ${args.category}` : ", all categories"}`,
    `Question length: shortest ${sorted[0] ?? 0}, median ${median}, longest ${sorted[sorted.length - 1] ?? 0} characters`,
    "",
    "Flags:",
    `  worded as a negative ("not", "never", "except"): ${negated} (${((negated / qs.length) * 100).toFixed(0)}%)`,
    `  "which/all/none of the following": ${ofTheFollowing} (${((ofTheFollowing / qs.length) * 100).toFixed(0)}%)`,
    `  compound "all"/"both" against 4+ options: ${bothIn}`,
    `  longer than 140 characters: ${long}`,
    `  named entities hinted at in the wording (author, director, star): ${entityLeak}`,
    `  still carrying HTML entities after decoding: ${undecodable}`,
    `  multiple-choice with fewer than 3 distractors: ${tooFewDistractors}`,
    `  duplicate answer text within one question: ${dupAnswers}`,
    `  numeric distractor within 2% of the correct answer: ${numericClash}`,
    "",
    examples.length ? "Examples:" : "No examples to show: nothing was flagged.",
    ...examples.map((e) => `  - ${e}`),
  ]

  lines.push(
    "",
    "A negative or compound question is not broken, it is just a different skill: the reader has to hold the question in mind while checking every option, and a surprising share of players answer it correctly by pattern rather than knowledge.",
    "Distractors within a couple of per cent of the right answer turn a knowledge question into a rounding-convention question, which is usually not what the category implies.",
    "This looks only at wording and answer shape, because that is all the API exposes. It cannot tell you whether an answer is factually right, and it has no way of knowing whether a given fact is common knowledge, which is the actual standard for a good trivia question.",
  )
  return lines.join("\n")
}

