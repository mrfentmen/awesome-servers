import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatEvent, recommendEvents, searchEvents, SeatGeekError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "seatgeek-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_events",
    {
      title: "Search events",
      description: "Concerts, sports and theater with venues, dates, ticket prices.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Taylor Swift', 'Yankees'"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchEvents(query, limit)
        if (rows.length === 0) return text(`No events for "${query}".`)
        return text(rows.map((e, i) => formatEvent(e, i)).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recommend_events",
    {
      title: "Events near me",
      description: "Recommended events near coordinates.",
      inputSchema: z.object({
        lat: z.number().min(-90).max(90).describe("Latitude"),
        lon: z.number().min(-180).max(180).describe("Longitude"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, limit }) => {
      try {
        const rows = await recommendEvents(lat, lon, limit)
        if (rows.length === 0) return text("No events nearby.")
        return text(rows.map((e, i) => formatEvent(e, i)).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SeatGeekError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
