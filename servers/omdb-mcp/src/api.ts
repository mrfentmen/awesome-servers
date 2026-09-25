export class OmdbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OmdbError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://www.omdbapi.com";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new OmdbError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OmdbError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function key(): string {
  const k = process.env.OMDB_API_KEY;
  if (!k) throw new OmdbError("Set OMDB_API_KEY (free at omdbapi.com/apikey.aspx, 1,000 req/day).");
  return k;
}

function check(text: string): Record<string, unknown> {
  const d = JSON.parse(text) as Record<string, unknown>;
  if (d.Response === "False") throw new OmdbError(`OMDb: ${String(d.Error ?? "unknown error").slice(0, 200)}`);
  return d;
}

export function searchMovies(query: string, page?: string): Promise<string> {
  return req(`/?apikey=${encodeURIComponent(key())}&s=${encodeURIComponent(query)}&page=${encodeURIComponent(page ?? "1")}`, {}).then((t) => {
    const d = check(t);
    return JSON.stringify({ totalResults: d.totalResults ?? null, results: d.Search ?? [] }, null, 2);
  });
}

export function getMovie(idOrTitle: string): Promise<string> {
  const byId = /^(tt\d+)$/.test(idOrTitle.trim());
  const q = byId ? `i=${encodeURIComponent(idOrTitle.trim())}` : `t=${encodeURIComponent(idOrTitle.trim())}`;
  return req(`/?apikey=${encodeURIComponent(key())}&${q}&plot=full`, {}).then((t) =>
    JSON.stringify(check(t), null, 2));
}

