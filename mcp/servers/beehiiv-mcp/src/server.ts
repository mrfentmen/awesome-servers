import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BeehiivError, findSubscriber, formatPost, listPosts, listPublications, publicationStats, listTiers } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "beehiiv-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      description: "beehiiv publication posts with statuses and links.",
      inputSchema: z.object({
        publication_id: z.string().describe("Publication id, e.g. 'pub_abc123'"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ publication_id, limit }) => {
      try {
        const rows = await listPosts(publication_id, limit)
        if (rows.length === 0) return text("No posts.")
        return text(rows.map((p, i) => formatPost(p, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "find_subscriber",
    {
      title: "Find subscriber",
      description: "Find a beehiiv subscriber by email: status, tier, join date.",
      inputSchema: z.object({
        publication_id: z.string().describe("Publication id"),
        email: z.string().describe("Email address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ publication_id, email }) => {
      try {
        const s = await findSubscriber(publication_id, email)
        if (!s) return text(`No subscriber ${email}.`)
        return text(`${s.email ?? email}${s.status ? ` [${s.status}]` : ""}${s.tier ? ` — ${s.tier}` : ""}${s.created ? ` (since ${s.created})` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_publications",
    {
      title: "List publications",
      description: "Every beehiiv publication on the configured API key, with organisation, referral flag and active subscription count.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10).describe("Max publications to return"),
        order_by: z.enum(["created", "name"]).optional().describe("Sort field, defaults to created"),
        order_direction: z.enum(["asc", "desc"]).optional().describe("Sort direction, defaults to asc"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listPublications(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "publication_stats",
    {
      title: "Publication stats",
      description: "Engagement stats for one beehiiv publication: active free and premium subscriptions, open and click rates, totals sent, unique opens and clicks.",
      inputSchema: z.object({
        publication_id: z.string().describe("Publication id, e.g. 'pub_abc123'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: publication_stats ----
    const paywallMessage = await premiumRequired("publication_stats")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await publicationStats(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "list_tiers",
    {
      title: "List subscription tiers",
      description: "Paid subscription tiers of a beehiiv publication: name, status, active subscriber count and price points per currency and interval.",
      inputSchema: z.object({
        publication_id: z.string().describe("Publication id"),
        limit: z.number().int().min(1).max(100).default(25).describe("Max tiers to return"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_tiers ----
    const paywallMessage = await premiumRequired("list_tiers")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await listTiers(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BeehiivError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
