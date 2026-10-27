import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listContacts,
  listCompanies,
  listDeals,
  listTickets,
  listOwners,
  getContact,
  getCompany,
  getDeal,
  searchContacts,
  dealPipelines,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hubspot-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_contacts",
    {
      title: "List contacts",
      description: "CRM contacts with email, name and owner.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listContacts(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_companies",
    {
      title: "List companies",
      description: "CRM companies with domain and industry.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCompanies(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_deals",
    {
      title: "List deals",
      description: "CRM deals with amount, stage and close date.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listDeals(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_tickets",
    {
      title: "List tickets",
      description: "Service tickets.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listTickets(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_owners",
    {
      title: "List owners",
      description: "Record owners.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listOwners());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_contact",
    {
      title: "Get contact",
      description: "Contact details.",
      inputSchema: z.object({
        contact_id: z.string().describe("Contact ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ contact_id }) => {
      try {
        return text(await getContact(contact_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_company",
    {
      title: "Get company",
      description: "Company details.",
      inputSchema: z.object({
        company_id: z.string().describe("Company ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ company_id }) => {
      try {
        return text(await getCompany(company_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_deal",
    {
      title: "Get deal",
      description: "Deal details.",
      inputSchema: z.object({
        deal_id: z.string().describe("Deal ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ deal_id }) => {
      try {
        return text(await getDeal(deal_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_contacts",
    {
      title: "Find by email",
      description: "Contact lookup.",
      inputSchema: z.object({
        email: z.string().describe("Email address.")
      }),
      annotations: READ_ONLY,
    },
    async ({ email }) => {
      try {
        return text(await searchContacts(email));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "deal_pipelines",
    {
      title: "Deal pipelines",
      description: "Stages.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await dealPipelines());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}