/**
 * JokeAPI client, keyless.
 * Safe mode is always on so nothing offensive can come back.
 */

export class JokeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "JokeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-jokeapi-mcp/1.0"
const BASE = "https://v2.jokeapi.dev"

export interface Joke {
  error?: boolean
  category?: string
  type?: string
  joke?: string
  setup?: string
  delivery?: string
  flags?: Record<string, boolean>
  id?: number
  lang?: string
}

export interface JokeEnvelope {
  error: boolean
  amount?: number
  jokes?: Joke[]
  message?: string
  code?: number
}

interface Info {
  version: string
  jokes: { totalCount: number; categories: Record<string, number> }
  formats?: string[]
}

async function get(path: string): Promise<JokeEnvelope | Info> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new JokeError(`Could not reach jokeapi.dev: ${errorMessage(e)}`)
  }
  const body = (await res.text()).slice(0, 100000)
  if (!res.ok) {
    throw new JokeError(`jokeapi.dev returned HTTP ${res.status}: ${body.slice(0, 160)}`)
  }
  try {
    return JSON.parse(body) as JokeEnvelope | Info
  } catch {
    throw new JokeError("jokeapi.dev returned a non-JSON response.")
  }
}

function unwrap(data: JokeEnvelope | Info): JokeEnvelope {
  const env = data as JokeEnvelope
  if (env.error) {
    throw new JokeError(env.message ? String(env.message) : `jokeapi error ${env.code ?? ""}`.trim())
  }
  return env
}

export async function listCategories(): Promise<string> {
  const data = (await get("/categories")) as { categories?: string[] } & JokeEnvelope
  if (!Array.isArray(data.categories)) throw new JokeError("No categories returned.")
  return `${data.categories.length} safe-mode categories:\n\n${data.categories.map((c) => `  ${c}`).join("\n")}`
}

export function formatJoke(j: Joke, index?: number): string {
  const prefix = typeof index === "number" ? `${index + 1}. ` : ""
  const tag = j.category ? `[${j.category}${j.type ? ` · ${j.type}` : ""}]` : ""
  if (j.type === "twopart") {
    return `${prefix}${j.setup ?? ""}\n   ${j.delivery ?? ""}\n   ${tag}`.trimEnd()
  }
  return `${prefix}${j.joke ?? "(no joke returned)"}${tag ? `\n   ${tag}` : ""}`
}

function pick(envelope: JokeEnvelope): Joke[] {
  if (Array.isArray(envelope.jokes)) return envelope.jokes
  const single = envelope as unknown as Joke
  return single.joke || single.setup ? [single] : []
}

export async function getJoke(category: string | undefined, amount: number): Promise<string> {
  const cat = (category ?? "Any").trim() || "Any"
  const size = Math.min(Math.max(Math.round(amount) || 1, 1), 10)
  const query = `/joke/${encodeURIComponent(cat)}?safe-mode${size > 1 ? `&amount=${size}` : ""}`
  const jokes = pick(unwrap(await get(query)))
  if (jokes.length === 0) throw new JokeError("No joke returned.")
  if (jokes.length === 1) return formatJoke(jokes[0])
  return `${jokes.length} jokes from ${cat}:\n\n${jokes.map((j, i) => formatJoke(j, i)).join("\n\n")}`
}

export async function searchJokes(contains: string, category: string | undefined, amount: number): Promise<string> {
  const text = contains.trim()
  if (!text) throw new JokeError("Give a word to search for.")
  const cat = (category ?? "Any").trim() || "Any"
  const size = Math.min(Math.max(Math.round(amount) || 3, 1), 10)
  const path = `/joke/${encodeURIComponent(cat)}?safe-mode&contains=${encodeURIComponent(text)}&amount=${size}`
  const jokes = pick(unwrap(await get(path)))
  if (jokes.length === 0) return `No jokes containing "${text}".`
  return `Jokes containing "${text}" (${jokes.length}):\n\n${jokes.map((j, i) => formatJoke(j, i)).join("\n\n")}`
}

export async function jokeById(id: string, category: string | undefined): Promise<string> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new JokeError(`"${id}" is not a joke id - ids are numbers.`)
  const cat = (category ?? "Any").trim() || "Any"
  const jokes = pick(unwrap(await get(`/joke/${encodeURIComponent(cat)}?safe-mode&idRange=${clean}-${clean}`)))
  if (jokes.length === 0) return `No joke with id ${clean} in ${cat}.`
  return formatJoke(jokes[0])
}

export async function jokeInfo(): Promise<string> {
  const info = (await get("/info")) as Info & { jokes?: { totalCount: number; categories: Record<string, number> } }
  if (!info.jokes) throw new JokeError("No info returned.")
  const rows = Object.entries(info.jokes.categories ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `  ${cat.padEnd(14)} ${n}`)
  return [
    `JokeAPI v${info.version ?? "?"}`,
    "",
    `  total jokes  ${info.jokes.totalCount}`,
    `  formats      ${(info.formats ?? ["json"]).join(", ")}`,
    "",
    "Jokes per category:",
    ...rows,
  ].join("\n")
}

export async function listLanguages(): Promise<string> {
  const data = (await get("/languages")) as unknown as {
    defaultLanguage?: string
    jokeLanguages?: string[]
    systemLanguages?: string[]
    possibleLanguages?: Array<{ code: string; name: string }>
  }
  const possible = data.possibleLanguages ?? []
  if (possible.length === 0) throw new JokeError("No language list returned.")
  const rows = possible.map((l) => `  ${l.code}  ${l.name}`)
  return [
    `JokeAPI default language: ${data.defaultLanguage ?? "en"}`,
    `Translated jokes are available in: ${(data.jokeLanguages ?? []).join(", ")}`,
    `The API messages themselves support: ${(data.systemLanguages ?? []).join(", ")}`,
    "",
    `${possible.length} languages recognised by the API:`,
    ...rows,
  ].join("\n")
}
