import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import duckdb from "duckdb"
import { existsSync, readdirSync, realpathSync, statSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"

class ToolError extends Error {}

const DATA_EXTENSIONS = new Set([".csv", ".tsv", ".parquet", ".pq", ".json", ".ndjson", ".jsonl"])
const MUTATING = /\b(insert|update|delete|drop|create|alter|copy|attach|detach|install|load|pragma|set|export|import|call|vacuum|truncate|replace|checkpoint)\b/i
const READ_ONLY_START = /^(select|with|describe|summarize|explain)\b/i
const MAX_SQL = 20_000
const MAX_ROWS = 5_000
const MAX_FILES = 500

let database: duckdb.Database | null = null
let ready: Promise<void> | null = null

function runSetup(instance: duckdb.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    instance.run(sql, (err: Error | null) => {
      if (err) reject(new ToolError(`could not configure DuckDB: ${err.message}`))
      else resolve()
    })
  })
}

function setup(): Promise<void> {
  if (ready) return ready
  ready = (async () => {
    const instance = new duckdb.Database(":memory:")
    database = instance
    const dirs = allowedRoots()
      .map((root) => `'${root.replaceAll("'", "''")}'`)
      .join(", ")
    await runSetup(instance, `SET allowed_directories=[${dirs}]`)
    await runSetup(instance, "SET enable_external_access=false")
  })()
  return ready
}

function allowedRoots(): string[] {
  const configured = process.env.DUCKDB_MCP_ALLOWED_DIRS
  const raw = configured ? configured.split(path.delimiter).filter(Boolean) : [homedir()]
  const roots: string[] = []
  for (const entry of raw) {
    const resolved = path.resolve(entry)
    try {
      roots.push(resolved)
      const real = realpathSync(resolved)
      if (real !== resolved) roots.push(real)
    } catch {
      throw new ToolError(`allowed directory does not exist: ${resolved}`)
    }
  }
  return [...new Set(roots)]
}

function insideRoots(target: string): boolean {
  return allowedRoots().some((root) => target === root || target.startsWith(root + path.sep))
}

function resolveInside(input: string, label: string): string {
  if (!input.trim()) throw new ToolError(`${label} is required`)
  const absolute = path.resolve(input)
  if (!existsSync(absolute)) throw new ToolError(`${label} does not exist: ${absolute}`)
  const real = realpathSync(absolute)
  if (!insideRoots(real)) {
    throw new ToolError(`${label} is outside the allowed directories (set DUCKDB_MCP_ALLOWED_DIRS)`)
  }
  return real
}

/** Removes SQL strings and comments so keyword checks cannot be fooled by data. */
function stripSqlNoise(sql: string): string {
  let out = ""
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i]
    const next = sql[i + 1]
    if (char === "'" || char === '"') {
      const quote = char
      i += 1
      while (i < sql.length) {
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2
            continue
          }
          break
        }
        i += 1
      }
      out += " "
    } else if (char === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i += 1
      out += " "
    } else if (char === "/" && next === "*") {
      i += 2
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i += 1
      i += 1
      out += " "
    } else {
      out += char
    }
  }
  return out
}

function prepareSql(input: string): { sql: string; wrappable: boolean } {
  let sql = input.trim()
  if (!sql) throw new ToolError("sql is required")
  if (sql.length > MAX_SQL) throw new ToolError(`sql is longer than ${MAX_SQL} characters`)
  if (sql.endsWith(";")) sql = sql.slice(0, -1).trimEnd()
  if (sql.includes(";")) throw new ToolError("only one SQL statement is allowed per call")
  const clean = stripSqlNoise(sql)
  if (!READ_ONLY_START.test(clean.trim())) {
    throw new ToolError("only read-only queries are allowed (SELECT, WITH, DESCRIBE, SUMMARIZE, EXPLAIN)")
  }
  if (MUTATING.test(clean)) {
    throw new ToolError("mutating SQL is not allowed; this server only reads data")
  }
  return { sql, wrappable: /^(select|with)\b/i.test(clean.trim()) }
}

async function all(sql: string): Promise<Record<string, unknown>[]> {
  await setup()
  const instance = database
  if (!instance) throw new ToolError("DuckDB did not start")
  return new Promise((resolve, reject) => {
    instance.all(sql, (err: Error | null, rows: Record<string, unknown>[]) => {
      if (err) reject(new ToolError(err.message))
      else resolve(rows ?? [])
    })
  })
}

