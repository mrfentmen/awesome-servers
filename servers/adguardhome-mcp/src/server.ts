import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getStatus,
  getStats,
  getQueryLog,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "adguardhome-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_status",
    {
      title: "Protection status",
      description: "DNS protection state.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getStatus());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_stats",
    {
      title: "Statistics",
      description: "Query/block counters.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getStats());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_query_log",
    {
      title: "Query log",
      description: "Recent DNS queries.",
      inputSchema: z.object({
        limit: z.string().describe("Max entries (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await getQueryLog(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}