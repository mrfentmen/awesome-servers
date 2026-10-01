import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatCharacter, getCharacter, searchCharacters, StapiError } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "stapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_characters",
    {
      title: "Search characters",
      description: "Search Star Trek characters by name across all series and movies.",
      inputSchema: z.object({
        name: z.string().describe("Name to search, e.g. 'Picard', 'Spock', 'Janeway'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        const results = await searchCharacters(args.name, args.limit)
        if (results.length === 0) return text(`No Star Trek characters match "${args.name}".`)
        return text(`Star Trek characters for "${args.name}":\n\n${results.map((c, i) => formatCharacter(c, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_character",
    {
      title: "Get character details",
      description: "Get a Star Trek character by uid: gender, birth year and place, height, marital status.",
      inputSchema: z.object({
        uid: z.string().describe("Character uid, e.g. 'CHMA0000015352' (use search_characters to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ uid }) => {
      try {
        const c = await getCharacter(uid)
        if (!c) return text(`No Star Trek character ${uid}.`)
        return text(formatCharacter(c))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_species",
    {
      title: "Search species",
      description: "Search Star Trek species by name and report the traits STAPI records: warp capable, humanoid, reptilian, telepathic and so on.",
      inputSchema: z.object({
        name: z.string().describe("Species name, e.g. 'Vulcan' or 'Human'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: search_species ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_stapi_search_species", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "search_locations",
    {
      title: "Search locations",
      description: "Search Star Trek locations by name and report what STAPI classifies each one as: station, colony, shipyard, landmark and so on.",
      inputSchema: z.object({
        name: z.string().describe("Location name, e.g. 'Yorktown' or 'Starbase'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: search_locations ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_stapi_search_locations", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "search_organizations",
    {
      title: "Search organizations",
      description: "Search Star Trek organizations by name and report what kind each one is: military, research, government, law enforcement and so on.",
      inputSchema: z.object({
        name: z.string().describe("Organization name, e.g. 'Starfleet'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: search_organizations ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_stapi_search_organizations", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "list_series",
    {
      title: "List series",
      description: "Every Star Trek series in the STAPI database, with abbreviation, production years, original run, broadcaster, studio, season and episode counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: list_series ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_stapi_list_series", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof StapiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
