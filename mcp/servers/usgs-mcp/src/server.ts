import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { biggestQuakes, formatQuake, latestQuakes, quakeDetail, quakesNear, queryQuakes, UsgsError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "usgs-mcp",
    version: "1.0.0",
  })

  server.tool(
    "latest_quakes",
    "Latest earthquakes from the USGS feed.",
    {
      magnitude: z.enum(["all", "1.0", "2.5", "4.5"]).default("2.5").describe("Minimum magnitude band"),
      timeframe: z.enum(["hour", "day", "week", "month"]).default("day").describe("Lookback window"),
      limit: z.number().int().min(1).max(50).default(15),
    },
    async ({ magnitude, timeframe, limit }) => {
      try {
        const quakes = await latestQuakes(magnitude, timeframe, limit)
        if (quakes.length === 0) return text(`No M${magnitude}+ quakes in the last ${timeframe}.`)
        return text(`Latest M${magnitude}+ earthquakes (${timeframe}):\n\n${quakes.map((q, i) => `${i + 1}. ${formatQuake(q)}`).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "query_quakes",
    "Query earthquakes by magnitude, count, and start time.",
    {
      minMagnitude: z.number().min(0).max(10).default(4.5).describe("Minimum magnitude"),
      limit: z.number().int().min(1).max(50).default(10),
      starttime: z.string().optional().describe("Start time, e.g. '2026-08-01'"),
    },
    async ({ minMagnitude, limit, starttime }) => {
      try {
        const quakes = await queryQuakes(minMagnitude, limit, starttime)
        if (quakes.length === 0) return text(`No quakes M${minMagnitude}+${starttime ? ` since ${starttime}` : ""}.`)
        return text(`Quakes M${minMagnitude}+${starttime ? ` since ${starttime}` : ""}:\n\n${quakes.map((q, i) => `${i + 1}. ${formatQuake(q)}`).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "quake_detail",
    "Full record for one earthquake by its USGS event id.",
    { id: z.string().min(4).describe("USGS event id, e.g. us7000abcd") },
    async ({ id }) => {
      try {
        return text(formatQuake(await quakeDetail(id)))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "quakes_near",
    "Earthquakes within a radius of a coordinate, strongest first.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
      radius_km: z.number().min(1).max(20000).default(500).describe("Search radius in km"),
      min_magnitude: z.number().min(0).max(10).default(2.5).describe("Minimum magnitude"),
      limit: z.number().int().min(1).max(50).default(10),
    },
    async ({ latitude, longitude, radius_km, min_magnitude, limit }) => {
      try {
        const quakes = await quakesNear(latitude, longitude, radius_km, min_magnitude, limit)
        if (quakes.length === 0) return text(`No M${min_magnitude}+ quakes within ${radius_km} km of ${latitude}, ${longitude}.`)
        return text(`Quakes within ${radius_km} km (${quakes.length}):\n\n${quakes.map((q, i) => `${i + 1}. ${formatQuake(q)}`).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "biggest_quakes",
    "Strongest earthquakes over the last N days.",
    {
      days: z.number().int().min(1).max(365).default(7).describe("Lookback in days"),
      min_magnitude: z.number().min(0).max(10).default(4.5).describe("Minimum magnitude"),
      limit: z.number().int().min(1).max(50).default(10),
    },
    async ({ days, min_magnitude, limit }) => {
      try {
        const quakes = await biggestQuakes(days, min_magnitude, limit)
        if (quakes.length === 0) return text(`No M${min_magnitude}+ quakes in the last ${days} days.`)
        return text(`Strongest quakes in the last ${days} days (${quakes.length}):\n\n${quakes.map((q, i) => `${i + 1}. ${formatQuake(q)}`).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof UsgsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
