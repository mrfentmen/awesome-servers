import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { describe, next, previousRuns, validate } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cron-mcp", version: "1.0.0" })
  server.registerTool(
    "describe",
    {
      title: "Describe",
      description: "Describe a cron expression in words.",
      inputSchema: z.object( { expression: z.string().describe("5 field cron expression.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await describe(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "next",
    {
      title: "Next",
      description: "Next run times for a cron expression.",
      inputSchema: z.object( { expression: z.string().describe("5 field cron expression."), count: z.number().describe("Number of runs.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await next(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "previous_runs",
    {
      title: "Previous runs",
      description: "The N times a cron expression already fired, counting backwards from now or from a reference instant, which is how you check whether a job has been running.",
      inputSchema: z.object( { expression: z.string().describe("5 field cron expression, e.g. */5 * * * *"), before: z.string().describe("Count backwards from this instant, e.g. 2026-09-27T00:00:00Z.").optional(), count: z.number().describe("How many past runs.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await previousRuns(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "validate",
    {
      title: "Validate",
      description: "Check whether a cron expression parses, reporting the parse error and the field count when it does not, and the next three runs when it does.",
      inputSchema: z.object( { expression: z.string().describe("Cron expression to check."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await validate(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "schedule_holidays",
    {
      title: "Schedule holidays",
      description: "Look up national and regional public holidays from Nager.Date for planning cron exclusions. Defaults to the current year and US; regional records are explicitly marked.",
      inputSchema: z.object({ country: z.string().length(2).optional(), year: z.number().int().min(1970).max(2100).optional(), limit: z.number().int().min(1).max(50).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: schedule_holidays ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cron_schedule_holidays", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "solar_schedule",
    {
      title: "Solar schedule",
      description: "Fetch sunrise, sunset, solar noon and civil twilight UTC times for scheduling daylight tasks. Defaults to New York City today; source Sunrise-Sunset.org.",
      inputSchema: z.object({ latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), date: z.string().max(10).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: solar_schedule ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cron_solar_schedule", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
