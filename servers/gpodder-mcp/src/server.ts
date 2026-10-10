import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatPodcast, GpodderError, listTags, podcastsByTag, searchPodcasts, topPodcasts, searchOverlap } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gpodder-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_podcasts",
    {
      title: "Search podcasts",
      description: "Search the gPodder podcast directory: titles, authors, feeds, descriptions, subscriber counts.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'linux', 'true crime', 'history'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchPodcasts(query, limit)
        if (results.length === 0) return text(`No podcasts match "${query}".`)
        return text(`Podcasts for "${query}":\n\n${results.map((p, i) => formatPodcast(p, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "top_podcasts",
    {
      title: "Top podcasts",
      description: "Top podcasts on gPodder by subscriber count.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const results = await topPodcasts(limit)
        if (results.length === 0) return text("No top podcasts right now.")
        return text(`Top podcasts:\n\n${results.map((p, i) => formatPodcast(p, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "podcasts_by_tag",
    {
      title: "Podcasts by tag",
      description: "Browse podcasts by tag, e.g. 'history', 'comedy', 'technology'. Use list_tags to discover tags.",
      inputSchema: z.object({
        tag: z.string().describe("Tag slug, e.g. 'history'"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ tag, limit }) => {
      try {
        const results = await podcastsByTag(tag, limit)
        if (results.length === 0) return text(`No podcasts tagged "${tag}".`)
        return text(`Podcasts tagged "${tag}":\n\n${results.map((p, i) => formatPodcast(p, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_tags",
    {
      title: "List podcast tags",
      description: "Most-used podcast tags on gPodder with usage counts.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const tags = await listTags(limit)
        if (tags.length === 0) return text("No tags right now.")
        return text(`Top podcast tags:\n\n${tags.map((t, i) => `${i + 1}. ${t.tag}${t.usage !== undefined ? ` (${t.usage})` : ""}`).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_hosts",
    {
      title: "Search podcast hosts",
      description: "Aggregate a gPodder search by feed host: which publishers and networks the results come from, with result counts and subscriber totals.",
      inputSchema: z.object( { query: z.string().describe("Search text, e.g. 'linux', 'true crime'"), limit: z.number().int().min(1).max(20).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_hosts ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gpodder_search_hosts", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "search_overlap",
    {
      title: "Compare searches",
      description: "Run several gPodder searches at once and report the feeds that appear in more than one result set, so overlapping topics can be spotted.",
      inputSchema: z.object( { queries: z.array(z.string()).min(2).max(5).describe("Two to five search terms."), limit: z.number().int().min(1).max(20).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchOverlap(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof GpodderError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
