import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatContact, formatMessage, listContacts, MailjetError, recentMessages } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mailjet-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_contacts",
    {
      title: "List contacts",
      description: "Mailjet contacts with names and unsubscribe flags.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(1000).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listContacts(limit)
        if (rows.length === 0) return text("No contacts.")
        return text(rows.map((c, i) => formatContact(c, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_messages",
    {
      title: "Recent messages",
      description: "Recent sent emails: recipients, subjects, statuses.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(1000).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await recentMessages(limit)
        if (rows.length === 0) return text("No messages.")
        return text(rows.map((m, i) => formatMessage(m, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MailjetError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
