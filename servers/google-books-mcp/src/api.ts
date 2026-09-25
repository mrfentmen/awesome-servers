export class GBooksError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GBooksError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://www.googleapis.com/books/v1";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new GBooksError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new GBooksError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function keyParams(): string {
  const k = process.env.GOOGLE_BOOKS_API_KEY;
  return k ? `&key=${encodeURIComponent(k)}` : "";
}

function slimVolume(v: Record<string, unknown>): Record<string, unknown> {
  const info = (v.volumeInfo ?? {}) as Record<string, unknown>;
  const img = (info.imageLinks ?? {}) as Record<string, unknown>;
  return { id: v.id, title: info.title, authors: info.authors, publishedDate: info.publishedDate,
    description: typeof info.description === "string" ? info.description.slice(0, 600) : null,
    pageCount: info.pageCount, categories: info.categories, language: info.language,
    thumbnail: img.thumbnail ?? null, infoLink: info.infoLink ?? null };
}

export function searchBooks(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 40);
  return req(`/volumes?q=${encodeURIComponent(query)}&maxResults=${n}${keyParams()}`, {}).then((t) => {
    const d = JSON.parse(t) as { totalItems?: number; items?: Record<string, unknown>[] };
    return JSON.stringify({ totalItems: d.totalItems ?? 0,
      volumes: ((d.items ?? []).map(slimVolume)) }, null, 2);
  });
}

export function getVolume(volumeId: string): Promise<string> {
  return req(`/volumes/${encodeURIComponent(volumeId)}?${keyParams().replace(/^&/, "")}`, {}).then((t) => {
    const v = JSON.parse(t) as Record<string, unknown>;
    if (v.error) throw new GBooksError(`API error: ${JSON.stringify(v.error).slice(0, 200)}`);
    return JSON.stringify(slimVolume(v), null, 2);
  });
}

