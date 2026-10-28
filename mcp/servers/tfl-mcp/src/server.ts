import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { lineStatus, searchStops, stationArrivals, SourceError, roadDisruptions, stopDetail, lineRoute } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "tfl-mcp", version: "1.0.2" })

  server.tool(
    "line_status",
    "Current status of TfL lines by mode, with disruption reasons when something is wrong.",
    {
      modes: z.string().default("tube").describe("Comma-separated modes: tube, dlr, overground, elizabeth-line, tram, bus")
    },
    async (a) => {
      try {
        return text(await lineStatus(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "search_stops",
    "Find stations and stops by name; returns the ids needed for arrivals.",
    {
      query: z.string().min(2).describe("Stop or station name, e.g. Waterloo"),
      limit: z.number().int().min(1).max(20).default(5).describe("Matches to show")
    },
    async (a) => {
      try {
        return text(await searchStops(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "station_arrivals",
    "Real-time arrivals at a stop id, sorted by time to station.",
    {
      stopId: z.string().min(3).describe("Stop id from search_stops, e.g. 940GZZLUWLO"),
      limit: z.number().int().min(1).max(30).default(10).describe("Arrivals to show")
    },
    async (a) => {
      try {
        return text(await stationArrivals(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

server.tool(
    "road_disruptions",
    "Current TfL road disruptions.",
    {},
    async () => {
      try {
        return text(await roadDisruptions())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "stop_detail",
    "Details for one TfL stop, including lines served.",
    {
      stopId: z.string().min(3).describe("TfL stop id, e.g. 940GZZLUOXC")
    },
    async (a) => {
      try {
        return text(await stopDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "line_route",
    "Ordered stop sequence for a TfL line.",
    {
      lineId: z.string().min(2).describe("Line id, e.g. central or piccadilly"),
      direction: z.enum(["inbound", "outbound"]).default("outbound")
    },
    async (a) => {
      try {
        return text(await lineRoute(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
