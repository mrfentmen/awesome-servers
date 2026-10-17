successfully downloaded text file (SHA: 726d49028ecb309609dfd0ad33d3c8d1093ae92d)
const UA = "mrfentmen-affirmations-mcp/1.0 (https://github.com/mrfentmen)"

export class AffirmationError extends Error {}

async function one(): Promise<string> {
  const res = await fetch("https://www.affirmations.dev/", { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new AffirmationError(`Affirmations API returned HTTP ${res.status}`)
  const d = (await res.json()) as { affirmation?: string }
  return d.affirmation ?? "Keep going"
}

export async function random(_args?: unknown): Promise<string> {
  return one()
}

export async function many(args: { count?: number }): Promise<string> {
  const count = Math.min(args.count ?? 3, 10)
  const seen = new Set<string>()
  while (seen.size < count) {
    seen.add(await one())
  }
  return [...seen].map((a, i) => `${i + 1}. ${a}`).join("\n")
}

// ---- gap2a tools:

const ADVICE_BASE = 'https://api.adviceslip.com/advice';

export interface SlipIdArgs {
  id: number;
}

export interface SlipSearchArgs {
  term: string;
  limit?: number;
}

interface AdviceResponse {
  slip?: { id?: number; advice?: string };
  message?: { type?: string; text?: string };
}

interface SlipSearchResponse {
  total_results?: string;
  query?: string;
  slips?: Array<{ id?: number; advice?: string; date?: string }>;
  message?: { type?: string; text?: string };
}

async function getJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 429) throw new Error(`${what} is rate limiting this client, try again shortly`);
  if (!res.ok) throw new Error(`${what} returned ${res.status}`);
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(`${what} returned a body that is not JSON`);
  }
}

export async function randomAdvice(_args: Record<string, never> = {}): Promise<string> {
  const d = await getJson<AdviceResponse>(ADVICE_BASE, 'Advice Slip');
  const slip = d.slip;
  if (!slip?.advice) {
    return `Advice Slip returned no advice: ${d.message?.text ?? 'no reason reported'}`;
  }
  return [
    `Advice slip ${slip.id ?? 'with no id reported'} from Advice Slip:`,
    slip.advice,
    slip.id !== undefined ? `Read it again with advice_by_id using id ${slip.id}.` : '',
  ].filter(Boolean).join('\n');
}

export async function adviceById(args: SlipIdArgs): Promise<string> {
  // The service answers a non-numeric id with a 500, so the shape is checked
  // here rather than passed on.
  const id = Math.round(Number(args.id));
  if (!Number.isFinite(id) || id < 1) throw new Error('Give a positive advice slip id.');
  const d = await getJson<AdviceResponse>(`${ADVICE_BASE}/${id}`, 'Advice Slip');
  if (d.message?.text) throw new Error(`Advice Slip has no slip ${id}: ${d.message.text}`);
  const slip = d.slip;
  if (!slip?.advice) return `Advice Slip returned no advice for slip ${id}.`;
  return [`Advice slip ${slip.id ?? id}:`, slip.advice].join('\n');
}



export async function quoteOfTheDay(): Promise<string> {
  const res = await fetch('https://zenquotes.io/api/today', {
    headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('ZenQuotes returned ' + res.status);
  const data = (await res.json()) as Array<{ q: string; a: string; h?: string }>;
  const q = data?.[0];
  if (!q) return 'No quote of the day available.';
  return 'Quote of the day: "' + q.q + '" — ' + q.a;
}

export async function adviceSearch(args: { query: string; limit?: number }): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a search term.';
  const res = await fetch('https://api.adviceslip.com/advice/search/' + encodeURIComponent(query), {
    headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('Advice Slip returned ' + res.status);
  const data = (await res.json()) as { total_results?: string; slips?: Array<{ id: number; advice: string; date?: string }> };
  const slips = data.slips ?? [];
  if (!slips.length) return 'No advice found for "' + query + '".';
  const lines = ['Advice Slip search for "' + query + '", ' + (data.total_results ?? slips.length) + ' result(s):', ''];
  for (const s of slips) {
    lines.push('• [' + s.id + '] ' + s.advice + (s.date ? ' (' + s.date + ')' : ''));
  }
  return lines.join('\n');
}
