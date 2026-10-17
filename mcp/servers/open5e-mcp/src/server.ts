import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { monsters, spells } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "open5e-mcp", version: "1.0.0" })
  server.registerTool(
    "monsters",
    {
      title: "Monsters",
      description: "List monsters with optional search.",
      inputSchema: z.object( { search: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await monsters(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "spells",
    {
      title: "Spells",
      description: "List spells with optional search.",
      inputSchema: z.object( { search: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spells(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "monster_detail",
    {
      title: "Monster detail",
      description: "Full statblock for one Open5e monster: size, type, alignment, challenge rating, armour class, hit points, speed, ability scores, languages, traits, actions and reactions.",
      inputSchema: z.object({ name: z.string().describe("Monster name, e.g. 'goblin' or 'adult red dragon'."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "spell_detail",
    {
      title: "Spell detail",
      description: "Full Open5e entry for one spell: level, school, casting time, range, components, duration, ritual flag, who can cast it and the description.",
      inputSchema: z.object({ name: z.string().describe("Spell name, e.g. 'fireball'."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "classes",
    {
      title: "Classes",
      description: "List Open5e character classes with hit die, hit point progression, saving throw and armour proficiencies, and available archetypes.",
      inputSchema: z.object({ limit: z.number().describe("Max classes, 1-30, default 12.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement classes locally (paywall removed)
    try { return textError("Not yet implemented: classes") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
