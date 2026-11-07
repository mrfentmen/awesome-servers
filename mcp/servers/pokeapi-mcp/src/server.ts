import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getPokemon } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pokeapi-mcp", version: "1.0.0" })

  server.tool(
    "get_pokemon",
    "Data for one Pokémon",
    { name: z.string().min(1).describe("Pokémon name or id, e.g. pikachu") },
    async ({ name }) => {
      try {
        return text(await getPokemon(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
