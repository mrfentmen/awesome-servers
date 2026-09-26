import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getGrant,
  listCalendars,
  listMessages,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "nylas-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_grant",
    {
      title: "Grant info",
      description: "Authenticated grant details.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getGrant());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_calendars",
    {
      title: "List calendars",
      description: "Calendars on the grant.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCalendars(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_messages",
    {
      title: "List messages",
      description: "Recent messages.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listMessages(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}