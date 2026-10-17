import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { recent } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jpl-fireball-mcp", version: "1.0.0" })
  server.registerTool(
    "recent",
    {
      title: "Recent",
      description: "Recent fireball impacts.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recent(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "above_energy",
    {
      title: "Fireballs above an energy",
      description: "Fireball impacts with a kinetic energy at or above a threshold in kilotons, with impact energy, altitude and speed.",
      inputSchema: z.object( { minKt: z.number().describe("Minimum energy in kilotons.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement energy locally (paywall removed)
    try { return textError("Not yet implemented: energy") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "in_date_range",
    {
      title: "Fireballs in a date range",
      description: "Fireball impacts observed between two dates, with impact position, energy, altitude and speed.",
      inputSchema: z.object( { date_min: z.string().describe("Start date YYYY-MM-DD."), date_max: z.string().describe("End date YYYY-MM-DD."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement range locally (paywall removed)
    try { return textError("Not yet implemented: range") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
