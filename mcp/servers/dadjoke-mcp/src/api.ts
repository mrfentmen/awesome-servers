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
const JOKEAPI = 'https://jokeapi.dev';
const CHUCK = 'https://api.chucknorris.io/jokes/random';
const JOKE_CATEGORIES = ['Any', 'Misc', 'Programming', 'Dark', 'Pun', 'Spooky', 'Christmas'] as const;
const CHUCK_CATEGORIES = ['animal', 'career', 'celebrity', 'dev', 'fashion', 'food', 'history', 'money', 'movie', 'music', 'science', 'sport', 'travel'] as const;

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

const flagNames = (flags: Record<string, boolean> | undefined): string[] =>
  Object.entries(flags ?? {}).filter(([, on]) => on).map(([name]) => name)

export async function typedJoke(args: { category?: string }): Promise<string> {
  const key = (args.category ?? 'Any').trim()
  const match = JOKE_CATEGORIES.find((c) => c.toLowerCase() === key.toLowerCase())
  if (!match) throw new DadJokeError(`"${args.category}" is not a JokeAPI category. Use one of ${JOKE_CATEGORIES.join(', ')}.`)
  const path = match === 'Any' ? '/joke/Any' : `/joke/${encodeURIComponent(match)}`
  const url = `${JOKEAPI}${path}?type=twist`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'dadjoke-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  const d = (await res.json()) as JokeApiResult
  if (d.error || !res.ok) throw new DadJokeError(d.additionalInfo ?? d.message ?? `JokeAPI returned ${res.status}`)
  const joke = [d.setup, d.delivery].filter(Boolean).join('\n') || d.joke
  if (!joke) throw new DadJokeError('JokeAPI returned no joke text.')
  const flags = flagNames(d.flags)
  return [
    `JokeAPI ${d.category ?? match} (${d.type ?? 'twist'}, id ${d.id ?? 'not reported'})`,
    joke,
    `Flags set: ${flags.length ? flags.join(', ') : 'none'}`,
  ].join('\n')
}

export async function chuckFact(args: { category?: string }): Promise<string> {
  const key = (args.category ?? '').trim().toLowerCase()
  let url = CHUCK
  if (key) {
    if (!CHUCK_CATEGORIES.includes(key as (typeof CHUCK_CATEGORIES)[number])) {
      throw new DadJokeError(`"${args.category}" is not a Chuck Norris category. Use one of ${CHUCK_CATEGORIES.join(', ')}.`)
    }
    url += `?category=${encodeURIComponent(key)}`
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'dadjoke-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new DadJokeError(`Chuck Norris API returned ${res.status}`)
  const d = (await res.json()) as ChuckJoke
  if (!d.value) throw new DadJokeError('The Chuck Norris API returned no joke.')
  return [
    `Chuck Norris fact (id ${d.id ?? 'not reported'})`,
    d.value,
    `Categories: ${d.categories?.length ? d.categories.join(', ') : 'not reported'}`,
    `Recorded: ${(d.created_at ?? '').slice(0, 10) || 'not reported'}`,
  ].join('\n')
}

export async function comicStrip(args: { number?: number }): Promise<string> {
  const raw = args.number
  if (raw === undefined || raw === null || !Number.isFinite(Number(raw))) {
    const res = await fetch('https://xkcd.com/info.0.json', {
      headers: { 'User-Agent': 'dadjoke-mcp/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new DadJokeError(`xkcd returned ${res.status}`)
    const d = (await res.json()) as { num?: number; title?: string; alt?: string; img?: string; news?: string }
    if (!d.num) throw new DadJokeError('xkcd did not report a comic number.')
    return [`Latest xkcd #${d.num}: ${d.title ?? 'untitled'}`, d.alt ?? 'no alt text reported', d.img ?? ''].filter(Boolean).join('\n')
  }
  const num = Math.max(1, Math.min(Math.trunc(Number(raw)), 4000))
  const res = await fetch(`https://xkcd.com/${num}/info.0.json`, {
    headers: { 'User-Agent': 'dadjoke-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new DadJokeError(`xkcd has no comic #${num}.`)
  if (!res.ok) throw new DadJokeError(`xkcd returned ${res.status}`)
  const d = (await res.json()) as { num?: number; title?: string; alt?: string; img?: string; transcript?: string; news?: string }
  if (!d.num) throw new DadJokeError(`xkcd returned no comic data for #${num}.`)
  const alt = (d.alt ?? '').slice(0, 700)
  return [
    `xkcd #${d.num}: ${d.title ?? 'untitled'}`,
    `Image: ${d.img ?? 'not reported'}`,
    `Alt text: ${alt || 'not reported'}`,
  ].join('\n')
}
