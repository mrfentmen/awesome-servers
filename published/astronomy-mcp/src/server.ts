import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { moonPhase, solarTimes, sunPosition, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "astronomy-mcp", version: "1.0.0" })

  server.tool(
    "solar_times",
    "Sunrise, sunset, solar noon, civil twilight and day length for a place and date.",
    {
      lat: z.number().min(-90).max(90).describe("Latitude in degrees, north positive"),
      lon: z.number().min(-180).max(180).describe("Longitude in degrees, east positive"),
      date: z.string().optional().describe("Date as YYYY-MM-DD (UTC); today when omitted"),
      utcOffset: z.number().min(-12).max(14).optional().describe("Optional local UTC offset in hours for the output, e.g. -5 or 5.5")
    },
    async (a) => {
      try {
        return text(await solarTimes(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "sun_position",
    "Sun altitude, azimuth, declination and subsolar point at an instant.",
    {
      lat: z.number().min(-90).max(90).describe("Latitude in degrees"),
      lon: z.number().min(-180).max(180).describe("Longitude in degrees"),
      datetime: z.string().optional().describe("ISO instant, e.g. 2026-06-21T12:00:00Z; now when omitted")
    },
    async (a) => {
      try {
        return text(await sunPosition(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "moon_phase",
    "Moon phase name, illumination, age in days, and the next full and new moon dates.",
    {
      datetime: z.string().optional().describe("ISO instant; now when omitted")
    },
    async (a) => {
      try {
        return text(await moonPhase(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
