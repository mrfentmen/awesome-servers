import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, minify, analyse } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sql-formatter-mcp", version: "1.0.0" })
  server.registerTool(
    "format",
    {
      title: "Format",
      description: "Format a SQL query.",
      inputSchema: z.object( { sql: z.string().describe("The SQL query."), dialect: z.string().describe("sql, postgresql, mysql, or sqlite.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await format(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "minify",
    {
      title: "Minify",
      description: "Collapse a SQL query to a single line with normalised spacing, for logs, diffs and size checks.",
      inputSchema: z.object( { sql: z.string().describe("SQL query to minify."), dialect: z.string().describe("sql, postgresql, mysql, sqlite, mariadb or tsql.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await minify(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "analyse",
    {
      title: "Analyse a query",
      description: "Break a SQL query down: statement types, tables touched, joins, CTEs, subqueries, aggregates and function calls.",
      inputSchema: z.object( { sql: z.string().describe("SQL query to analyse."), dialect: z.string().describe("sql, postgresql, mysql, sqlite, mariadb or tsql.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await analyse(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
