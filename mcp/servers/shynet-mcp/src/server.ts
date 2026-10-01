import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getDashboard,
  getServiceStats,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "shynet-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_dashboard",
    {
      title: "Get dashboard",
      description: "Shynet dashboard: visits, pageviews and stats across all services, last 30 days by default.",
      inputSchema: z.object({
        startDate: z.string().optional().describe("Start YYYY-MM-DD"),
        endDate: z.string().optional().describe("End YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ startDate, endDate }) => {
      try {
        return text(await getDashboard(startDate, endDate));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_service_stats",
    {
      title: "Get service stats",
      description: "Shynet stats for one service (site) with date range.",
      inputSchema: z.object({
        uuid: z.string().describe("Service uuid"),
        startDate: z.string().optional().describe("Start YYYY-MM-DD"),
        endDate: z.string().optional().describe("End YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ uuid, startDate, endDate }) => {
      try {
        return text(await getServiceStats(uuid, startDate, endDate));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
