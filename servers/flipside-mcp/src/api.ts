export class FlipsideError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FlipsideError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function apiKey(): string {
  const k = process.env.FLIPSIDE_API_KEY
  if (!k) throw new FlipsideError("Set the FLIPSIDE_API_KEY environment variable.")
  return k
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new FlipsideError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function createQuery(sql: string, dataSource?: string, dataProvider?: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries`;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key }, body: JSON.stringify({ sql, dataSource, dataProvider }) });
  return pretty(data);
}

export async function getQueryStatus(token: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries/${encodeURIComponent(String(token))}`;
  const data = await req(url, { headers: { "x-api-key": key } });
  return pretty(data);
}

export async function getQueryResults(token: string, pageNumber?: number, pageSize?: number): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries/${encodeURIComponent(String(token))}/results`;
  const qs = new URLSearchParams();
  if (pageNumber !== undefined) qs.append("pageNumber", String(pageNumber));
  if (pageSize !== undefined) qs.append("pageSize", String(pageSize));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "x-api-key": key } });
  return pretty(data);
}

export async function cancelQuery(token: string): Promise<string> {
  const key = apiKey()
  let url = `https://api.flipsidecrypto.com/api/v2/queries/${encodeURIComponent(String(token))}`;
  const data = await req(url, { method: "DELETE", headers: { "x-api-key": key } });
  return pretty(data);
}

// ---- muxD tools:

/**
 * Flipside's API host answers every request from a non-browser client with a
 * Cloudflare HTML 403, including a fabricated route, so there is no routing
 * signal at all and nothing here could be verified live. The existing four tools
 * work against /api/v2/queries; the three added here use the documented v2
 * metadata and saved-query routes.
 *
 * The saved-query library is the reason this is worth adding. The existing
 * create_query runs whatever SQL the caller supplies, which means the caller has
 * to already know Flipside's table and column names, their types, and which
 * chain each table lives on. Flipside publishes a library of expert-written
 * queries and a metadata API for exactly those two problems, and the server
 * reached neither.
 */

const FLIP = "https://api.flipsidecrypto.com/api/v2"

