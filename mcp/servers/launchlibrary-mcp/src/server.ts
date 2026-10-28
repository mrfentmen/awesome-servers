import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { upcoming_launches, launch_by_id, search_launches, agencies, pads, events, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "launchlibrary-mcp", version: "1.0.0" })

  server.tool(
    "upcoming_launches",
    "Next scheduled rocket launches",
    {
      limit: z.number().int().min(1).max(20).default(5).describe("Maximum launches")
    },
    async (a) => {
      try {
        return text(await upcoming_launches(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "launch_by_id",
    "Full detail for one launch by its id or slug",
    {
      id: z.string().min(3).describe("Launch id or slug, e.g. caca9e1a-99ea-476e-8d5a-e32cf7fb4d9b")
    },
    async (a) => {
      try {
        return text(await launch_by_id(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_launches",
    "Search past and future launches by name",
    {
      query: z.string().min(2).describe("Search text, e.g. artemis"),
      limit: z.number().int().min(1).max(20).default(5).describe("Maximum launches")
    },
    async (a) => {
      try {
        return text(await search_launches(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "agencies",
    "Space agencies and launch providers",
    {
      limit: z.number().int().min(1).max(50).default(20).describe("Maximum agencies")
    },
    async (a) => {
      try {
        return text(await agencies(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "pads",
    "Launch pads with coordinates",
    {
      limit: z.number().int().min(1).max(50).default(20).describe("Maximum pads")
    },
    async (a) => {
      try {
        return text(await pads(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "events",
    "Recent space events such as dockings and landings",
    {
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum events")
    },
    async (a) => {
      try {
        return text(await events(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
