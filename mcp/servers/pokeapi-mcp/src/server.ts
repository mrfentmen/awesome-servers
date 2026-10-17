import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { pokemonInfo, searchPokemon, pokemonAbilities } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pokeapi-mcp", version: "1.0.0" })
  server.registerTool(
    "pokemon_info",
    {
      title: "Pokemon info",
      description: "Get details for a Pokemon by name or ID.",
      inputSchema: z.object( { name: z.string().describe("Pokemon name or ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pokemonInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search_pokemon",
    {
      title: "Search pokemon",
      description: "Search Pokemon by partial name.",
      inputSchema: z.object( { query: z.string().describe("Partial name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPokemon(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "pokemon_evolution",
    {
      title: "Pokemon evolution",
      description: "The full evolution chain for a Pokemon: every stage with its trigger condition, plus habitat, growth rate and capture rate.",
      inputSchema: z.object( { name: z.string().describe("Pokemon name or ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement evolution locally (paywall removed)
    try { return textError("Not yet implemented: evolution") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "type_matchup",
    {
      title: "Type matchup",
      description: "A Pokemon type's full damage relations in both directions: what it hits hard, resists and cannot touch, and what hits it.",
      inputSchema: z.object( { type: z.string().describe("Type name, e.g. fire or water.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement matchup locally (paywall removed)
    try { return textError("Not yet implemented: matchup") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "pokemon_abilities",
    {
      title: "Pokemon abilities",
      description: "Every ability a Pokemon has by slot, each with its effect text and whether it is in the main series.",
      inputSchema: z.object( { name: z.string().describe("Pokemon name or ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pokemonAbilities(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
