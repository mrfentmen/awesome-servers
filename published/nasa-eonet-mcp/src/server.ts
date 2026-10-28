import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { EonetError, categories, eventDetail, eventsOnMap, listEvents, sources } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof EonetError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const CATEGORIES = [
  "wildfires",
  "severeStorms",
  "volcanoes",
  "seaLakeIce",
  "earthquakes",
  "floods",
  "landslides",
  "manmade",
  "snow",
  "temperatureExtremes",
  "drought",
  "dustHaze",
  "waterColor",
] as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-eonet-mcp", version: "1.0.0" })

  server.tool(
    "recent_events",
    "Natural events NASA is tracking, newest activity first.",
    {
      days: z.number().int().min(1).max(365).default(7).describe("Lookback window in days"),
      category: z.enum(CATEGORIES).optional().describe("Limit to one category"),
      status: z.enum(["open", "closed", "all"]).default("open").describe("Event status (default open)"),
      limit: z.number().int().min(1).max(50).default(15).describe("Events to show (1-50)"),
    },
    async ({ days, category, status, limit }) => {
      try {
        return text(await listEvents({ days, category, status, limit }))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "event_detail",
    "One event with its full track history and source links.",
    { id: z.string().min(4).describe("EONET id, e.g. EONET_6439") },
    async ({ id }) => {
      try {
        return text(await eventDetail(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "open_events_map",
    "Everything currently open in one category, with an average map centre.",
    {
      category: z.enum(CATEGORIES).describe("Category to list"),
      limit: z.number().int().min(1).max(50).default(15).describe("Events to show (1-50)"),
    },
    async ({ category, limit }) => {
      try {
        return text(await eventsOnMap(category, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_categories", "Every EONET category id and title.", {}, async () => {
    try {
      return text(await categories())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_sources", "Every agency and dataset feeding EONET.", {}, async () => {
    try {
      return text(await sources())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  return server
}
