import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatForecast, formatPlace, geocode, getForecast, MeteoError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "open-meteo-mcp",
    version: "1.0.0",
  })

  server.tool(
    "geocode",
    "Find a place by name and get its coordinates.",
    { place: z.string().describe("Place name, e.g. 'Tokyo' or 'Austin, TX'"), count: z.number().int().min(1).max(10).default(5) },
    async ({ place, count }) => {
      try {
        const results = await geocode(place, count)
        if (results.length === 0) return text(`No place found for "${place}".`)
        return text(`Places matching "${place}":\n\n${results.map((p, i) => `${i + 1}. ${formatPlace(p)}`).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_forecast",
    "Weather forecast for coordinates.",
    {
      latitude: z.number().describe("Latitude, e.g. 40.71"),
      longitude: z.number().describe("Longitude, e.g. -74.0"),
      days: z.number().int().min(1).max(14).default(5),
    },
    async ({ latitude, longitude, days }) => {
      try {
        const f = await getForecast(latitude, longitude, days)
        return text(formatForecast(f, `${latitude}, ${longitude}`))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_forecast_for_place",
    "Weather forecast for a named place, geocoded for you.",
    { place: z.string().describe("Place name, e.g. 'Reykjavik'"), days: z.number().int().min(1).max(14).default(5) },
    async ({ place, days }) => {
      try {
        const results = await geocode(place, 1)
        if (results.length === 0) return text(`No place found for "${place}".`)
        const p = results[0]
        if (p.latitude == null || p.longitude == null) return text(`No coordinates for "${place}".`)
        const f = await getForecast(p.latitude, p.longitude, days)
        return text(formatForecast(f, `${p.name}${p.country ? `, ${p.country}` : ""}`))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MeteoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
