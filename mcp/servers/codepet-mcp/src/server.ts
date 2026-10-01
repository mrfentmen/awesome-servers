import { premiumTool } from "./gateway.js"
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { eventText, languageBreakdown, load, petExport, petProgressReport, safeEvent, save, statePath, type PetState } from "./state.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const eventSchema = { language: z.string().optional(), lines: z.number().int().min(0).max(500).default(0), status: z.string().optional(), tests: z.number().int().min(0).max(100).default(0), files: z.number().int().min(0).max(100).default(0) }
function status(state: PetState): string { return [`${state.name} | level ${state.level} | XP ${state.xp}`, `Food ${Math.round(state.hunger)} | happiness ${Math.round(state.happiness)} | energy ${Math.round(state.energy)}`, `Streak: ${state.streak} days | lines eaten: ${state.fedLines} | feedings: ${state.fedCount}`, `Languages: ${state.languages.join(", ") || "none"} | favorite: ${state.favoriteLang || "none"}`, `Achievements: ${state.achievements.length} | IDE events: ${state.ideEvents}`, `State file: ${statePath}`].join("\n") }
export function createServer(): McpServer {
  const server = new McpServer({ name: "codepet-mcp", version: "1.0.0" })
  server.registerTool(
    "get_pet_status",
    {
      title: "Get pet status",
      description: "Read CodePet's local status. No source code is read.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => text(status(await load()))
  )
  server.registerTool(
    "record_coding_event",
    {
      title: "Record coding event",
      description: "Record source free coding metadata for CodePet. Never pass source code to this tool.",
      inputSchema: z.object( eventSchema),
      annotations: WRITE,
    },
    async (input) => { const state = await load(); const event = safeEvent(input); state.ideEvents += 1; state.history = [...state.history.slice(-19), { at: new Date().toISOString(), kind: "ide", language: event.language, lines: event.lines, status: event.status }]; if (!state.languages.includes(event.language)) state.languages.push(event.language); state.happiness = Math.min(100, state.happiness + 1); state.energy = Math.min(100, state.energy + 1); await save(state); return text(eventText(state, event)) }
  )
  server.registerTool(
    "list_quests",
    {
      title: "List quests",
      description: "List the current CodePet quest ideas and progress based on local metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => { const state = await load(); const quests = [{ title: "First Bite", progress: state.fedCount, goal: 1 }, { title: "Polyglot Snack", progress: state.languages.length, goal: 3 }, { title: "Century Club", progress: state.fedLines, goal: 100 }, { title: "Three Day Build", progress: state.streak, goal: 3 }, { title: "Editor Buddy", progress: state.ideEvents, goal: 1 }]; return text(quests.map((q) => `${q.title}: ${Math.min(q.progress, q.goal)}/${q.goal}${q.progress >= q.goal ? " complete" : ""}`).join("\n")) }
  )
  server.registerTool(
    "clear_pet_history",
    {
      title: "Clear pet history",
      description: "Clear CodePet's local metadata event history. This does not affect level or achievements.",
      inputSchema: z.object({}),
      annotations: WRITE,
    },
    async () => { const state = await load(); state.history = []; await save(state); return text("CodePet metadata history cleared.") }
  )
  server.registerTool(
    "pet_progress_report",
    {
      title: "Pet progress report",
      description: "Derived progress view of CodePet: event kinds and statuses in the history window, rate per day and achievements.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await petProgressReport())
      } catch (error) {
        return textError(`Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  )
  server.registerTool(
    "language_breakdown",
    {
      title: "Language breakdown",
      description: "Per language event counts, line totals, statuses and last seen across CodePet's retained history.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await languageBreakdown())
      } catch (error) {
        return textError(`Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  )
  server.registerTool(
    "pet_export",
    {
      title: "Pet export",
      description: "Export CodePet's current stats as JSON, with or without the retained event history.",
      inputSchema: z.object({ include_history: z.boolean().describe("Include history events.").optional() }),
      annotations: READ_ONLY,
    },
    async (input) => {
      try {
        return text(await petExport(input))
      } catch (error) {
        return textError(`Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  )
  server.registerTool(
    "find_coding_quests",
    {
      title: "Find coding quests",
      description: "Find real open GitHub issues labeled good first issue for a programming language, with links, comment counts and update dates. These are public contribution opportunities, independent of local pet quests.",
      inputSchema: z.object({ language: z.string().max(40).optional(), limit: z.number().int().min(1).max(15).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: find_coding_quests ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_codepet_find_coding_quests", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
