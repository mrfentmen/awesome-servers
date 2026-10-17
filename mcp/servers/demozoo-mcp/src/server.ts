import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { DemozooError, formatProduction, formatReleaser, formatSummary, getProduction, getReleaser, searchProductions, referenceCatalogue, partiesAndScenes } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "demozoo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_productions",
    {
      title: "Search demoscene productions",
      description: "Search Demozoo for demoscene productions: demos, intros, graphics, music. Finds titles across 390k+ entries.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'second reality', 'farbrausch', 'amiga cracktro'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchProductions(query, limit)
        if (results.length === 0) return text(`No Demozoo productions match "${query}".`)
        return text(`Demozoo results for "${query}":\n\n${results.map((p, i) => formatSummary(p, i)).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_production",
    {
      title: "Get production details",
      description: "Get a Demozoo production by id: authors, release date, platforms, credits, and download links.",
      inputSchema: z.object({
        id: z.string().describe("Numeric Demozoo production id, e.g. '1' (use search_productions to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const p = await getProduction(id)
        if (!p) return text(`No Demozoo production with id ${id}.`)
        return text(formatProduction(p))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_releaser",
    {
      title: "Get group or scener profile",
      description: "Get a Demozoo group or scener profile by id: nicks, group memberships, members.",
      inputSchema: z.object({
        id: z.string().describe("Numeric Demozoo releaser id, e.g. '16685' (shown in production credits)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const r = await getReleaser(id)
        if (!r) return text(`No Demozoo group/scener with id ${id}.`)
        return text(formatReleaser(r))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "reference_catalogue",
    {
      title: "Reference catalogue",
      description: "The Demozoo taxonomies used to classify productions: every production type with its supertype, and every platform, optionally filtered by name.",
      inputSchema: z.object( { include_platforms: z.boolean().describe("Include the platform list.").optional(), search: z.string().describe("Name fragment.").optional(), limit: z.number().describe("Max rows per list.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await referenceCatalogue(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  server.registerTool(
    "parties_and_scenes",
    {
      title: "Parties and scenes",
      description: "Browse Demozoo demoparty records: parties with dates, locations, organisers and websites, party series, or bulletin board systems with their location coordinates.",
      inputSchema: z.object( { kind: z.string().describe("parties, party_series or bbses.").optional(), query: z.string().describe("Name fragment.").optional(), limit: z.number().describe("Max records.").optional(), start_year: z.number().describe("Only records from this year onwards.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await partiesAndScenes(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  server.registerTool(
    "releaser_productions",
    {
      title: "Releaser productions",
      description: "Every production credited to a Demozoo releaser or group, with authors, release dates, platforms and types, plus a platform usage breakdown for that releaser.",
      inputSchema: z.object( { releaser_id: z.number().describe("Demozoo releaser id, e.g. 43417."), limit: z.number().describe("Max productions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement productions locally (paywall removed)
    try { return textError("Not yet implemented: productions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "platform_productions",
    {
      title: "Platform productions",
      description: "Browse the Demozoo production archive by platform, resolving a platform name or id from the catalogue of 94 platforms and listing matching productions with authors and release dates.",
      inputSchema: z.object( { platform: z.string().describe("Platform name or id, e.g. Amiga AGA or 6."), limit: z.number().describe("Max productions.").optional(), start_year: z.number().describe("Only productions released in this year or later.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement productions locally (paywall removed)
    try { return textError("Not yet implemented: productions") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DemozooError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
