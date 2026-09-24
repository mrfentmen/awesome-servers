import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { domainStats, formatStats, listBounces, listDomains, MailgunError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mailgun-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_domains",
    {
      title: "List domains",
      description: "Mailgun sending domains with state and creation date. Set MAILGUN_REGION=eu for EU accounts.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listDomains(limit)
        if (rows.length === 0) return text("No domains.")
        return text(rows.map((d, i) => `${i + 1}. ${d.name}${d.state ? ` (${d.state})` : ""}${d.created ? ` — since ${d.created}` : ""}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "domain_stats",
    {
      title: "Domain stats",
      description: "Totals for a domain: sent, delivered, opened, failed.",
      inputSchema: z.object({
        domain: z.string().describe("Sending domain, e.g. 'mg.example.com'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain }) => {
      try {
        return text(formatStats(domain, await domainStats(domain)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_bounces",
    {
      title: "List bounces",
      description: "Bounced addresses for a domain with codes and errors.",
      inputSchema: z.object({
        domain: z.string().describe("Sending domain"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain, limit }) => {
      try {
        const rows = await listBounces(domain, limit)
        if (rows.length === 0) return text(`No bounces for ${domain}.`)
        return text(rows.map((b, i) => `${i + 1}. ${b}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MailgunError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
