import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listLinks,
  getLink,
  getCurrentUser,
  listEvents,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "savvycal-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_links",
    {
      title: "List links",
      description: "Scheduling links of the user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listLinks());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_link",
    {
      title: "Get link",
      description: "Scheduling link by ID.",
      inputSchema: z.object({
        link_id: z.string().describe("Scheduling link ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ link_id }) => {
      try {
        return text(await getLink(link_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_current_user",
    {
      title: "Current user",
      description: "Authenticated SavvyCal user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getCurrentUser());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_events",
    {
      title: "List events",
      description: "Booked events.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listEvents());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}