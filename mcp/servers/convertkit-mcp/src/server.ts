import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findSubscriber, formatNamed, KitError, listBroadcasts, listForms, listTags, listSequences, broadcastPerformance } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "convertkit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "find_subscriber",
    {
      title: "Find subscriber",
      description: "Find a Kit subscriber by email: name, state, join date.",
      inputSchema: z.object({
        email: z.string().describe("Email address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ email }) => {
      try {
        const s = await findSubscriber(email)
        if (!s) return text(`No Kit subscriber ${email}.`)
        return text(`${s.email ?? email}${s.firstName ? ` (${s.firstName})` : ""}${s.state ? ` [${s.state}]` : ""}${s.created ? ` — since ${s.created}` : ""}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_forms",
    {
      title: "List forms",
      description: "Kit (ConvertKit) signup forms, with id and name.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(formatNamed(await listForms(limit), "forms"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_broadcasts",
    {
      title: "List broadcasts",
      description: "Kit email broadcasts (newsletters sent).",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(formatNamed(await listBroadcasts(limit), "broadcasts"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "The tags on the Kit account with how many subscribers each one actually holds, which shows which tags really segment the audience rather than sitting empty. Flags any tag that reports no subscriber count, because that understates its reach.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(30).describe("Tags to list, default 30"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listTags(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "list_sequences",
    {
      title: "List automations",
      description: "The automations on the Kit account with their active or paused state, step count, audience size and engagement to date, and calls out any sequence that is paused while still holding subscribers.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20).describe("Sequences to list, default 20"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listSequences(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "broadcast_performance",
    {
      title: "Broadcast performance",
      description: "How broadcasts actually performed: recipients, open, click and unsubscribe rates against the most recent first, with the open- and click-tracking flags called out so a low number is not read as a failure when tracking was simply switched off.",
      inputSchema: z.object({
        status: z.string().optional().describe("Filter by lifecycle status: draft, scheduled, sending or sent."),
        sent_after: z.string().optional().describe("Only broadcasts sent on or after this date, 2026-01-31 or 2026-01-31T09:00:00Z."),
        sent_before: z.string().optional().describe("Only broadcasts sent on or before this date."),
        limit: z.number().int().min(1).max(100).default(15).describe("Broadcasts to list, default 15"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await broadcastPerformance(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof KitError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
