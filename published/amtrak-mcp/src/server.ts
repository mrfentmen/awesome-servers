import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { live_trains, train_status, route_trains, stations, station, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "amtrak-mcp", version: "1.0.0" })

  server.tool(
    "live_trains",
    "Every Amtrak train currently running",
    {
      limit: z.number().int().min(1).max(100).default(25).describe("Maximum trains")
    },
    async (a) => {
      try {
        return text(await live_trains(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "train_status",
    "Live status for one train number or train id",
    {
      train: z.string().min(1).describe("Train number such as 1, or an id such as 1-26")
    },
    async (a) => {
      try {
        return text(await train_status(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "route_trains",
    "Live trains on one route",
    {
      route: z.string().min(2).describe("Route name fragment, e.g. Sunset Limited"),
      limit: z.number().int().min(1).max(50).default(15).describe("Maximum trains")
    },
    async (a) => {
      try {
        return text(await route_trains(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "stations",
    "Amtrak stations, optionally filtered by state",
    {
      state: z.string().length(2).optional().describe("Optional two letter state code"),
      limit: z.number().int().min(1).max(100).default(25).describe("Maximum stations")
    },
    async (a) => {
      try {
        return text(await stations(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "station",
    "One Amtrak station by code",
    {
      code: z.string().min(2).max(5).describe("Station code, e.g. BOS")
    },
    async (a) => {
      try {
        return text(await station(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
