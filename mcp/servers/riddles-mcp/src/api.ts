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

type WkSection = { line?: string }

// ---- gap4b2 tools:

async function puzzleWords(params: URLSearchParams): Promise<Array<{ word?: string; numSyllables?: number }>> {
  const res = await fetch(`https://api.datamuse.com/words?${params}`, {
    headers: { 'User-Agent': 'mrfentmen-riddles-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Datamuse returned ${res.status}`)
  return await res.json() as Array<{ word?: string; numSyllables?: number }>
}

export async function triviaCategories(_args: Record<string, never>): Promise<string> {
  const res = await fetch('https://opentdb.com/api_category.php', {
    headers: { 'User-Agent': 'mrfentmen-riddles-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Open Trivia DB returned ${res.status}`)
  const d = await res.json() as { trivia_categories?: Array<{ id?: number; name?: string }> }
  return 'Open Trivia DB categories:\n' + ((d.trivia_categories ?? []).slice(0, 50).map((row) => `${row.id ?? 'not reported'}: ${(row.name ?? 'not reported').slice(0, 120)}`).join('\n') || 'No categories returned.')
}
