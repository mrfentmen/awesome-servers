import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatSet, getSet, RebrickableError, searchSets, setParts, eraCensus, themeTree, colorRoster } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rebrickable-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_sets",
    {
      title: "Search sets",
      description: "LEGO sets by keyword with years and part counts.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Millennium Falcon'"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchSets(query, limit)
        if (rows.length === 0) return text(`No LEGO sets for "${query}".`)
        return text(rows.map((s, i) => formatSet(s, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_set",
    {
      title: "Get set",
      description: "One LEGO set with part count and link.",
      inputSchema: z.object({
        number: z.string().describe("Set number, e.g. '75192-1' (use search_sets)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ number }) => {
      try {
        return text(await getSet(number))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "set_parts",
    {
      title: "Set parts",
      description: "Parts inventory of one set with colors and quantities.",
      inputSchema: z.object({
        number: z.string().describe("Set number, e.g. '75192-1'"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ number, limit }) => {
      try {
        const rows = await setParts(number, limit)
        if (rows.length === 0) return text(`No parts for set ${number}.`)
        return text(rows.map((p, i) => `${i + 1}. ${p}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "era_census",
    {
      title: "LEGO era census",
      description: "How Rebrickable's set catalogue is spread over time: sets per decade, median and mean parts per set, and the themes that fill each decade. Reads Rebrickable's public sets and themes downloads, no API key.",
      inputSchema: z.object({
        fromYear: z.number().describe("First year, 1900-2100.").optional(),
        toYear: z.number().describe("Last year, 1900-2100.").optional(),
        limit: z.number().describe("Leading themes to name per decade, 1-12.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: era_census ----
    const paywallMessage = await premiumRequired("era_census")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await eraCensus(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "theme_tree",
    {
      title: "LEGO theme tree",
      description: "The Rebrickable theme hierarchy around a theme name: its path to the root, how many sets are filed under it, and its child and grandchild themes with their set counts. Reads Rebrickable's public themes and sets downloads, no API key.",
      inputSchema: z.object({
        theme: z.string().describe("Theme name, e.g. Star Wars, Technic, Adventurers"),
        depth: z.number().describe("Levels of children to show, 1-4.").optional(),
        limit: z.number().describe("Max themes per level, 1-30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: theme_tree ----
    const paywallMessage = await premiumRequired("theme_tree")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await themeTree(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "color_roster",
    {
      title: "LEGO color roster",
      description: "Rebrickable's published colour table: each colour with its hex, transparency, set and part tallies and the years it was in use, ordered by how common it is, with the rarest in the filtered set. No API key.",
      inputSchema: z.object({
        minSets: z.number().describe("Only colours used in at least this many sets.").optional(),
        transparent: z.boolean().describe("Filter to transparent or opaque colours only.").optional(),
        limit: z.number().describe("Max colours to list, 1-60.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await colorRoster(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof RebrickableError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
