import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listDomains,
  getDomain,
  getEmail,
  listApiKeys,
  listAudiences,
  getAudience,
  listContacts,
  listBroadcasts,
  getBroadcast,
  createContact,
  addDomain,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "resend-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_domains",
    {
      title: "List domains",
      description: "Domains verified for sending, with DKIM status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDomains());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_domain",
    {
      title: "Get domain",
      description: "One sending domain by id, with DNS records.",
      inputSchema: z.object({
        domain_id: z.string().describe("Domain UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ domain_id }) => {
      try {
        return text(await getDomain(domain_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_email",
    {
      title: "Get email",
      description: "One sent email by id, with delivery status.",
      inputSchema: z.object({
        email_id: z.string().describe("Email ID from the send response")
      }),
      annotations: READ_ONLY,
    },
    async ({ email_id }) => {
      try {
        return text(await getEmail(email_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_api_keys",
    {
      title: "API keys",
      description: "Key list.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listApiKeys());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_audiences",
    {
      title: "Audiences",
      description: "Contact audiences.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listAudiences());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_audience",
    {
      title: "Get audience",
      description: "Audience details.",
      inputSchema: z.object({
        audience_id: z.string().describe("Audience UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ audience_id }) => {
      try {
        return text(await getAudience(audience_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_contacts",
    {
      title: "Audience contacts",
      description: "Contacts in audience.",
      inputSchema: z.object({
        audience_id: z.string().describe("Audience UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ audience_id }) => {
      try {
        return text(await listContacts(audience_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_broadcasts",
    {
      title: "Broadcasts",
      description: "Email broadcasts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBroadcasts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_broadcast",
    {
      title: "Get broadcast",
      description: "Broadcast details.",
      inputSchema: z.object({
        broadcast_id: z.string().describe("Broadcast UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ broadcast_id }) => {
      try {
        return text(await getBroadcast(broadcast_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "create_contact",
    {
      title: "Add contact",
      description: "Add a REAL contact.",
      inputSchema: z.object({
        audience_id: z.string().describe("Audience UUID."),
        email: z.string().describe("Email.")
      }),
      annotations: MUTATING,
    },
    async ({ audience_id, email }) => {
      try {
        return text(await createContact(audience_id, email));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "add_domain",
    {
      title: "Add domain",
      description: "Add a REAL sending domain.",
      inputSchema: z.object({
        name: z.string().describe("Domain name.")
      }),
      annotations: MUTATING,
    },
    async ({ name }) => {
      try {
        return text(await addDomain(name));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}