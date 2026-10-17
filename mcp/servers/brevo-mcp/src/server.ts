import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { accountInfo, BrevoError, emailReports, formatContact, listContacts, campaignPerformance, senderInventory, listInventory } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brevo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "account_info",
    {
      title: "Account info",
      description: "Brevo account with plan and credits.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await accountInfo())
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_contacts",
    {
      title: "List contacts",
      description: "Brevo contacts with blacklist flags.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
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
    "email_reports",
    {
      title: "Email reports",
      description: "Aggregate sends, deliveries, opens, clicks, bounces.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(90).default(30),
      }),
      annotations: READ_ONLY,
    },
    async ({ days }) => {
      try {
        return text(await emailReports(days))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "campaign_performance",
    {
      title: "Campaign performance",
      description: "Brevo campaign funnel per campaign: sent, delivered, bounces, unsubscribes, complaints, unique views and unique clicks, with rates. Optional status and type filter.",
      inputSchema: z.object({
        status: z.string().optional().describe("Filter by status, e.g. sent, draft, queued, in_process"),
        type: z.string().optional().describe("classic or trigger"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await campaignPerformance(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "sender_inventory",
    {
      title: "Sender inventory",
      description: "Every Brevo sender identity with its activated flag, and any dedicated IPs with their send weights.",
      inputSchema: z.object({
        domain: z.string().optional().describe("Only senders on this domain"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await senderInventory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "list_inventory",
    {
      title: "List inventory",
      description: "Brevo contact lists with folder, subscriber, unique-subscriber and blacklist counts, plus account totals across the lists shown.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listInventory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BrevoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
