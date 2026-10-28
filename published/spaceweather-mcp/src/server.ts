import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { alerts, auroraForecast, kpIndex, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "spaceweather-mcp", version: "1.0.0" })

  server.tool(
    "kp_index",
    "Recent planetary Kp values (3-hourly) and the geomagnetic storm level they imply.",
    {
      hours: z.number().int().min(1).max(24).default(8).describe("How many recent 3-hour entries to list")
    },
    async (a) => {
      try {
        return text(await kpIndex(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "aurora_forecast",
    "Aurora visibility probability from the OVATION model, at a location or as a global summary.",
    {
      lat: z.number().min(-90).max(90).optional().describe("Latitude to look up, e.g. 60"),
      lon: z.number().min(-180).max(180).optional().describe("Longitude to look up, e.g. 19")
    },
    async (a) => {
      try {
        return text(await auroraForecast(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "alerts",
    "The latest SWPC alerts and warnings with issue times and message text.",
    {
      limit: z.number().int().min(1).max(20).default(5).describe("How many recent alerts to show")
    },
    async (a) => {
      try {
        return text(await alerts(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