async function flipGet<T>(path: string, timeout = 30000): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${FLIP}${path}`, {
      headers: { ...UA, Accept: "application/json", "x-api-key": apiKey() },
      signal: AbortSignal.timeout(timeout),
    })
  } catch (e) {
    throw new FlipsideError(`Network error: ${(e as Error).message}`)
  }
  const body = await res.text()
  if (!res.ok) {
    let detail = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
    try {
      const j = JSON.parse(body)
      detail = j?.message ?? j?.error ?? detail
    } catch { /* keep the stripped HTML text */ }
    const hint =
      /cloudflare|just a moment|attention required|enable javascript/i.test(body)
        ? " This is a Cloudflare challenge page rather than an API error. Flipside blocks non-browser clients, so the call never reached the API and nothing can be concluded about the query."
        : res.status === 401 || res.status === 403
          ? " A 403 from Flipside is normally a bad or exhausted API key rather than a missing endpoint."
          : ""
    throw new FlipsideError(`HTTP ${res.status}: ${detail || "(empty body)"}${hint}`)
  }
  try {
    return JSON.parse(body) as T
  } catch {
    throw new FlipsideError("Flipside returned a body that is not JSON.")
  }
}

const asArray = (v: unknown): any[] => (Array.isArray(v) ? v : [])
const asText = (v: unknown): string => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v))

/** Flipside's saved-query list has appeared both as a flat array and as {categories}. */
function normaliseCategories(data: unknown): Array<{ category: string; queries: any[] }> {
  if (Array.isArray(data)) {
    return data.map((entry) => {
      if (entry && typeof entry === "object" && Array.isArray((entry as any).queries)) {
        return { category: String((entry as any).category ?? (entry as any).name ?? "?"), queries: (entry as any).queries }
      }
      return { category: String((entry as any)?.category ?? "?"), queries: [entry] }
    })
  }
  const d = data as any
  if (d && Array.isArray(d.categories)) {
    return d.categories.map((c: any) => (typeof c === "string" ? { category: c, queries: [] } : { category: String(c?.name ?? c?.category ?? "?"), queries: asArray(c?.queries) }))
  }
  if (d && typeof d === "object") {
    return Object.entries(d).map(([k, v]) => ({ category: k, queries: asArray(v) }))
  }
  return []
}

export interface SavedQueriesArgs {
  category?: string;
  search?: string;
  limit?: number;
}

/**
 * The library of queries Flipside publishes. Each one is a working piece of
 * analysis written by someone who knows the schema, which is the point: the
 * alternative is writing the SQL yourself against table names you have to
 * discover first.
 */
export async function savedQueries(args: SavedQueriesArgs): Promise<string> {
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 25) || 25, 1), 200)
  const wantCat = String(args.category ?? "").trim()
  const wantSearch = String(args.search ?? "").trim().toLowerCase()

  if (wantCat) {
    const enc = encodeURIComponent(wantCat.toLowerCase())
    let data: unknown
    try {
      data = await flipGet(`/queries/saved/${enc}`)
    } catch (e) {
      return [
        `Could not read the saved queries in category "${wantCat}": ${e instanceof Error ? e.message : String(e)}`,
        "",
        "Category names are lowercase slugs in Flipside's URLs, so a title-case name is the most common cause. The list of valid categories comes from saved_queries with no arguments.",
      ].join("\n")
    }
    const rows = asArray(data)
    if (!rows.length) {
      return `No saved query came back for category "${wantCat}". The category may be empty, or the name may be spelled differently; the full list is available from saved_queries with no arguments.`
    }
    return renderQueryList([{ category: wantCat, queries: rows }], limit, wantSearch)
  }

  const data = await flipGet<unknown>("/queries/saved")
  const cats = normaliseCategories(data)
  if (!cats.length) {
    return [
      "Flipside returned no saved-query categories.",
      "",
      "The response was not in a shape this tool recognises. The library is curated and can change, and Flipside has returned it both as a flat array and as a categories object, so an unrecognised body is a real possibility rather than proof the library is empty.",
    ].join("\n")
  }

  const total = cats.reduce((a, c) => a + c.queries.length, 0)
  const lines = [
    `Flipside saved queries: ${total} across ${cats.length} categor${cats.length === 1 ? "y" : "ies"}`,
    "",
    `${"queries".padEnd(9)}category`,
  ]
  for (const c of cats) lines.push(`${String(c.queries.length).padEnd(9)}${c.category}`)
  lines.push("", "Pass a category to list the queries in it, then run one by name with run_saved_query.")
  lines.push(
    "",
    "These are Flipside's own maintained queries. They are the reason to use this server without knowing the schema: each one is a piece of analysis written against a table layout that is not documented anywhere else. A saved query can still stop working when Flipside changes a table, and the error for that is a column-not-found rather than anything that identifies the query as out of date.",
  )
  if (wantSearch) lines.push("", `A search term was given but only applies when a category is also given; ${total} queries are listed above.`)
  return lines.join("\n")
}

function renderQueryList(cats: Array<{ category: string; queries: any[] }>, limit: number, search: string): string {
  const matches = search
    ? cats.flatMap((c) => c.queries.map((q) => ({ c: c.category, q })).filter(({ q }) => `${asText(q?.name)} ${asText(q?.description)}`.toLowerCase().includes(search)))
    : cats.flatMap((c) => c.queries.map((q) => ({ c: c.category, q })))

  if (!matches.length) {
    return search
      ? `No saved query in ${cats.map((c) => c.category).join(", ")} mentions "${search}".`
      : `No saved queries in ${cats.map((c) => c.category).join(", ")}.`
  }

  const lines = [`Saved queries${search ? ` mentioning "${search}"` : ""}: ${matches.length}`, ""]
  for (const { c, q } of matches.slice(0, limit)) {
    const name = asText(q?.name)
    lines.push(`${name}`)
    lines.push(`  category: ${c}`)
    const desc = asText(q?.description).replace(/\s+/g, " ").trim()
    if (desc) lines.push(`  ${desc.slice(0, 220)}`)
    // The name is the identifier, so it is quoted exactly: a saved query is run
    // by name and a normalised or truncated version will not resolve.
    lines.push(`  run with: run_saved_query query_name "${name}"`)
    lines.push("")
  }
  if (matches.length > limit) lines.push(`...and ${matches.length - limit} more; raise limit to see them.`)
  return lines.join("\n").trimEnd()
}

export interface RunSavedQueryArgs {
  query_name: string;
  data_source?: string;
  data_provider?: string;
  limit?: number;
}

/** Runs one of Flipside's saved queries by name, which is the whole point of the library. */
export async function runSavedQuery(args: RunSavedQueryArgs): Promise<string> {
  const name = String(args.query_name ?? "").trim()
  if (!name) throw new FlipsideError("Provide the saved query name exactly as Flipside lists it; the name is the identifier and it is not normalised.")
  const enc = encodeURIComponent(name.toLowerCase())
  const body: Record<string, unknown> = {}
  if (args.data_source !== undefined) body.dataSource = args.data_source
  if (args.data_provider !== undefined) body.dataProvider = args.data_provider

  let res: Response
  try {
    res = await fetch(`${FLIP}/queries/saved/${enc}/run`, {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", "x-api-key": apiKey() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    throw new FlipsideError(`Network error: ${(e as Error).message}`)
  }
  const raw = await res.text()
  if (!res.ok) {
    let detail = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
    try {
      const j = JSON.parse(raw)
      detail = j?.message ?? j?.error ?? detail
    } catch { /* keep stripped text */ }
    const hint = /cloudflare|just a moment/i.test(raw)
      ? " This is a Cloudflare challenge page, so the call never reached Flipside."
      : /not found/i.test(detail)
        ? " A not-found on a saved query usually means the name is not exactly right. Flipside matches on the lowercased name it publishes, so a title-cased or reworded name will not resolve."
        : ""
    throw new FlipsideError(`HTTP ${res.status}: ${detail || "(empty body)"}${hint}`)
  }

  let data: any
  try {
    data = JSON.parse(raw)
  } catch {
    throw new FlipsideError("Flipside returned a non-JSON body for the saved query run.")
  }

  const requestId = data?.requestId ?? data?.request_id
  const queryId = data?.queryId ?? data?.query_id
  const lines = [
    `Saved query run accepted: ${name}`,
    `requestId: ${requestId ?? "not returned"}${queryId ? `  |  queryId: ${queryId}` : ""}`,
    "",
  ]
  if (requestId) {
    lines.push(
      `A saved query runs asynchronously, exactly like create_query, so nothing is returned yet. Poll it with get_query_status using requestId ${requestId}, then fetch rows with get_query_results.`,
    )
  } else {
    lines.push("Flipside did not return a requestId, so there is no way to poll this run. Check the key and the query name.")
  }
  if (args.data_source || args.data_provider) {
    lines.push(`Run against dataSource ${args.data_source ?? "(query default)"} and dataProvider ${args.data_provider ?? "(query default)"}. Omitting these uses whatever the saved query was written for, which is usually right.`)
  }
  lines.push(
    "",
    "A saved query can fail for the same reason a hand-written one does: Flipside changes a table layout and the stored SQL stops resolving. The failure then looks like an ordinary SQL error rather than an out-of-date query, so a saved query is a starting point rather than a permanent answer.",
  )
  return lines.join("\n")
}

export interface TableSchemaArgs {
  data_source: string;
  table?: string;
  search?: string;
}

/**
 * The metadata API: the table list for a chain, or the column layout of one
 * table. This is the missing prerequisite for every other tool here, because
 * create_query needs SQL written against column names that are documented
 * nowhere else.
 */
export async function tableSchema(args: TableSchemaArgs): Promise<string> {
  const ds = String(args.data_source ?? "").trim().toLowerCase()
  if (!ds) {
    throw new FlipsideError(
      "Provide a data source, which is Flipside's name for a chain: ethereum, solana, base, arbitrum, polygon, bsc, avalanche and so on. The name is case-insensitive and is not the same as a chain id.",
    )
  }
  const table = String(args.table ?? "").trim()
  const search = String(args.search ?? "").trim().toLowerCase()

  if (table) {
    const data = await flipGet<any>(`/metadata/table/${encodeURIComponent(ds)}/${encodeURIComponent(table)}`)
    const cols = asArray(data)
    if (!cols.length) {
      return [
        `No column information came back for ${ds}.${table}.`,
        "",
        "That means the table was not found on this data source under that name. Flipside's table names differ between chains, so a table that exists on ethereum may not exist on base at all, and the same logical data can have different names on each. List the tables for this data source with table_schema and no table argument to see what is actually there.",
      ].join("\n")
    }
    const lines = [
      `${ds}.${table}: ${cols.length} column(s)`,
      "",
      `${"#".padStart(3)}  ${"column".padEnd(42)}${"type".padEnd(16)}description`,
    ]
    const ordered = [...cols].sort((a, b) => (Number(a?.position ?? 999) - Number(b?.position ?? 999)))
    for (const [i, c] of ordered.slice(0, 80).entries()) {
      const name = asText(c?.columnName ?? c?.name)
      const type = asText(c?.dataType ?? c?.type)
      const desc = asText(c?.columnDescription ?? c?.description).replace(/\s+/g, " ").trim()
      lines.push(`${String(i + 1).padStart(3)}  ${name.slice(0, 41).padEnd(42)}${type.slice(0, 15).padEnd(16)}${desc.slice(0, 90)}`)
    }
    if (ordered.length > 80) lines.push(`    ...and ${ordered.length - 80} more columns`)
    lines.push("", "Column order comes from Flipside's own position field, which is the order it intends for a select * to return and the order the documentation examples assume.")
    return lines.join("\n")
  }

  const data = await flipGet<any>(`/metadata/tables?dataSource=${encodeURIComponent(ds)}`)
  const tables = asArray(data).map((t) => asText(t)).filter(Boolean)
  if (!tables.length) {
    return [
      `Flipside returned no tables for data source "${ds}".`,
      "",
      "Either the data source name is wrong, or it carries no tables on your plan. Flipside's data source names are its own: 'ethereum' and 'eth' are not interchangeable, and a chain is often exposed under a name that does not match its chain id or its common abbreviation.",
    ].join("\n")
  }

  const filtered = search ? tables.filter((t) => t.toLowerCase().includes(search)) : tables
  const lines = [
    `Tables on ${ds}: ${filtered.length}${search ? ` matching "${search}"` : ` of ${tables.length}`}`,
    "",
  ]
  for (const t of filtered.slice(0, 150)) lines.push(`  ${t}`)
  if (filtered.length > 150) lines.push(`  ...and ${filtered.length - 150} more; raise the limit is not available here, so narrow with search`)
  lines.push(
    "",
    `Pass one of these names as the table argument to see its columns. Table names are chain-specific: the same logical data is often named differently per chain, and a query written against ethereum will not run on base without rewriting the table name.`,
  )
  return lines.join("\n")
}
