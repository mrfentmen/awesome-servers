import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatSql, minifySql, splitStatements, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "sql-format-mcp", version: "1.0.0" })

  server.tool(
    "format_sql",
    "Lay out a SQL statement with clauses on their own lines, SELECT lists one item per line and subqueries indented.",
    {
      sql: z.string().describe('SQL text'), indent: z.number().int().min(2).max(4).optional().describe('Spaces per indent level, 2 or 4, default 2'), uppercaseKeywords: z.boolean().optional().describe('Upper-case keywords, default true')
    },
    async (a) => {
      try {
        return text(await formatSql(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "minify_sql",
    "Collapse a SQL statement onto one line without touching strings or comments.",
    {
      sql: z.string().describe('SQL text'), stripComments: z.boolean().optional().describe('Drop comments as well, default false')
    },
    async (a) => {
      try {
        return text(await minifySql(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "split_statements",
    "Split a SQL script into statements on top-level semicolons, keeping strings and comments intact.",
    {
      sql: z.string().describe('SQL script that may hold several statements')
    },
    async (a) => {
      try {
        return text(await splitStatements(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
