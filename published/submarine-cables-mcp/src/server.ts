import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { list_cables, search_cables, cable_detail, cable_landing_points, cable_route, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "submarine-cables-mcp", version: "1.0.0" })

  server.tool(
    "list_cables",
    "List submarine cables",
    {
      limit: z.number().int().min(1).max(100).default(30).describe("Cables to return")
    },
    async (a) => {
      try {
        return text(await list_cables(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_cables",
    "Search submarine cables by name",
    {
      query: z.string().min(2).describe("Name text, e.g. 2africa or transatlantic"),
      limit: z.number().int().min(1).max(50).default(10).describe("Matches to return")
    },
    async (a) => {
      try {
        return text(await search_cables(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cable_detail",
    "One submarine cable with length, owners and landing point count",
    {
      id: z.string().min(2).describe("Cable id, e.g. 2africa")
    },
    async (a) => {
      try {
        return text(await cable_detail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cable_landing_points",
    "Landing points for one cable",
    {
      id: z.string().min(2).describe("Cable id, e.g. 2africa"),
      limit: z.number().int().min(1).max(60).default(25).describe("Landing points to return")
    },
    async (a) => {
      try {
        return text(await cable_landing_points(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cable_route",
    "Route geometry summary for a cable",
    {
      id: z.string().min(2).describe("Cable id, e.g. 2africa")
    },
    async (a) => {
      try {
        return text(await cable_route(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
