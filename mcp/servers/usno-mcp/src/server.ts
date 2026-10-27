import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { moonPhases, seasons, sunMoonDay, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "usno-mcp", version: "1.0.0" })

  server.tool(
    "sun_moon_day",
    "Sun and moon events for one day at a latitude and longitude.",
    {
      date: z.string().describe("Date, YYYY-MM-DD"),
      latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
      longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
      timeZone: z.number().min(-12).max(14).default(0).describe("UTC offset in hours")
    },
    async (a) => {
      try {
        return text(await sunMoonDay(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "moon_phases",
    "Every new, first quarter, full and last quarter moon in a year.",
    {
      year: z.number().int().min(1700).max(2100).describe("Calendar year"),
      limit: z.number().int().min(1).max(60).default(12).describe("Phases to return")
    },
    async (a) => {
      try {
        return text(await moonPhases(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "seasons",
    "Equinoxes, solstices, perihelion and aphelion for a year.",
    {
      year: z.number().int().min(1700).max(2100).describe("Calendar year"),
      timeZone: z.number().min(-12).max(14).default(0).describe("UTC offset in hours")
    },
    async (a) => {
      try {
        return text(await seasons(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
