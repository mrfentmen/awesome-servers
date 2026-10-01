/**
 * Hasura metadata/query API client. Points at any instance via HASURA_URL
 * (default http://localhost:8080). Admin calls need HASURA_ADMIN_SECRET.
 * Docs: https://hasura.io/docs/latest/api-reference/
 */
const BASE = (process.env.HASURA_URL ?? "http://localhost:8080").replace(/\/+$/, "")

export class HasuraError extends Error {}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "hasura-mcp/1.0", "Content-Type": "application/json", Accept: "application/json" }
  if (process.env.HASURA_ADMIN_SECRET) h["x-hasura-admin-secret"] = process.env.HASURA_ADMIN_SECRET as string
  return h
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function post<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new HasuraError("Hasura refused (401/403). Set HASURA_ADMIN_SECRET.")
  if (res.status === 404) throw new HasuraError("Not found. Check HASURA_URL.")
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new HasuraError(`Hasura error ${res.status}: ${msg.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new HasuraError("Hasura refused (401/403). Set HASURA_ADMIN_SECRET.")
  if (!res.ok) throw new HasuraError(`Hasura error ${res.status}`)
  return (await res.json()) as T
}

export async function exportMetadata(): Promise<Raw> {
  return await get<Raw>("/v1/metadata")
}

export async function runSql(sql: string, source = "default"): Promise<Raw> {
  if (!sql.trim()) throw new HasuraError("SQL is empty.")
  return await post<Raw>("/v2/query", { type: "run_sql", args: { source, sql } })
}

export function formatMetadata(md: Raw): string {
  const sources: Raw[] = Array.isArray(md.sources) ? md.sources : []
  const lines = sources.map((s) => {
    const tables: Raw[] = Array.isArray(s.tables) ? s.tables : []
    const names = tables.map((t) => String(t.table?.name ?? t.name ?? "?")).slice(0, 20)
    return `Source ${s.name ?? "?"} (${names.length} tables): ${names.join(", ")}`
  })
  return lines.length ? lines.join("\n") : "No sources in metadata."
}

export function formatSqlResult(r: Raw): string {
  if (Array.isArray(r.result)) {
    const rows = r.result as Raw[][]
    if (rows.length === 0) return "Query returned no rows."
    const head = rows[0].map(String).join(" | ")
    const body = rows.slice(1, 11).map((row) => row.map(String).join(" | ")).join("\n")
    const more = rows.length - 1 > 10 ? `\n... (${rows.length - 1} rows total)` : ""
    return `${head}\n${body}${more}`
  }
  return JSON.stringify(r).slice(0, 1500)
}

// ---- muxF tools:
const META_KINDS = [
  'sources', 'tables', 'relationships', 'actions', 'remote_schemas', 'event_triggers',
  'cron_triggers', 'actions_by_source', 'custom_types', 'rest_endpoints', 'api_limits',
  'allowlist', 'inherited_roles', 'query_collections', 'graphql', 'network',
] as const

const RELATIONSHIP_KINDS = ['object', 'array'] as const
const ACTION_KINDS = ['query', 'mutation', 'subscription'] as const

function parseJson(text: string, what: string): Record<string, unknown> {
  const clean = (text ?? '').trim()
  if (!clean) throw new HasuraError(`Provide ${what} as JSON text.`)
  if (clean.length > 4 * 1024 * 1024) throw new HasuraError(`${what} is larger than this server will parse.`)
  let value: unknown
  try {
    value = JSON.parse(clean)
  } catch {
    throw new HasuraError(`${what} is not valid JSON.`)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HasuraError(`${what} must be a JSON object.`)
  return value as Record<string, unknown>
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** A census of a Hasura metadata document: every object kind it holds, and how the relationships and actions are shaped. */
export async function metadataCensus(args: { metadata: string }): Promise<string> {
  const md = parseJson(args.metadata, 'the metadata document')
  const kinds: string[] = []
  const counts: string[] = []
  for (const kind of META_KINDS) {
    const value = md[kind]
    if (value === undefined) continue
    const size = Array.isArray(value) ? value.length : obj(value) ? Object.keys(value as object).length : null
    if (size === null) continue
    kinds.push(kind)
    counts.push(`${kind} ${size}`)
  }
  const relations = arr(md.relationships)
  const tables = arr(md.tables)
  const actions = arr(md.actions)
  const sources = arr(md.sources)
  const relKinds = new Map<string, number>()
  for (const r of relations) {
    const kind = text(obj(r)?.relationship_type) || 'relationship_type not reported'
    relKinds.set(kind, (relKinds.get(kind) ?? 0) + 1)
  }
  const actionKinds = new Map<string, number>()
  for (const a of actions) {
    const kind = text(obj(a)?.action) || 'action not reported'
    actionKinds.set(kind, (actionKinds.get(kind) ?? 0) + 1)
  }
  const perTable = new Map<string, number>()
  for (const r of relations) {
    const record = obj(r)
    const fromTable = obj(obj(record?.from)?.table)
    const toTable = obj(obj(record?.to)?.table)
    const from = text(fromTable?.name) || text(obj(record?.from)?.table)
    const to = text(toTable?.name) || text(obj(record?.to)?.table)
    for (const name of [from, to]) {
      if (name) perTable.set(name, (perTable.get(name) ?? 0) + 1)
    }
  }
  const busiest = [...perTable.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const permissions = arr(md.permissions)
  return [
    'Hasura metadata census (counts only, computed from the document you supplied)',
    `Metadata kinds present (${kinds.length} of ${META_KINDS.length}): ${kinds.length ? kinds.join(', ') : 'none, so this is not a Hasura metadata export'}`,
    `Object counts: ${counts.length ? counts.join(', ') : 'none reported'}`,
    `Sources: ${sources.length}${sources.length ? ` (${sources.map((s) => text(obj(s)?.name) || 'name not reported').slice(0, 8).join(', ')})` : ''}`,
    `Tracked tables: ${tables.length}`,
    `Relationships: ${relations.length}${relations.length ? ` by kind: ${[...relKinds.entries()].map(([k, n]) => `${k} ${n}`).join(', ')}` : ''}`,
    `Actions: ${actions.length}${actions.length ? ` by kind: ${[...actionKinds.entries()].map(([k, n]) => `${k} ${n}`).join(', ')}` : ''}`,
    `Tables touched by the most relationships: ${busiest.length ? busiest.map(([k, n]) => `${k} (${n} ends)`).join(', ') : 'none reported'}`,
    `Permission entries: ${permissions.length}`,
    sources.length && tables.length
      ? `Mean tables per source: ${(tables.length / sources.length).toFixed(1)}; mean relationships per table: ${(relations.length / tables.length).toFixed(1)}`
      : 'Per-source averages: not computable without both sources and tables.',
    'Nothing here talks to a Hasura instance, so it also works on a metadata file that is not currently applied to a server.',
  ].join('\n')
}

/** A dry run over a SQL statement: is it read only, what does it touch, and how much work is in it. */
export async function sqlAudit(args: { sql: string }): Promise<string> {
  const sql = (args.sql ?? '').trim()
  if (!sql) return 'Provide a SQL statement to audit.'
  if (sql.length > 200000) throw new HasuraError('That statement is larger than this server will audit.')
  const stripped = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/\$\$[\s\S]*?\$\$/g, '$$')
    .replace(/"(?:[^"]|"")*"/g, '""')
  const head = stripped.trim().toLowerCase()
  const withMatch = /\bwith\s+([a-z_][a-z0-9_]*)/i.exec(stripped)
  const startsWith = head.startsWith('select') ? 'SELECT' : head.startsWith('with') ? 'WITH' : head.startsWith('insert') ? 'INSERT' : head.startsWith('update') ? 'UPDATE' : head.startsWith('delete') ? 'DELETE' : head.startsWith('create') || head.startsWith('drop') || head.startsWith('alter') || head.startsWith('truncate') ? 'DDL' : 'unrecognised'
  const readOnly = startsWith === 'SELECT' || startsWith === 'WITH'
  const count = (pattern: RegExp): number => (stripped.match(pattern) ?? []).length
  const joins = count(/\bjoin\b/gi)
  const subqueries = Math.max(0, count(/\bselect\b/gi) - 1)
  const ctes = count(/\)\s*,\s*[a-z_][a-z0-9_]*\s*(?:\([^)]*\))?\s+as\s*\(/gi) + (withMatch ? 1 : 0)
  const aggregates = count(/\b(count|sum|avg|min|max|stddev|variance|string_agg|array_agg)\s*\(/gi)
  const groups = count(/\bgroup\s+by\b/gi)
  const windows = count(/\bover\s*\(/gi)
  const distincts = count(/\bdistinct\b/gi)
  const tables = new Set<string>()
  for (const m of stripped.matchAll(/\b(?:from|join|update|into|delete\s+from)\s+([a-z_][a-z0-9_.]*)/gi)) {
    if (m[1]) tables.add(m[1].replace(/^"|"$/g, '').toLowerCase())
  }
  const flags: string[] = []
  if (joins >= 6) flags.push(`${joins} joins, which is where a query plan usually starts to hurt`)
  if (subqueries >= 4) flags.push(`${subqueries} nested select(s)`)
  if (ctes >= 4) flags.push(`${ctes} common table expression(s)`)
  if (groups >= 4) flags.push(`${groups} group by clause(s), so aggregation is probably the expensive stage`)
  if (stripped.length > 20000) flags.push('the statement is long enough that readability and plan review both matter')
  if (!/\blimit\b/i.test(stripped)) flags.push('no LIMIT clause, so the full result set is materialised')
  if (/\bselect\s+\*/i.test(stripped)) flags.push('a SELECT * , so every column is read whether it is used or not')
  return [
    'SQL audit, computed statically with no database connection',
    `Statement starts with: ${startsWith}${withMatch ? ` (leading CTE named ${withMatch[1]})` : ''}`,
    `Read only under a SELECT/WITH rule: ${readOnly ? 'yes' : 'no'}`,
    `Length: ${sql.length} character(s), ${sql.split(/\r?\n/).length} line(s)`,
    `Tables or relations named after from/join/update/into: ${tables.size ? [...tables].slice(0, 20).join(', ') : 'none found'}`,
    `Joins: ${joins} | nested selects: ${subqueries} | common table expressions: ${ctes} | aggregate calls: ${aggregates} | group by clauses: ${groups} | window functions: ${windows} | distinct uses: ${distincts}`,
    `Things worth reviewing before running it: ${flags.length ? flags.join('; ') : 'nothing obvious from the text alone'}`,
    'A read-only check is a first gate, not a plan, so a statement marked read only can still be expensive.',
  ].join('\n')
}

/** Build a GraphQL document for a Hasura schema from the tables and fields you name, with a depth cap. */
export async function graphqlBuilder(args: {
  tables?: string
  fields?: string
  depth?: number
  operation?: string
  alias?: string
}): Promise<string> {
  const tableArg = (args.tables ?? '').trim()
  if (!tableArg) return 'Provide comma separated table names, for example users, posts.'
  const depth = Math.max(1, Math.min(Math.floor(args.depth ?? 2), 6))
  const operation = (args.operation ?? 'query').toLowerCase() === 'mutation' ? 'mutation' : 'query'
  const tables = tableArg.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean).slice(0, 20)
  if (!tables.length) return 'Provide at least one table name.'
  const bad = tables.filter((t) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(t))
  if (bad.length) throw new HasuraError(`Not a valid GraphQL name: ${bad.join(', ')}.`)
  const fieldArg = (args.fields ?? '').trim()
  const fieldMap = new Map<string, string[]>()
  for (const part of fieldArg.split(';')) {
    const [table, list] = part.split(':')
    if (!table || !list) continue
    const fields = list.split(/[,\s]+/).map((f) => f.trim()).filter(Boolean).slice(0, 30)
    if (fields.length) fieldMap.set(table.trim(), fields)
  }
  const alias = (args.alias ?? '').trim()
  const aliasKey = alias && /^[A-Za-z_][A-Za-z0-9_]*$/.test(alias) ? alias : ''
  const body: string[] = []
  let leafCount = 0
  const perTable: string[] = []
  for (const table of tables) {
    const fields = fieldMap.get(table) ?? ['id']
    leafCount += fields.length + (depth > 1 ? 1 : 0)
    perTable.push(`${table} ${fields.length}${depth > 1 ? ' plus __typename' : ''}`)
    const name = aliasKey ? `${aliasKey}: ${table}` : table
    body.push(`  ${name} {`)
    for (const f of fields) body.push(`    ${f}`)
    if (depth > 1) body.push('    __typename')
    body.push('  }')
  }
  const document = [`${operation} FetchTables {`, ...body, '}', ''].join('\n')
  const selections = tables.reduce((sum, table) => sum + 1 + (fieldMap.get(table) ?? ['id']).length, 0)
  return [
    `Generated ${operation} document (depth budget ${depth})`,
    '',
    document.trimEnd(),
    '',
    `Root fields: ${tables.length} (${tables.join(', ')})`,
    `Leaf selections: ${leafCount} across ${tables.length} root field(s) - ${perTable.join('; ')}`,
    `Approximate selection count: ${selections}`,
    depth > 1
      ? 'At depth above 1 add the Hasura relationship fields between the lines marked above; __typename is included so the response stays valid before you do.'
      : 'This document selects primary keys only. Add the columns you need to the fields argument, using table:field,field form.',
    fieldArg ? `Field overrides applied: ${fieldMap.size} table(s).` : 'No fields argument was given, so each table selects its id only.',
    'This builds a document, it does not run it, and it has not been checked against your schema.',
  ].join('\n')
}
