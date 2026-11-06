import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { hero, heroes } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "opendota-mcp", version: "1.0.0" })

  server.tool(
    "heroes",
    "Dota 2 heroes with attribute, roles and public win rates, most picked first.",
    {
      role: z.string().optional().describe('Optional role filter, e.g. "Carry", "Support", "Nuker", "Initiator"'),
      attr: z.string().optional().describe('Optional primary attribute: "str", "agi" or "int"'),
      limit: z.number().int().min(1).max(127).default(20).describe("How many heroes to show"),
    },
    async ({ role, attr, limit }) => {
      try {
        return text(await heroes(role, attr, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "hero",
    "One Dota 2 hero: base stats, roles, public win rate and pro record.",
    { name: z.string().min(1).describe('Hero name, e.g. "Anti-Mage"') },
    async ({ name }) => {
      try {
        return text(await hero(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
