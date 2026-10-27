import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatQuake, latestQuakes, queryQuakes, UsgsError } from "./api.js"

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

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof UsgsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
