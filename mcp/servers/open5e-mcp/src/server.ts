import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { monsterDetail, searchMonsters, searchSpells, spellDetail, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "open5e-mcp", version: "1.0.1" })

  server.tool(
    "search_spells",
    "Search 5e spells by name or text, optionally at one level.",
    {
      query: z.string().min(2).describe('Text to match, e.g. "fireball" or "charm"'),
      level: z.number().int().min(0).max(9).optional().describe("Spell level (0 for cantrips)"),
      limit: z.number().int().min(1).max(20).default(5).describe("Spells to return")
    },
    async (a) => {
      try {
        return text(await searchSpells(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "spell_detail",
    "One spell by slug: casting time, range, components, duration and full text.",
    {
      slug: z.string().min(2).describe('Spell slug, e.g. "fireball"')
    },
    async (a) => {
      try {
        return text(await spellDetail(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_monsters",
    "Search 5e monsters by name, type or environment.",
    {
      query: z.string().min(2).describe('Text to match, e.g. "goblin" or "dragon"'),
      limit: z.number().int().min(1).max(20).default(5).describe("Monsters to return")
    },
    async (a) => {
      try {
        return text(await searchMonsters(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "monster_detail",
    "One monster by slug: ability scores, hit points, actions and traits.",
    {
      slug: z.string().min(2).describe('Monster slug, e.g. "goblin" or "adult-red-dragon"')
    },
    async (a) => {
      try {
        return text(await monsterDetail(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
