const m0 = (() => {
const BASE = 'https://uselessfacts.jsph.pl/api/v2/facts';

async function fact(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/random`, {
    headers: { 'User-Agent': 'mrfentmen-uselessfacts-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Useless Facts returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  return `Useless fact: ${String(d.text ?? 'no fact')}`;
}

return { fact };
})();

const m1 = (() => {
const BASE = "https://uselessfacts.jsph.pl/api/v2/facts"
const UA = "mrfentmen-facts-mcp/1.0 (https://github.com/mrfentmen)"
class FactsError extends Error {}

async function randomFact(args: Record<string, never>): Promise<string> {
  const res = await fetch(`${BASE}/random`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new FactsError("UselessFacts rate limit hit, wait and retry")
  if (!res.ok) throw new FactsError(`UselessFacts error ${res.status}`)
  const d = (await res.json()) as any
  return d?.text ?? "No fact returned"
}

return { FactsError, randomFact };
})();

export const FactsError = m1.FactsError;
export const fact = m0.fact;
export const randomFact = m1.randomFact;
export const m0_fact = m0.fact;
export const m1_FactsError = m1.FactsError;
export const m1_randomFact = m1.randomFact;

// ---- muxC tools:

const FACTS_BASE = "https://uselessfacts.jsph.pl/api/v2/facts"
const FACTS_UA = "mrfentmen-uselessfacts-mcp/1.0"

class FactsLookupError extends Error {}

/**
 * The daily fact is a different endpoint from the random one and changes once a
 * day, so a caller can cite a fact that will still be the same tomorrow.
 */
export async function dailyFact(): Promise<string> {
  const res = await fetch(`${FACTS_BASE}/today`, {
    headers: { "User-Agent": FACTS_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 429) throw new FactsLookupError("UselessFacts rate limit hit, wait and retry")
  if (!res.ok) throw new FactsLookupError(`UselessFacts returned ${res.status}`)
  const d = (await res.json()) as { id?: string; text?: string; source?: string; source_url?: string; language?: string; permalink?: string }
  if (!d.text) throw new FactsLookupError("UselessFacts returned no text for today's fact")
  return [
    `Useless fact of the day:`,
    d.text,
    `Source: ${d.source ?? "not reported"}${d.source_url ? ` - ${d.source_url}` : ""}`,
    `Language: ${d.language ?? "not reported"}${d.permalink ? ` | ${d.permalink}` : ""}`,
  ].join("\n")
}
