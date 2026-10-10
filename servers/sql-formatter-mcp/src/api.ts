import { format as formatSql } from "sql-formatter"

const UA = "mrfentmen-sql-formatter-mcp/1.0"
export class SqlError extends Error {}

type Dialect = "sql" | "postgresql" | "mysql" | "sqlite" | "mariadb" | "tsql"
const VALID_DIALECTS: Dialect[] = ["sql", "postgresql", "mysql", "sqlite", "mariadb", "tsql"]

export async function format(args: { sql?: string; dialect?: string }): Promise<string> {
  const sql = (args.sql ?? "").trim()
  if (!sql) throw new SqlError("Provide a SQL query")
  const dialect = (args.dialect ?? "sql").toLowerCase() as Dialect
  if (!VALID_DIALECTS.includes(dialect)) throw new SqlError(`Dialect must be one of ${VALID_DIALECTS.join(", ")}`)
  try {
    return formatSql(sql, { language: dialect, tabWidth: 2, keywordCase: "upper" })
  } catch (e) {
    throw new SqlError(`Could not format: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ---- muxC tools:

/**
 * Collapse a formatted query to a single line, dropping the indentation the
 * pretty printer adds, and normalise the spacing around punctuation.
 */
export async function minify(args: { sql?: string; dialect?: string }): Promise<string> {
  const sql = (args.sql ?? "").trim()
  if (!sql) throw new SqlError("Provide a SQL query")
  const dialect = (args.dialect ?? "sql").toLowerCase() as Dialect
  if (!VALID_DIALECTS.includes(dialect)) throw new SqlError(`Dialect must be one of ${VALID_DIALECTS.join(", ")}`)
  let formatted: string
  try {
    formatted = formatSql(sql, { language: dialect, tabWidth: 2, keywordCase: "upper" })
  } catch (e) {
    throw new SqlError(`Could not format: ${e instanceof Error ? e.message : String(e)}`)
  }
  // Collapse newlines and runs of whitespace, then pull commas out of the
  // indentation the formatter left behind.
  const oneLine = formatted
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
  return oneLine
}

/**
 * Count what a query is made of, so a reviewer can see at a glance whether it
 * touches more tables than they expected.
 */
export async function analyse(args: { sql?: string; dialect?: string }): Promise<string> {
  const sql = (args.sql ?? "").trim()
  if (!sql) throw new SqlError("Provide a SQL query")
  const dialect = (args.dialect ?? "sql").toLowerCase() as Dialect
  if (!VALID_DIALECTS.includes(dialect)) throw new SqlError(`Dialect must be one of ${VALID_DIALECTS.join(", ")}`)
  let formatted: string
  try {
    formatted = formatSql(sql, { language: dialect, tabWidth: 2, keywordCase: "upper" })
  } catch (e) {
    throw new SqlError(`Could not format: ${e instanceof Error ? e.message : String(e)}`)
  }
  const body = formatted.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ")
  const count = (re: RegExp): number => (body.match(re) ?? []).length
  const tables = new Set(
    [...body.matchAll(/\bFROM\s+([A-Za-z_][\w.]*)/gi)].map((m) => m[1].replace(/[^A-Za-z0-9_.]/g, "")),
  ).size + new Set([...body.matchAll(/\bJOIN\s+([A-Za-z_][\w.]*)/gi)].map((m) => m[1])).size
  const ctes = count(/\bWITH\s+[A-Za-z_][\w$]*\s+AS\s*\(/gi)
  const distinct = new Set([...body.matchAll(/\b([A-Za-z_][\w.]*)\s*\(/g)].map((m) => m[1].toUpperCase()))
    // built-in functions are not joins or tables
    .size
  const statementTypes = [...new Set([...body.matchAll(/^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|MERGE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\b/gim)].map((m) => m[1].toUpperCase()))]
  return [
    `Query analysis (${dialect}):`,
    `Statements: ${statementTypes.length}${statementTypes.length ? ` (${statementTypes.join(", ")})` : ""}`,
    `Tables referenced: ${tables}`,
    `CTEs: ${ctes} | subqueries in FROM: ${count(/\bFROM\s*\(\s*SELECT\b/gi)}`,
    `Joins: ${count(/\bJOIN\b/gi)} | aggregates: ${count(/\b(?:COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT|STRING_AGG)\s*\(/gi)}`,
    `Functions called: ${distinct}`,
    `WHERE clauses: ${count(/\bWHERE\b/gi)} | GROUP BY: ${count(/\bGROUP\s+BY\b/gi)} | ORDER BY: ${count(/\bORDER\s+BY\b/gi)} | LIMIT: ${count(/\bLIMIT\b/gi)}`,
    `Length: ${body.length} characters, ${formatted.split("\n").length} lines formatted`,
    tables > 8 ? "Warning: more than 8 tables, this query may be hard to review" : null,
  ]
    .filter(Boolean)
    .join("\n")
}
