import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  DndError,
  formatMonster,
  formatSpell,
  getClassInfo,
  getMonster,
  getSpell,
  listMonsters,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dnd5e-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_monster",
    "Get a D&D 5e monster by index slug (e.g. 'aboleth', 'adult-red-dragon', 'goblin').",
    { index: z.string().describe("Monster index slug") },
    async ({ index }) => {
      try {
        const m = await getMonster(index)
        if (!m) return text(`No monster "${index}". Try list_monsters for valid slugs.`)
        return text(formatMonster(m))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_spell",
    "Get a D&D 5e spell by index slug (e.g. 'fireball', 'magic-missile', 'wish').",
    { index: z.string().describe("Spell index slug") },
    async ({ index }) => {
      try {
        const s = await getSpell(index)
        if (!s) return text(`No spell "${index}".`)
        return text(formatSpell(s))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_monsters",
    "List D&D 5e SRD monsters by name (a-z), useful for finding valid slugs.",
    { limit: z.number().int().min(5).max(100).default(30) },
    async ({ limit }) => {
      try {
        const monsters = await listMonsters(limit)
        return text(
          `SRD monsters (${monsters.length}):\n` +
            monsters.map((m, i) => `${i + 1}. ${m.name} [${m.index}]`).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_class",
    "Get a D&D 5e class overview — hit die, proficiencies, starting equipment.",
    { index: z.string().describe("Class index slug, e.g. 'barbarian', 'wizard'") },
    async ({ index }) => {
      try {
        const c = await getClassInfo(index)
        if (!c) return text(`No class "${index}".`)
        const lines = [
          `${c.name} — hit die d${c.hit_die ?? "?"}`,
          c.proficiency_choices?.length
            ? `Skill choices:\n` +
              c.proficiency_choices
                .map(
                  (pc, i) =>
                    `  ${i + 1}. ` +
                    (pc.from?.options ?? [])
                      .map((o) => o.item?.name ?? "?")
                      .slice(0, 8)
                      .join(", ")
                )
                .join("\n")
            : "",
          c.starting_equipment?.length
            ? `Starting equipment:\n` +
              c.starting_equipment
                .map((e) => `  • ${e.quantity ?? 1}× ${e.equipment?.name ?? "?"}`)
                .join("\n")
            : "",
          `https://www.dnd5eapi.co/api/classes/${c.index}`,
        ].filter(Boolean)
        return text(lines.join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DndError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
