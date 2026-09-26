import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTickets,
  getTicket,
  listContacts,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "freshdesk-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_tickets",
    {
      title: "List tickets",
      description: "Recent tickets.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTickets());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_ticket",
    {
      title: "Get ticket",
      description: "Ticket details.",
      inputSchema: z.object({
        ticket_id: z.string().describe("Freshdesk ticket ID, e.g. 12345")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticket_id }) => {
      try {
        return text(await getTicket(ticket_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_contacts",
    {
      title: "List contacts",
      description: "Contacts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listContacts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}