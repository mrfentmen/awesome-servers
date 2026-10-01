/**
 * icanhazdadjoke API client, keyless.
 * Docs: https://icanhazdadjoke.com/api
 */
const BASE = "https://icanhazdadjoke.com"

export class DadJokeError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "dadjoke-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) throw new DadJokeError("No such joke.")
  if (!res.ok) throw new DadJokeError(`Dad joke error ${res.status}`)
  return (await res.json()) as T
}

export interface Joke {
  id: string
  joke: string
}

export async function randomJoke(): Promise<Joke> {
  const j = await getJson<Raw>("/")
  return { id: String(j.id), joke: String(j.joke) }
}

export async function searchJokes(term: string, limit = 5): Promise<Joke[]> {
  const data = await getJson<Raw>(`/search?term=${encodeURIComponent(term)}&limit=${Math.min(Math.max(limit, 1), 30)}`)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map((r) => ({ id: String(r.id), joke: String(r.joke) }))
}

export async function getJoke(id: string): Promise<Joke> {
  const j = await getJson<Raw>(`/j/${encodeURIComponent(id.trim())}`)
  return { id: String(j.id), joke: String(j.joke) }
}

// ---- muxB tools:

type JokeApiResult = {
  error?: boolean;
  category?: string;
  type?: string;
  joke?: string;
  setup?: string;
  delivery?: string;
  id?: number;
  flags?: Record<string, boolean>;
  message?: string;
  additionalInfo?: string;
}

type ChuckJoke = { id?: string; value?: string; categories?: string[]; created_at?: string; updated_at?: string; url?: string }

