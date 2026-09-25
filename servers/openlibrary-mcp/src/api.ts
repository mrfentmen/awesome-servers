export class OpenLibraryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenLibraryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://openlibrary.org";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new OpenLibraryError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OpenLibraryError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

async function get(path: string): Promise<string> {
  return req(path, {});
}

export function searchBooks(query: string, limit?: string): Promise<string> {
  const p = new URLSearchParams({ q: query, limit: limit ?? "10" });
  return get(`/search.json?${p.toString()}`).then((t) => pick(t));
}

export function getWork(workId: string): Promise<string> {
  const id = workId.startsWith("/works/") ? workId : `/works/${workId}`;
  return get(`${id}.json`);
}

export function getAuthor(authorId: string): Promise<string> {
  const id = authorId.startsWith("/authors/") ? authorId : `/authors/${authorId}`;
  return req(`${id}.json`, {});
}

interface BookHit {
  title?: unknown;
  author_name?: unknown;
  first_publish_year?: unknown;
  key?: unknown;
  cover_i?: unknown;
}

function pick(text: string): string {
  try {
    const d = JSON.parse(text) as { numFound?: unknown; docs?: unknown };
    const docs = Array.isArray(d.docs) ? (d.docs as Record<string, unknown>[]) : [];
    const slim: BookHit[] = docs.slice(0, 25).map((b) => ({
      title: b.title,
      author_name: b.author_name,
      first_publish_year: b.first_publish_year,
      key: b.key,
      cover_i: b.cover_i,
    }));
    return JSON.stringify({ numFound: d.numFound, docs: slim }, null, 2);
  } catch {
    return text.slice(0, 4000);
  }
}
