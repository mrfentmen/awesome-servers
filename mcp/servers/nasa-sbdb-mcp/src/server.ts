import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { object_lookup, close_approaches, query_objects, count_objects, orbit_classes, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-sbdb-mcp", version: "1.0.0" })

  server.tool(
    "object_lookup",
    "Identify an asteroid or comet and read its orbit class",
    {
      designation: z.string().min(2).describe("Name or designation, e.g. Apophis or 99942")
    },
    async (a) => {
      try {
        return text(await object_lookup(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "close_approaches",
    "Close approaches to Earth in a date range",
    {
      designation: z.string().min(2).describe("Name or designation, e.g. Apophis"),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2020-01-01").describe("Start date YYYY-MM-DD"),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2100-01-01").describe("End date YYYY-MM-DD")
    },
    async (a) => {
      try {
        return text(await close_approaches(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "query_objects",
    "Query the small-body catalogue by kind",
    {
      kind: z.enum(["a", "c"]).default("a").describe("a = asteroids, c = comets"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum objects")
    },
    async (a) => {
      try {
        return text(await query_objects(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "count_objects",
    "Count objects of a kind in the catalogue",
    {
      kind: z.enum(["a", "c"]).default("a").describe("a = asteroids, c = comets")
    },
    async (a) => {
      try {
        return text(await count_objects(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "orbit_classes",
    "Orbit class codes and what they mean",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await orbit_classes(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
