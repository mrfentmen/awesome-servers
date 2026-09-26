import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getStatus,
  getMetrics,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "uptime-kuma-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_status",
    {
      title: "Instance status",
      description: "Up/down counts per monitor in one summary.",
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
    "get_metrics",
    {
      title: "Prometheus metrics",
      description: "Raw Prometheus metrics the instance exposes.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMetrics());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}