function normalize(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return `<binary ${value.length} bytes>`
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = normalize(item)
    return out
  }
  return value
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function sourceFor(file: string): { sql: string; format: string } {
  const ext = path.extname(file).toLowerCase()
  if (ext === ".csv") return { sql: `read_csv_auto(${sqlLiteral(file)})`, format: "csv" }
  if (ext === ".tsv") return { sql: `read_csv_auto(${sqlLiteral(file)}, delim='\\t')`, format: "tsv" }
  if (ext === ".parquet" || ext === ".pq") return { sql: `read_parquet(${sqlLiteral(file)})`, format: "parquet" }
  if (ext === ".json" || ext === ".ndjson" || ext === ".jsonl") {
    return { sql: `read_json_auto(${sqlLiteral(file)})`, format: "json" }
  }
  throw new ToolError(`unsupported file type ${ext || "(none)"}; use CSV, TSV, Parquet or JSON`)
}

function text(value: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] }
}

function fail(message: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: message }], isError: true }
}

function errorMessage(error: unknown): string {
  if (error instanceof ToolError || error instanceof Error) return `Error: ${error.message}`
  return `Error: ${String(error)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "duckdb-mcp", version: "1.0.0" })

  server.tool(
    "query",
    "Run one read-only DuckDB SQL query over local files. Use read_csv_auto('file'), read_parquet('file') or read_json_auto('file') as tables. Results are capped.",
    {
      sql: z.string().min(1).max(MAX_SQL).describe("One SELECT/WITH/DESCRIBE/SUMMARIZE/EXPLAIN statement"),
      limit: z.number().int().min(1).max(MAX_ROWS).default(500).describe("Maximum rows to return"),
    },
    async ({ sql, limit }) => {
      try {
        const prepared = prepareSql(sql)
        const statement = prepared.wrappable
          ? `SELECT * FROM (${prepared.sql}) AS query_result LIMIT ${limit + 1}`
          : prepared.sql
        const rows = await all(statement)
        const truncated = rows.length > limit
        const shown = rows.slice(0, limit).map(normalize) as Record<string, unknown>[]
        return text({
          columns: shown.length > 0 ? Object.keys(shown[0]) : [],
          rows: shown,
          row_count: shown.length,
          truncated,
        })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "inspect_file",
    "Show the schema and first rows of a local CSV, TSV, Parquet or JSON file without writing anything.",
    {
      path: z.string().min(1).describe("Absolute path, or a path inside the allowed directories"),
    },
    async ({ path: input }) => {
      try {
        const file = resolveInside(input, "file")
        const stat = statSync(file)
        if (!stat.isFile()) throw new ToolError(`not a file: ${file}`)
        const source = sourceFor(file)
        const schema = await all(`DESCRIBE SELECT * FROM ${source.sql}`)
        const sample = await all(`SELECT * FROM ${source.sql} LIMIT 5`)
        return text({
          path: file,
          format: source.format,
          size_bytes: stat.size,
          columns: schema.map((row) => ({ name: row.column_name, type: row.column_type })),
          sample: sample.map(normalize),
        })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "list_files",
    "List data files (CSV, TSV, Parquet, JSON) under a directory, so the model can find tables to query.",
    {
      directory: z.string().min(1).describe("Directory inside the allowed directories"),
      recursive: z.boolean().default(false).describe("Walk subdirectories up to 5 levels deep"),
      limit: z.number().int().min(1).max(MAX_FILES).default(200).describe("Maximum files to return"),
    },
    async ({ directory, recursive, limit }) => {
      try {
        const root = resolveInside(directory, "directory")
        if (!statSync(root).isDirectory()) throw new ToolError(`not a directory: ${root}`)
        const found: { path: string; size_bytes: number }[] = []
        let truncated = false

        const walk = (current: string, depth: number): void => {
          if (found.length >= limit) {
            truncated = true
            return
          }
          const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
          for (const entry of entries) {
            if (found.length >= limit) {
              truncated = true
              return
            }
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue
            const full = path.join(current, entry.name)
            if (entry.isDirectory()) {
              if (recursive && depth < 5) walk(full, depth + 1)
              continue
            }
            if (!entry.isFile()) continue
            if (!DATA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
            if (!insideRoots(full)) continue
            found.push({ path: full, size_bytes: statSync(full).size })
          }
        }

        walk(root, 0)
        return text({ directory: root, count: found.length, truncated, files: found })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  return server
}
