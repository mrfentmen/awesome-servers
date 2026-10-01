import { randomInt } from "node:crypto"

const UA = "mrfentmen-rng-mcp/1.0"
export class RngError extends Error {}

export async function rollDice(args: { count?: number; sides?: number }): Promise<string> {
  const count = Math.min(Math.max(args.count ?? 1, 1), 20)
  const sides = Math.min(Math.max(args.sides ?? 6, 2), 100)
  const rolls = Array.from({ length: count }, () => randomInt(1, sides + 1))
  const total = rolls.reduce((a, b) => a + b, 0)
  return `Rolled ${count}d${sides}: [${rolls.join(", ")}]\nTotal: ${total}`
}

export async function coinFlip(args: Record<string, never>): Promise<string> {
  const side = randomInt(0, 2) === 0 ? "heads" : "tails"
  return `Coin flip: ${side}`
}

export async function randomNumber(args: { min?: number; max?: number }): Promise<string> {
  const min = Math.round(args.min ?? 0)
  const max = Math.round(args.max ?? 100)
  if (min > max) throw new RngError("Min must be less than or equal to max")
  const n = randomInt(min, max + 1)
  return `Random integer between ${min} and ${max}: ${n}`
}

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

export async function randomFact(args: RandomFactArgs): Promise<string> {
  const language = (args.language ?? "en").trim() || "en"
  const d = await rngGet<{ id?: string; text?: string; source?: string; source_url?: string; language?: string; permalink?: string; error?: string }>(
    `https://uselessfacts.jsph.pl/api/v2/facts/random?language=${encodeURIComponent(language)}`,
  )
  if (d?.error) throw new RngError(`Useless Facts API said: ${d.error}`)
  if (!rngText(d?.text) || rngText(d.text) === "not reported") throw new RngError("Useless Facts API returned no fact text")
  return [
    `Random fact (${rngText(d.language)}):`,
    `   ${rngText(d.text)}`,
    `   source: ${rngText(d.source)}`,
    `   source URL: ${rngText(d.source_url)}`,
    `   permalink: ${rngText(d.permalink)}`,
    `   fact id: ${rngText(d.id)}`,
  ].join("\n")
}

export interface RandomAdviceArgs {}

export async function randomAdvice(_args: RandomAdviceArgs): Promise<string> {
  const d = await rngGet<{ slip?: { id?: number; advice?: string }; message?: string }>(
    "https://api.adviceslip.com/advice",
  )
  if (d?.message) throw new RngError(`Advice Slip API said: ${d.message}`)
  const advice = rngText(d?.slip?.advice)
  if (advice === "not reported") throw new RngError("Advice Slip API returned no advice text")
  return `Random advice (slip ${rngText(d?.slip?.id)}):\n   ${advice}`
}

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
