import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { characterDetail, searchCharacters, searchEpisodes, searchLocations, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "rickandmorty-mcp", version: "1.0.1" })

  server.tool(
    "search_characters",
    "Find characters by name, status or species.",
    {
      name: z.string().min(2).optional().describe('Name to match, e.g. "Rick" (leave out to browse)'),
      status: z.enum(["alive", "dead", "unknown"]).optional().describe("Life status filter"),
      species: z.string().min(2).optional().describe('Species, e.g. "Human" or "Alien"'),
      limit: z.number().int().min(1).max(20).default(5).describe("Characters to return")
    },
    async (a) => {
      try {
        return text(await searchCharacters(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "character_detail",
    "One character by id, with origin, location, episodes and image link.",
    {
      id: z.number().int().min(1).max(1000).describe("Character id, 1-826")
    },
    async (a) => {
      try {
        return text(await characterDetail(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_locations",
    "Find locations and dimensions by name.",
    {
      name: z.string().min(2).describe('Location name, e.g. "Earth"'),
      limit: z.number().int().min(1).max(20).default(5).describe("Locations to return")
    },
    async (a) => {
      try {
        return text(await searchLocations(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_episodes",
    "Find episodes by name or code, with air dates.",
    {
      name: z.string().min(2).describe('Episode name, e.g. "Pilot" or "S01"'),
      limit: z.number().int().min(1).max(20).default(5).describe("Episodes to return")
    },
    async (a) => {
      try {
        return text(await searchEpisodes(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
