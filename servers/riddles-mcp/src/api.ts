const BASE = 'https://riddles-api.vercel.app/random';

export interface RandomArgs {
  // No arguments needed.
}

export async function random(_args: RandomArgs): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-riddles-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Riddles API returned ${res.status}`);
  const d = (await res.json()) as { riddle?: string; answer?: string };
  if (!d.riddle) return 'No riddle returned.';
  return `Riddle: ${d.riddle}\nAnswer: ${d.answer ?? '(hidden)'}`;
}

// ---- muxB tools:
const TRIVIA = 'https://opentdb.com/api.php';
const WIKTIONARY = 'https://en.wiktionary.org/w/api.php';
// Open Trivia DB only resolves categories by numeric id - passing the name back
// to it answers response_code 2 - so the friendly name is mapped to the id.
const CATEGORY_IDS: Record<string, number> = {
  'general knowledge': 9,
  books: 10,
  film: 11,
  music: 12,
  musicals: 13,
  television: 14,
  'video games': 15,
  'board games': 16,
  'science & nature': 17,
  computers: 18,
  mathematics: 19,
  mythology: 20,
  sports: 21,
  geography: 22,
  history: 23,
  politics: 24,
  art: 25,
  celebrities: 26,
  animals: 27,
  vehicles: 28,
  comics: 29,
  gadgets: 30,
  anime: 31,
  cartoons: 32,
};
const DIFFICULTIES = ['any', 'easy', 'medium', 'hard'] as const;
const TYPES = ['any', 'multiple', 'boolean'] as const;

const tr = (v: string | undefined): string => (v ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

type TriviaResult = {
  category?: string;
  type?: string;
  difficulty?: string;
  question?: string;
  correct_answer?: string;
  incorrect_answers?: string[];
}

export async function triviaQuestions(args: { amount?: number; category?: string; difficulty?: string; type?: string }): Promise<string> {
  const amount = Math.max(1, Math.min(Math.trunc(Number(args.amount ?? 5) || 5), 20))
  const pick = (raw: string | undefined, allowed: readonly string[], fallback: string, label: string): string => {
    const v = (raw ?? fallback).trim().toLowerCase()
    if (!(allowed as readonly string[]).includes(v)) throw new Error(`Unknown ${label} "${raw}". Use one of ${allowed.join(', ')}.`)
    return v
  }
  const categoryKey = (args.category ?? 'any').trim().toLowerCase()
  const known = ['any', ...Object.keys(CATEGORY_IDS)]
  if (!known.includes(categoryKey)) {
    throw new Error(`Unknown category "${args.category}". Use one of ${known.join(', ')}.`)
  }
  const categoryId = categoryKey === 'any' ? null : CATEGORY_IDS[categoryKey]
  const difficulty = pick(args.difficulty, DIFFICULTIES, 'any', 'difficulty')
  const type = pick(args.type, TYPES, 'any', 'type')
  const params = new URLSearchParams({ amount: String(amount) })
  if (categoryId !== null) params.set('category', String(categoryId))
  if (difficulty !== 'any') params.set('difficulty', difficulty)
  if (type !== 'any') params.set('type', type)
  const res = await fetch(`${TRIVIA}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-riddles-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Open Trivia DB returned ${res.status}`)
  const d = (await res.json()) as { response_code?: number; results?: TriviaResult[] }
  if (d.response_code !== 0) throw new Error(`Open Trivia DB response code ${d.response_code} (not enough questions for that combination).`)
  const results = d.results ?? []
  if (!results.length) throw new Error('Open Trivia DB returned no questions.')
  const blocks = results.map((r, i) => {
    const wrong = (r.incorrect_answers ?? []).map(tr).slice(0, 4)
    return [
      `${i + 1}. ${tr(r.question)}`,
      `   category ${r.category ?? 'not reported'} | difficulty ${r.difficulty ?? 'not reported'} | type ${r.type ?? 'not reported'}`,
      `   answer: ${tr(r.correct_answer) || 'not reported'}`,
      wrong.length ? `   distractors: ${wrong.join(' | ')}` : '   distractors: not reported',
    ].join('\n')
  })
  return `Trivia questions from Open Trivia DB (${results.length} returned):\n${blocks.join('\n\n')}`
}

type WkSection = { line?: string }

export async function wordEntry(args: { word: string }): Promise<string> {
  const word = (args.word ?? '').trim().replace(/\s+/g, '_')
  if (!word) throw new Error('Provide a word to look up.')
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    explaintext: '1',
    format: 'json',
    redirects: '1',
    titles: word,
  })
  const res = await fetch(`${WIKTIONARY}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-riddles-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Wiktionary returned ${res.status}`)
  const d = (await res.json()) as { query?: { pages?: Record<string, { title?: string; extract?: string; missing?: string }> } }
  const pages = Object.values(d.query?.pages ?? {})
  const page = pages[0]
  if (!page || page.missing !== undefined) throw new Error(`Wiktionary has no entry for "${word}".`)
  const body = (page.extract ?? '').replace(/\n{2,}/g, '\n').trim()
  if (!body) throw new Error(`The Wiktionary entry for ${page.title ?? word} came back empty.`)
  const sections = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.length > 2)
  const keep = sections
    .slice(0, 25)
    .map((l) => l.replace(/^=+\s*|\s*=+$/g, '').replace(/'''?/g, '').replace(/^\*\s*/, '').trim())
    .filter(Boolean)
    .map((l) => (l.length > 200 ? `${l.slice(0, 200)}...` : l))
  return `Wiktionary entry for ${page.title ?? word}:\n${keep.join('\n')}`
}
