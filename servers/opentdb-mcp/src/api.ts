export class TriviaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TriviaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://opentdb.com" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TriviaError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TriviaError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listCategories(): Promise<string> {
  return get("/api_category.php");
}

export function getCount(category: string): Promise<string> {
  return get(`/api_count.php?category=${encodeURIComponent(category)}`);
}

export function getQuestions(amount?: string, category?: string, difficulty?: string): Promise<string> {
  const n = Math.min(Number(amount ?? 5) || 5, 20);
  let q = `/api.php?amount=${n}`;
  if (category) q += `&category=${encodeURIComponent(category)}`;
  if (difficulty) q += `&difficulty=${encodeURIComponent(difficulty)}`;
  return get(q);
}

