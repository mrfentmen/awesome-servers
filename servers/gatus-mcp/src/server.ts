import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listEndpoints,
  getEndpointStatuses,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gatus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_endpoints",
    {
      title: "List endpoints",
      description: "Monitored endpoints with status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listEndpoints());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_endpoint_statuses",
    {
      title: "Endpoint history",
      description: "Status history for one endpoint.",
      inputSchema: z.object({
        key: z.string().describe("Endpoint key."),
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ key, limit }) => {
      try {
        return text(await getEndpointStatuses(key, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}