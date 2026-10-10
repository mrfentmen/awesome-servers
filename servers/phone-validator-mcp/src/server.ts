import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { validate, zoneTime, countryContext } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "phone-validator-mcp", version: "1.0.0" })
  server.registerTool(
    "validate",
    {
      title: "Validate",
      description: "Check a phone number and show its parts.",
      inputSchema: z.object( { number: z.string().describe("Phone number in any format."), country: z.string().describe("Two letter country code for context.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await validate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "zone_time",
    {
      title: "Zone time",
      description: "Current local date, time, weekday and daylight saving flag for an IANA time zone, from the TimeAPI.io public API.",
      inputSchema: z.object( { timezone: z.string().max(60).describe("IANA time zone like Europe/London.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: zone_time ----
    const paywallMessage = await premiumRequired("zone_time")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await zoneTime(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "country_context",
    {
      title: "Country context",
      description: "The country a phone number belongs to, then what that country is like: World Bank region, income level, capital and latest population.",
      inputSchema: z.object( { number: z.string().max(40).describe("Phone number in any format.").optional(), country: z.string().max(2).describe("Two letter country code as a hint.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: country_context ----
    const paywallMessage = await premiumRequired("country_context")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await countryContext(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
