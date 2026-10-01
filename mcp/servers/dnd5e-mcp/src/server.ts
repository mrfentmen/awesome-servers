import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { DndError, formatMonster, formatSpell, getClassInfo, getMonster, getSpell, listMonsters, listRaces } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dnd5e-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_monster",
    {
      title: "Get monster",
      description: "Get a D&D 5e monster by index slug (e.g. 'aboleth', 'adult-red-dragon', 'goblin').",
      inputSchema: z.object(
    { index: z.string().describe("Monster index slug") }),
      annotations: READ_ONLY,
    },
    async ({ index }) => {
      try {
        const m = await getMonster(index)
        if (!m) return text(`No monster "${index}". Try list_monsters for valid slugs.`)
        return text(formatMonster(m))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_spell",
    {
      title: "Get spell",
      description: "Get a D&D 5e spell by index slug (e.g. 'fireball', 'magic-missile', 'wish').",
      inputSchema: z.object(
    { index: z.string().describe("Spell index slug") }),
      annotations: READ_ONLY,
    },
    async ({ index }) => {
      try {
        const s = await getSpell(index)
        if (!s) return text(`No spell "${index}".`)
        return text(formatSpell(s))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_monsters",
    {
      title: "List monsters",
      description: "List D&D 5e SRD monsters by name (a-z), useful for finding valid slugs.",
      inputSchema: z.object(
    { limit: z.number().int().min(5).max(100).default(30) }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const monsters = await listMonsters(limit)
        return text(
          `SRD monsters (${monsters.length}):\n` +
            monsters.map((m, i) => `${i + 1}. ${m.name} [${m.index}]`).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_class",
    {
      title: "Get class",
      description: "Get a D&D 5e class overview — hit die, proficiencies, starting equipment.",
      inputSchema: z.object(
    { index: z.string().describe("Class index slug, e.g. 'barbarian', 'wizard'") }),
      annotations: READ_ONLY,
    },
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
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_spells",
    {
      title: "List spells",
      description: "Browse the D&D 5e SRD spell list filtered by level, school, ritual or concentration, with optional text search, showing casting time, range and components metadata.",
      inputSchema: z.object( { level: z.number().describe("Spell level 0 to 9.").optional(), school: z.string().describe("School name, e.g. evocation.").optional(), search: z.string().describe("Text to look for.").optional(), ritual_only: z.boolean().describe("Only ritual spells.").optional(), concentration_only: z.boolean().describe("Only concentration spells.").optional(), limit: z.number().describe("Max spells.").optional(), detail_limit: z.number().describe("Max spells expanded with full casting data.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_spells ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_dnd5e_list_spells", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "list_magic_items",
    {
      title: "List magic items",
      description: "Browse the D&D 5e SRD magic item list, reading each item record for rarity, attunement requirement and equipment category, then filtering by rarity, attunement or name.",
      inputSchema: z.object( { rarity: z.string().describe("Rarity, e.g. rare.").optional(), search: z.string().describe("Name fragment.").optional(), attunement: z.string().describe("required or none.").optional(), limit: z.number().describe("Max items scanned.").optional(), detail_limit: z.number().describe("Max item records to read.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_magic_items ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_dnd5e_list_magic_items", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "list_races",
    {
      title: "List races",
      description: "List the D&D 5e SRD playable races and optionally fetch each full record with speed, size, darkvision, languages, subraces, ability score increases and trait descriptions.",
      inputSchema: z.object( { include_details: z.boolean().describe("Fetch full race records.").optional(), trait_limit: z.number().describe("Max traits per race.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listRaces(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DndError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
