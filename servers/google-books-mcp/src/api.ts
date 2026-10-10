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
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
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

// ---- muxG tools:
const OL_BOOK = "https://openlibrary.org"
const OL_SEARCH = "https://openlibrary.org/search.json"

async function olJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { ...UA, Accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
  if (res.status === 404) throw new GBooksError("Open Library has no record there.");
  if (!res.ok) throw new GBooksError(`Open Library returned ${res.status}`);
  const body = await res.text();
  if (!body.trim()) throw new GBooksError("Open Library returned an empty body.");
  return JSON.parse(body) as T;
}

/** True when the ISBN-10 or ISBN-13 checksum works, so a typo is caught before any lookup. */
function isbnChecksum(input: string): { value: string; kind: string; valid: boolean } {
  const value = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (value.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      const digit = Number(value[i]);
      if (!Number.isFinite(digit)) return { value, kind: "ISBN-10", valid: false };
      sum += digit * (10 - i);
    }
    const check = value[9] === "X" ? 10 : Number(value[9]);
    return { value, kind: "ISBN-10", valid: (sum + check) % 11 === 0 };
  }
  if (value.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i += 1) {
      const digit = Number(value[i]);
      if (!Number.isFinite(digit)) return { value, kind: "ISBN-13", valid: false };
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const check = Number(value[12]);
    return { value, kind: "ISBN-13", valid: (sum + check) % 10 === 0 };
  }
  return { value, kind: "neither", valid: false };
}

export async function isbnLookup(isbn: string): Promise<string> {
  const raw = String(isbn ?? "").trim();
  if (!raw) throw new GBooksError("Provide an ISBN-10 or ISBN-13.");
  const checked = isbnChecksum(raw);
  if (checked.kind === "neither") {
    throw new GBooksError(`"${raw}" has ${raw.replace(/[^0-9Xx]/g, "").length} digits; an ISBN has 10 or 13.`);
  }
  const note = checked.valid
    ? `${checked.kind} checksum is valid`
    : `${checked.kind} checksum does NOT check out, so the identifier is probably mistyped`;

  const data = await olJson<Record<string, unknown>>(`${OL_BOOK}/isbn/${encodeURIComponent(checked.value)}.json`);
  // an edition record usually links authors by key, so render the key as a path
  const authors = Array.isArray(data.authors)
    ? (data.authors as Array<Record<string, unknown>>)
        .map((a) => {
          const key = typeof a.key === "string" ? a.key : "";
          if (key) return key.startsWith("/authors/") ? OL_BOOK + key : key;
          return typeof a.name === "string" ? a.name : "author not reported";
        })
        .join(", ")
    : null;
  const works = Array.isArray(data.works) && (data.works as unknown[]).length
    ? String((data.works as Array<Record<string, unknown>>)[0].key)
    : null;
  const covers = Array.isArray(data.covers) && (data.covers as unknown[]).length ? String((data.covers as unknown[])[0]) : null;
  const subjects = Array.isArray(data.subjects) ? (data.subjects as unknown[]).slice(0, 8).map(String) : [];

  const lines = [
    `${data.title ?? "title not reported"} — ${authors ?? "author not reported"}`,
    `${note}.`,
    `Edition: ${data.edition_name ?? "unnamed"}${data.publishers && (data.publishers as unknown[]).length ? ` · ${(data.publishers as unknown[]).join(", ")}` : ""}${data.publish_date ? ` · ${String(data.publish_date)}` : ""}`,
    `Pages: ${data.number_of_pages ?? "not reported"}${data.pagination ? ` (${String(data.pagination)})` : ""}${data.languages && (data.languages as unknown[]).length ? ` · language ${(data.languages as Array<Record<string, unknown>>).map((l) => l.key ?? "?").join(", ")}` : ""}`,
    `Dewey ${data.dewey_decimal_class ?? "not reported"}${data.lc_classifications && (data.lc_classifications as unknown[]).length ? ` · LC ${(data.lc_classifications as unknown[]).join(", ")}` : ""}`,
  ];
  if (subjects.length) lines.push(`Subjects: ${subjects.join("; ")}`)
  if (works) lines.push(`Work: ${OL_BOOK}${works}`)
  if (covers) lines.push(`Cover: ${OL_BOOK}/b/id/${covers}-L.jpg`)
  lines.push(`Open Library page: ${OL_BOOK}/isbn/${checked.value}`)
  return lines.join("\n")
}

interface OlDoc {
  key?: string
  title?: string
  author_name?: string[]
  first_publish_year?: number
  edition_count?: number
  ratings_average?: number
  ratings_count?: number
}

export async function authorWorks(args: { author: string; limit?: number }): Promise<string> {
  const name = String(args.author ?? "").trim()
  if (!name) throw new GBooksError("Provide an author name.")
  const n = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25)
  const fields = "key,title,author_name,first_publish_year,edition_count,ratings_average,ratings_count"
  const url = `${OL_SEARCH}?author=${encodeURIComponent(name)}&limit=${n}&fields=${encodeURIComponent(fields)}`
  const data = await olJson<{ numFound?: number; docs?: OlDoc[] }>(url)
  const docs = Array.isArray(data.docs) ? data.docs : []
  if (!docs.length) throw new GBooksError(`Open Library found no works for "${name}".`)
  const rated = docs.filter((d) => typeof d.ratings_average === "number" && typeof d.ratings_count === "number")
  const lines = [
    `"${name}" on Open Library: ${data.numFound ?? docs.length} work(s) match, showing ${docs.length}`,
  ]
  for (const [i, doc] of docs.entries()) {
    const average = typeof doc.ratings_average === "number" ? doc.ratings_average.toFixed(2) : "not reported"
    const count = typeof doc.ratings_count === "number" ? `${doc.ratings_count} rating(s)` : "no ratings"
    lines.push(`  ${i + 1}. ${doc.title ?? "title not reported"} — first published ${doc.first_publish_year ?? "not reported"} · ${doc.edition_count ?? 0} edition(s)`)
    lines.push(`     Open Library rating ${average} from ${count}${doc.key ? ` · ${OL_BOOK}${doc.key}` : ""}`)
  }
  if (rated.length) {
    const best = rated.reduce((a, b) => ((b.ratings_average ?? 0) > (a.ratings_average ?? 0) ? b : a))
    lines.push("")
    lines.push(`Best rated on this page: ${best.title ?? "title not reported"} at ${(best.ratings_average ?? 0).toFixed(2)} from ${best.ratings_count} rating(s).`)
  }
  return lines.join("\n")
}
