import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listMonitors,
  getMonitor,
  getMonitorByUrl,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ohdear-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_monitors",
    {
      title: "List monitors",
      description: "All Oh Dear monitors with checks and current statuses.",
      inputSchema: z.object({
      }),
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
      description: "One Oh Dear monitor with full check details.",
      inputSchema: z.object({
        monitorId: z.string().describe("Monitor id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ monitorId }) => {
      try {
        return text(await getMonitor(monitorId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_monitor_by_url",
    {
      title: "Find monitor by URL",
      description: "Find an Oh Dear monitor by its exact URL.",
      inputSchema: z.object({
        monitorUrl: z.string().describe("Monitor URL"),
      }),
      annotations: READ_ONLY,
    },
    async ({ monitorUrl }) => {
      try {
        return text(await getMonitorByUrl(monitorUrl));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
