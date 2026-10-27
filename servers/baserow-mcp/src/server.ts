import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getDashboard,
  listTables,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "baserow-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_dashboard",
    {
      title: "Dashboard",
      description: "Applications and databases in the workspace.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getDashboard());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_tables",
    {
      title: "List tables",
      description: "Tables inside one database id, with field counts.",
      inputSchema: z.object({
        database_id: z.string().describe("Database ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ database_id }) => {
      try {
        return text(await listTables(database_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}