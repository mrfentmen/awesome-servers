import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listMonitors,
  getMonitor,
  getAccount,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "uptimerobot-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_monitors",
    {
      title: "List monitors",
      description: "Monitors with status.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listMonitors(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_monitor",
    {
      title: "Get monitor",
      description: "Monitor details, logs, response times.",
      inputSchema: z.object({
        monitor_id: z.string().describe("Monitor ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ monitor_id }) => {
      try {
        return text(await getMonitor(monitor_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_account",
    {
      title: "Account info",
      description: "Account details and limits.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getAccount());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}