import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { exercise, exercises, muscles } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wger-mcp", version: "1.0.0" })
  server.registerTool(
    "exercises",
    {
      title: "Exercises",
      description: "List exercises with filters.",
      inputSchema: z.object( { language: z.number().describe("Language ID, 2 is English.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exercises(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "exercise",
    {
      title: "Exercise",
      description: "Details for one exercise.",
      inputSchema: z.object( { id: z.number().describe("Exercise ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exercise(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "muscles",
    {
      title: "Muscles",
      description: "List muscles.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await muscles(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "equipment_list",
    {
      title: "Equipment list",
      description: "The equipment wger.de records, from barbells to rowing machines, which the exercise and muscle tools never list.",
      inputSchema: z.object( { limit: z.number().describe("Max equipment.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement list locally (paywall removed)
    try { return textError("Not yet implemented: list") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exercise_detail",
    {
      title: "Exercise detail",
      description: "One wger.de exercise's full record joined together: category, muscles, equipment and variations, which the listings never give in one place.",
      inputSchema: z.object( { exerciseId: z.number().describe("wger exercise id, e.g. 9."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exercise_categories",
    {
      title: "Exercise categories",
      description: "List the exercise category IDs and names used to classify wger exercises.",
      inputSchema: z.object( { limit: z.number().describe("Maximum categories, 1-100.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement categories locally (paywall removed)
    try { return textError("Not yet implemented: categories") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
