import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTickets,
  getTicket,
  listContacts,
  contactDetails,
  agents,
  companies,
  groups,
  conversations,
  satisfaction,
  canned,
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
      description: "Most recent support tickets, with status and priority.",
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
      description: "One ticket by id, with requester and full text.",
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
      description: "Support contacts with email and company.",
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

  server.registerTool(
    "contact_details",
    {
      title: "Contact details",
      description: "Single contact.",
      inputSchema: z.object({
        contact_id: z.string().describe("Contact ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ contact_id }) => {
      try {
        return text(await contactDetails(contact_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "agents",
    {
      title: "Agents",
      description: "Support agents.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await agents());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "companies",
    {
      title: "Companies",
      description: "Customer companies.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await companies());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "groups",
    {
      title: "Groups",
      description: "Agent groups.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await groups());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "conversations",
    {
      title: "Ticket thread",
      description: "Conversation on a ticket.",
      inputSchema: z.object({
        ticket_id: z.string().describe("Ticket ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ticket_id }) => {
      try {
        return text(await conversations(ticket_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "satisfaction",
    {
      title: "Satisfaction",
      description: "CSAT ratings.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await satisfaction());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "canned",
    {
      title: "Canned folders",
      description: "Reply templates.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await canned());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}