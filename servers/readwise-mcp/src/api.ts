export class ReadwiseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReadwiseError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.READWISE_TOKEN;
  if (!k) throw new ReadwiseError("Set READWISE_TOKEN (Readwise access token).");
  return { ...UA, Accept: "application/json", Authorization: `Token ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://readwise.io/api/v2" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ReadwiseError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ReadwiseError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function auth(): Promise<string> {
  return get("/auth/").then((t) => (t.trim() === "" ? "Authenticated (204)." : t.slice(0, 1000)));
}

export function listBooks(): Promise<string> {
  return get("/books/?page_size=20");
}

export function listHighlights(): Promise<string> {
  return get("/highlights/?page_size=10");
}

// ---- muxH tools:
// Readwise holds one person's highlights. These two reach the literature a
// reader is drawing them from: Crossref's public metadata, which carries real
// citation counts, and nothing about a specific account.

const CROSSREF = "https://api.crossref.org"
const RW_UA = "readwise-mcp/1.1 (https://github.com/mrfentmen/readwise-mcp)"

interface CrossrefWork {
  DOI?: string
  title?: string[]
  author?: Array<{ given?: string; family?: string; name?: string; affiliation?: string[] }>
  issued?: { "date-parts"?: number[][] }
  "container-title"?: string[]
  publisher?: string
  type?: string
  "is-referenced-by-count"?: number
  "reference-count"?: number
  page?: string
  volume?: string
  issue?: string
  ISSN?: string[]
  URL?: string
  subject?: string[]
}

interface CrossrefResponse {
  message?: { items?: CrossrefWork[]; "total-results"?: number; "items-per-page"?: number }
}

// Crossref rejects `select` for reference-count, so it is read from the
// per-work record in paperReferences instead of being selected here.
const SELECT = "DOI,title,author,issued,container-title,publisher,type,is-referenced-by-count,page,volume,issue,ISSN,URL,subject"

async function crossref(path: string, label: string): Promise<CrossrefResponse> {
  const res = await fetch(`${CROSSREF}${path}`, {
    headers: { Accept: "application/json", "User-Agent": RW_UA },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 400) throw new ReadwiseError(`Crossref rejected the ${label} query.`)
  if (res.status === 429) throw new ReadwiseError("Crossref rate-limited this host. Try again shortly.")
  if (!res.ok) throw new ReadwiseError(`Crossref error ${res.status}: ${res.statusText}`)
  return (await res.json()) as CrossrefResponse
}

const names = (work: CrossrefWork): string => {
  if (work.author?.length) {
    return work.author.slice(0, 4).map((a) => a.family ? `${a.family}${a.given ? `, ${a.given}` : ""}` : String(a.name ?? "?")).join("; ")
  }
  return "no author recorded"
}

const yearOf = (work: CrossrefWork): string => {
  const parts = work.issued?.["date-parts"]?.[0]
  return parts?.[0] ? String(parts[0]) : "not reported"
}

const cleanDoi = (input: string): string => (input ?? "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "")

/**
 * The published literature behind a topic, ranked by how much it has actually
 * been cited, with the venue, the DOI and the reference count. This is the
 * search a reader wants before deciding what to highlight.
 */
export async function paperSearch(args: { query: string; limit?: number; fromYear?: number }): Promise<string> {
  const query = (args.query ?? "").trim()
  if (query.length < 3) throw new ReadwiseError("Give a search phrase of at least three characters.")
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 25)
  const fromYear = Math.min(Math.max(Math.trunc(args.fromYear ?? 0), 0), 2100)

  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: String(size),
    sort: "is-referenced-by-count",
    order: "desc",
    select: SELECT,
  })
  if (fromYear > 0) {
    params.set("filter", `from-pub-date:${fromYear}-01-01`)
  }
  const data = await crossref(`/works?${params}`, "search")
  const items = data.message?.items ?? []
  if (!items.length) {
    throw new ReadwiseError(`Crossref holds no work matching "${query}"${fromYear ? ` published since ${fromYear}` : ""}.`)
  }

  const total = data.message?.["total-results"]
  const types = new Map<string, number>()
  for (const work of items) {
    const type = String(work.type ?? "not reported")
    types.set(type, (types.get(type) ?? 0) + 1)
  }
  const cited = items.map((w) => w["is-referenced-by-count"] ?? 0)

  return [
    `Literature search: "${query}"${fromYear ? `, published ${fromYear} or later` : ""}`,
    `  ${total?.toLocaleString() ?? "an unknown number of"} works match in Crossref, showing the ${items.length} most cited`,
    `  citation counts on this page: ${Math.min(...cited).toLocaleString()} to ${Math.max(...cited).toLocaleString()}`,
    `  types: ${[...types.entries()].map(([t, n]) => `${t} x${n}`).join(", ")}`,
    "",
    ...items.map((work, i) =>
      [
        `${String(i + 1).padStart(2)}. ${(work.title?.[0] ?? "untitled").slice(0, 90)}`,
        `    ${names(work).slice(0, 80)} — ${yearOf(work)}`,
        `    ${(work["container-title"]?.[0] ?? "no venue recorded").slice(0, 60)}${work.publisher ? `, ${String(work.publisher).slice(0, 30)}` : ""}${work.volume ? `, vol ${work.volume}` : ""}`,
        `    cited ${(work["is-referenced-by-count"] ?? 0).toLocaleString()} time(s) | ${work.DOI ? `https://doi.org/${work.DOI}` : "no DOI recorded"}`,
      ].join("\n")
    ),
    "",
    "Source: Crossref, the DOI registration agency. Citation counts are Crossref's own, which undercount older papers and never count non-DOI sources.",
  ].join("\n")
}

/**
 * One paper's reference list and how far it has been cited, which is the part of
 * a paper a reader reads to decide whether the citation is load-bearing.
 */
export async function paperReferences(args: { doi: string; limit?: number }) : Promise<string> {
  const doi = cleanDoi(args.doi ?? "")
  if (!doi || !/^10\.\d{4,9}\/\S+$/.test(doi)) {
    throw new ReadwiseError(`"${args.doi}" does not look like a DOI. Those look like 10.1109/cvpr.2016.91, and a doi.org URL is fine.`)
  }
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 20), 1), 50)

  const res = await fetch(`${CROSSREF}/works/${encodeURIComponent(doi)}`, {
    headers: { Accept: "application/json", "User-Agent": RW_UA },
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 404) throw new ReadwiseError(`Crossref has no record for DOI ${doi}.`)
  if (!res.ok) throw new ReadwiseError(`Crossref error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as { message?: CrossrefWork & { reference?: Array<{ "article-title"?: string; unstructured?: string; DOI?: string; year?: string; "journal-title"?: string; author?: string }> } }
  const work = body.message
  if (!work) throw new ReadwiseError(`Crossref returned an empty record for ${doi}.`)

  const references = work.reference ?? []
  const withDoi = references.filter((r) => r.DOI)
  const withTitle = references.filter((r) => r["article-title"] || r.unstructured)
  const years = references.map((r) => Number(r.year ?? NaN)).filter((n) => Number.isFinite(n))
  const shown = references.slice(0, size)

  return [
    `${work.title?.[0] ?? "untitled"}`,
    `  DOI ${doi} | cited ${(work["is-referenced-by-count"] ?? 0).toLocaleString()} time(s) by other Crossref-registered work`,
    `  ${names(work).slice(0, 100)} — ${yearOf(work)}`,
    `  published in ${work["container-title"]?.[0] ?? "no venue recorded"}${work.publisher ? ` by ${String(work.publisher)}` : ""}`,
    years.length ? `  references span ${Math.min(...years)} to ${Math.max(...years)}` : "  reference years are not recorded in this deposit",
    "",
    `  reference list (${references.length} entries${work["reference-count"] ? `, the deposit declares ${work["reference-count"]}` : ""}):`,
    ...(shown.length
      ? shown.map((reference, i) => {
          const label = String(reference["article-title"] ?? reference.unstructured ?? "").replace(/\s+/g, " ").trim()
          return `  ${String(i + 1).padStart(2)}. ${label ? label.slice(0, 90) : `no title recorded (${reference.DOI ? `DOI ${reference.DOI}` : "unstructured entry"})`}${reference.year ? ` (${reference.year})` : ""}`
        })
      : ["  the deposit carries no reference list, which is common for older or metadata-poor records"]),
    references.length > shown.length ? `  (+${references.length - shown.length} more)` : "",
    "",
    `  ${withDoi.length} of ${references.length} references carry their own DOI and ${withTitle.length} carry a machine-readable title.`,
    "Source: Crossref. Reference lists are exactly as the depositing publisher submitted them, so gaps are common.",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
