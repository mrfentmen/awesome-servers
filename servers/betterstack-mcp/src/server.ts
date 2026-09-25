import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listMonitors,
  getMonitor,
  listIncidents,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "betterstack-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_monitors",
    {
      title: "List monitors",
      description: "Uptime monitors.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listMonitors());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_monitor",
    {
      title: "Get monitor",
      description: "Monitor details by ID.",
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
    "list_incidents",
    {
      title: "List incidents",
      description: "Recent incidents.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listIncidents());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}