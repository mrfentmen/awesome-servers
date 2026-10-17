import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { character, house, spells } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "harry-potter-mcp", version: "1.0.0" })
  server.registerTool(
    "character",
    {
      title: "Character",
      description: "Character by name.",
      inputSchema: z.object( { name: z.string().describe("Character name."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await character(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "house",
    {
      title: "House",
      description: "Members of a house.",
      inputSchema: z.object( { house: z.string().describe("Gryffindor, Slytherin, Ravenclaw, or Hufflepuff."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await house(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "spells",
    {
      title: "Spells",
      description: "All spells.",
      inputSchema: z.object( { limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spells(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "character_profile",
    {
      title: "Character profile",
      description: "One character's full record: alternate names, appearance, birth date, ancestry, wand, patronus, Hogwarts role and actors.",
      inputSchema: z.object( { name: z.string().max(120).describe("Character name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_spells",
    {
      title: "Search spells",
      description: "Search spell names and descriptions for a word, with how many spells matched out of the whole list.",
      inputSchema: z.object( { query: z.string().max(120).describe("Words to look for."), limit: z.number().int().min(1).max(77).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement spells locally (paywall removed)
    try { return textError("Not yet implemented: spells") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
