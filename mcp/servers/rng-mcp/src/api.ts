const UA = "mrfentmen-rng-mcp/1.0"
export class RngError extends Error {}

// ---- muxB tools:

async function rngGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "mrfentmen-rng-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 429) throw new RngError("That random source is rate limited, wait and retry")
  if (!res.ok) throw new RngError(`Random source returned ${res.status}`)
  return (await res.json()) as T
}

const rngText = (value: unknown): string =>
  value != null && String(value).trim() ? String(value).trim() : "not reported"

export interface RandomFactArgs {
  language?: string;
}

export interface RandomAdviceArgs {}

export interface RandomWordsArgs {
  count?: number;
  minLength?: number;
}

export async function randomWords(args: RandomWordsArgs): Promise<string> {
  const count = Math.max(1, Math.min(Number(args.count ?? 5) || 5, 25))
  const url = new URL("https://random-word-api.herokuapp.com/word")
  url.searchParams.set("number", String(count))
  if (args.minLength != null) url.searchParams.set("length", String(Math.max(1, Math.min(args.minLength, 30))))
  const d = await rngGet<string[]>(url.toString())
  if (!Array.isArray(d) || !d.length) throw new RngError("Random word API returned no words")
  return `Random words (${d.length} of ${count} requested):\n` + d.map((w, i) => `${i + 1}. ${rngText(w)}`).join("\n")
}
