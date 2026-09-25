import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listServices,
  getService,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "statping-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_services",
    {
      title: "List services",
      description: "Monitored services.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listServices());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_service",
    {
      title: "Get service",
      description: "Service details by ID.",
      inputSchema: z.object({
        service_id: z.string().describe("Service ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ service_id }) => {
      try {
        return text(await getService(service_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}