import { DatabaseSync } from "node:sqlite"

export class SqliteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SqliteError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

let db: DatabaseSync | null = null

export function openDb(dbPath: string): DatabaseSync {
  if (!db) {
    try {
      db = new DatabaseSync(dbPath)
    } catch (e) {
      throw new SqliteError(`Cannot open database at ${dbPath}: ${errorMessage(e)}`)
    }
  }
  return db
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

const READ_PREFIX = /^\s*(SELECT|WITH|VALUES|EXPLAIN)\b/i

function bindParams(params?: string[]): Array<string | number | bigint | null> {
  if (params === undefined) return []
  return params.map((p) => {
    const t = p.trim()
    if (/^-?\d+$/.test(t)) return Number(t)
    if (/^-?\d*\.\d+$/.test(t)) return Number(t)
    if (t === "true") return 1
    if (t === "false") return 0
    if (t === "null") return null
    return p
  })
}

export async function query(dbPath: string, sql: string, params?: string[]): Promise<string> {
  const q = sql.trim()
  if (!q) throw new SqliteError("Provide a SQL query.")
  if (!READ_PREFIX.test(q)) {
    throw new SqliteError("query() accepts read-only statements only (SELECT/WITH). Use execute() for writes.")
  }
  const rows = openDb(dbPath).prepare(q).all(...bindParams(params)) as Record<string, unknown>[]
  if (rows.length === 0) return "Query returned 0 rows."
  return pretty(rows)
}

export async function execute(dbPath: string, sql: string, params?: string[]): Promise<string> {
  const q = sql.trim()
  if (!q) throw new SqliteError("Provide a SQL statement.")
  const info = openDb(dbPath).prepare(q).run(...bindParams(params)) as { changes: number | bigint; lastInsertRowid: number | bigint }
  return pretty({ changes: String(info.changes), lastInsertRowid: String(info.lastInsertRowid) })
}

export async function listTables(dbPath: string): Promise<string> {
  const tables = openDb(dbPath)
    .prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as Array<{ name: string; type: string }>
  if (tables.length === 0) return "Database has no tables or views yet."
  const out = tables.map((t) => {
    let count: string | number = "?"
    try {
      const r = openDb(dbPath).prepare(`SELECT COUNT(*) AS n FROM "${t.name.replace(/"/g, '""')}"`).get() as { n: number }
      count = r.n
    } catch {
      count = "? (unreadable)"
    }
    return `- ${t.name} [${t.type}] (${count} rows)`
  })
  return `Tables in database:\n${out.join("\n")}`
}

export async function describeTable(dbPath: string, table: string): Promise<string> {
  const name = table.trim()
  if (!name) throw new SqliteError("Provide a table name.")
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new SqliteError("Invalid table name.")
  const cols = openDb(dbPath).prepare(`PRAGMA table_info("${name}")`).all() as Array<Record<string, unknown>>
  if (cols.length === 0) throw new SqliteError(`Table "${name}" does not exist.`)
  const idx = openDb(dbPath).prepare(`PRAGMA index_list("${name}")`).all() as Array<Record<string, unknown>>
  return pretty({ table: name, columns: cols, indexes: idx })
}
