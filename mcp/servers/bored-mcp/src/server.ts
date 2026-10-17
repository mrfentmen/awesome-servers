import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { activityByParticipants, activityByType, randomActivity } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bored-mcp", version: "1.0.0" })
  server.registerTool(
    "random_activity",
    {
      title: "Random activity",
      description: "Get a random activity.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomActivity(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "activity_by_type",
    {
      title: "Activity by type",
      description: "Get an activity of a type.",
      inputSchema: z.object( { type: z.string().describe("Activity type (education, recreational, social, diy, charity, cooking, relaxation, music, busywork).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await activityByType(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "activity_by_participants",
    {
      title: "Activity by participants",
      description: "Get an activity for N participants.",
      inputSchema: z.object( { participants: z.number().describe("Number of participants.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await activityByParticipants(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "activity_catalogue",
    {
      title: "Activity catalogue",
      description: "Deduplicated full catalogue of Bored API activities across types and group sizes, with price, duration, kid friendly counts and optionally only free or kid friendly entries.",
      inputSchema: z.object( { type: z.string().describe("Restrict to a type, e.g. social.").optional(), kid_friendly_only: z.boolean().describe("Only kid friendly activities.").optional(), free_only: z.boolean().describe("Only zero cost activities.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement catalogue locally (paywall removed)
    try { return textError("Not yet implemented: catalogue") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "activity_search",
    {
      title: "Activity search",
      description: "Search Bored API activities by keyword with optional participant count, maximum price, accessibility level and kid friendly flag, filtering the full activity set rather than one criterion.",
      inputSchema: z.object( { keyword: z.string().describe("Word or phrase to look for.").optional(), type: z.string().describe("Activity type.").optional(), participants: z.number().describe("Group size 1 to 4.").optional(), max_price: z.number().describe("Maximum price in dollars.").optional(), accessibility: z.string().describe("Accessibility fragment, e.g. no challenges.").optional(), kid_friendly: z.boolean().describe("Only kid friendly.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
