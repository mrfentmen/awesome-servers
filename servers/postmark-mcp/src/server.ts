import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getServer,
  listTemplates,
  listOutbound,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "postmark-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_server",
    {
      title: "Server info",
      description: "Postmark server details and delivery settings.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getServer());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_templates",
    {
      title: "List templates",
      description: "Email templates on the server, with ids.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listTemplates(count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_outbound",
    {
      title: "Outbound messages",
      description: "Recent outbound messages with recipient and status.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listOutbound(count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}