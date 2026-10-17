import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatContact, formatMessage, listContacts, MailjetError, recentMessages, messageHeaderLint, sendTimePlanner } from "./api.js"

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
        return textError(String(e))
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "message_header_lint",
    {
      title: "Message header lint",
      description: "Read a raw message the way a receiving MTA would: From/To/Date/Message-ID/DKIM/List-Unsubscribe presence, address syntax, subject length, Received hops, content type and body shape, with the fixes listed.",
      inputSchema: z.object({ message: z.string().describe("The raw message, headers first, as you would hand it to an SMTP DATA command."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await messageHeaderLint(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "send_time_planner",
    {
      title: "Send time planner",
      description: "Turn \"send it at 9am their time\" into real UTC instants: the next weekday slots at a chosen local hour for up to twelve IANA time zones, and how far apart they fall.",
      inputSchema: z.object({ zones: z.string().describe("IANA time zones, e.g. 'Europe/London America/New_York'."), localHour: z.number().int().min(0).max(23).default(9).describe("Local hour to aim for (default 9)."), days: z.number().int().min(1).max(14).default(5).describe("How many weekday slots per zone (default 5, max 14).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await sendTimePlanner(args)) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MailjetError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
