import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getInfo,
  listCharts,
  getData,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "netdata-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_info",
    {
      title: "Node info",
      description: "Agent version, OS, collectors.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getInfo());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_charts",
    {
      title: "List charts",
      description: "Available charts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCharts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_data",
    {
      title: "Chart data",
      description: "Recent data points for a chart.",
      inputSchema: z.object({
        chart: z.string().describe("Chart ID, e.g. system.cpu."),
        points: z.string().describe("Points (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chart, points }) => {
      try {
        return text(await getData(chart, points));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}