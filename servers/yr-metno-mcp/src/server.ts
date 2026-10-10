import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_forecast, m0_nowcast, sunTimes } from './api.js'
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'yr-metno-mcp', version: '1.0.0' })
server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Compact location forecast for a point.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_forecast(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "nowcast",
    {
      title: "Nowcast",
      description: "Short-term nowcast for a point.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_nowcast(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sun_times",
    {
      title: "Sun times",
      description: "MET Norway's sunrise, sunset and the three twilight windows for a coordinate and date, in the UTC offset you supply.",
      inputSchema: z.object( { lat: z.number().describe("Latitude -90 to 90."), lon: z.number().describe("Longitude -180 to 180."), date: z.string().describe("Date as YYYY-MM-DD, default today.").optional(), offset: z.string().describe("UTC offset as +HH:MM, default +00:00.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: sun_times ----
    const paywallMessage = await premiumRequired("sun_times")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await sunTimes(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
