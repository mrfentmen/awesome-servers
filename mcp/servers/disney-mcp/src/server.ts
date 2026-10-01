import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { character, characters, charactersByMedium } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "disney-mcp", version: "1.0.0" })
  server.registerTool(
    "character",
    {
      title: "Character",
      description: "Get a character by id or name.",
      inputSchema: z.object( { query: z.string().describe("Character name or id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await character(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "characters",
    {
      title: "Characters",
      description: "List characters.",
      inputSchema: z.object( { page: z.number().describe("Page number.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await characters(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "character_appearances",
    {
      title: "Character appearances",
      description: "Every screen and park appearance for a Disney character across films, short films, TV shows, video games and park attractions, plus allies and enemies and the image and profile links.",
      inputSchema: z.object( { query: z.string().describe("Character name or id."), limit: z.number().describe("Max items listed per medium.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: character_appearances ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_disney_character_appearances", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "character_directory",
    {
      title: "Character directory",
      description: "Browse the Disney character catalogue by page with per medium appearance counts for films, short films, TV, video games and park attractions, filterable to one medium or a minimum appearance count.",
      inputSchema: z.object( { page: z.number().describe("Page number, 1 based.").optional(), page_size: z.number().describe("Records per page.").optional(), medium: z.string().describe("films, shortFilms, tvShows, videoGames or parkAttractions.").optional(), min_appearances: z.number().describe("Keep only characters with at least this many appearances.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: character_directory ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_disney_character_directory", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "characters_by_medium",
    {
      title: "Characters by medium",
      description: "Find which Disney characters appear in a given film, show, game or attraction title by scanning the character catalogue, returning each matching title with its character list.",
      inputSchema: z.object( { title: z.string().describe("Title fragment, e.g. The Lion King."), medium: z.string().describe("Restrict to one medium.").optional(), max_pages: z.number().describe("Pages of 50 characters to scan.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await charactersByMedium(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
