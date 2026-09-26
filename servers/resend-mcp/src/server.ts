import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listDomains,
  getDomain,
  getEmail,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

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

  return server
}