import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  describeTable,
  errorMessage,
  execute,
  listTables,
  query,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(dbPath: string): McpServer {
  const server = new McpServer({
    name: "sqlite-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "query",
    {
      title: "Run read query",
      description: "Run a read-only SELECT/WITH query with optional ? bound parameters.",
      inputSchema: z.object({
        sql: z.string().describe("SELECT statement, ? placeholders allowed"),
        params: z.array(z.string()).describe("Bound parameter values as strings").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ sql, params }) => {
      try {
        return text(await query(dbPath, sql, params))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "execute",
    {
      title: "Execute write statement",
      description: "Run INSERT/UPDATE/DELETE/DDL. Returns rows changed and last insert id.",
      inputSchema: z.object({
        sql: z.string().describe("Write statement, ? placeholders allowed"),
        params: z.array(z.string()).describe("Bound parameter values as strings").optional(),
      }),
      annotations: NON_READ_ONLY,
    },
    async ({ sql, params }) => {
      try {
        return text(await execute(dbPath, sql, params))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_tables",
    {
      title: "List tables",
      description: "All tables and views with row counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await listTables(dbPath))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "describe_table",
    {
      title: "Describe table",
      description: "Columns, types, defaults, primary keys, and indexes for one table.",
      inputSchema: z.object({
        table: z.string().describe("Table name"),
      }),
      annotations: READ_ONLY,
    },
    async ({ table }) => {
      try {
        return text(await describeTable(dbPath, table))
      } catch (e) {
        return textError(String(e))
      }
    }
  )
const serverName = "sqlite-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the provided text.",
      inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      return text(String(args?.text ?? ""))
    }
  )
  server.registerTool(
    "timestamp",
    {
      title: "Timestamp",
      description: "Get the current UTC timestamp.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(new Date().toISOString())
    }
  )
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Ping the server to check connectivity.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("pong")
    }
  )


  return server
}
