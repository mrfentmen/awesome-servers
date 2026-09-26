import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  queryTable,
  listUsers,
  callRpc,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "supabase-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "query_table",
    {
      title: "Query table",
      description: "Rows from one table, with select and limit applied.",
      inputSchema: z.object({
        table: z.string().describe("Table name, e.g. customers"),
        select: z.string().describe("Columns (default *).").optional(),
        limit: z.string().describe("Max rows (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ table, select, limit }) => {
      try {
        return text(await queryTable(table, select, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Auth users in the project, one page at a time.",
      inputSchema: z.object({
        page: z.string().describe("Page (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ page }) => {
      try {
        return text(await listUsers(page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "call_rpc",
    {
      title: "Call RPC",
      description: "Call a Postgres function by name with JSON parameters.",
      inputSchema: z.object({
        function_name: z.string().describe("Function name."),
        params: z.string().describe("JSON params.").optional()
      }),
      annotations: MUTATING,
    },
    async ({ function_name, params }) => {
      try {
        return text(await callRpc(function_name, params));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}