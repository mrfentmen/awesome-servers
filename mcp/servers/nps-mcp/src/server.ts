import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatPark, NpsError, parkAlerts, parkCampgrounds, searchParks } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nps-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_parks",
    {
      title: "Search parks",
      description: "U.S. National Parks by keyword with states and links.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'yosemite', 'canyon'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchParks(query, limit)
        if (rows.length === 0) return text(`No parks for "${query}".`)
        return text(rows.map((p, i) => formatPark(p, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "park_alerts",
    {
      title: "Park alerts",
      description: "Current alerts and closures for one park.",
      inputSchema: z.object({
        code: z.string().describe("Park code, e.g. 'yose' (use search_parks)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ code }) => {
      try {
        const rows = await parkAlerts(code)
        if (rows.length === 0) return text(`No alerts for ${code}.`)
        return text(rows.map((a, i) => `${i + 1}. ${a}`).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "park_campgrounds",
    {
      title: "Park campgrounds",
      description: "Campgrounds of one park with fees.",
      inputSchema: z.object({
        code: z.string().describe("Park code, e.g. 'yose'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ code, limit }) => {
      try {
        const rows = await parkCampgrounds(code, limit)
        if (rows.length === 0) return text(`No campgrounds for ${code}.`)
        return text(rows.map((c, i) => `${i + 1}. ${c}`).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "parks_by_state",
    {
      title: "Parks by state",
      description: "Every National Park Service site in one state, counted by designation, with coordinates and links.",
      inputSchema: z.object({
        state: z.string().describe("Two letter state code, e.g. CA, WY, DC"),
        limit: z.number().int().min(1).max(50).default(30),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement state locally (paywall removed)
        try { return textError("Not yet implemented: state") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "park_things_to_do",
    {
      title: "Park things to do",
      description: "Activities listed for one park, with the duration and locations where the API provides them.",
      inputSchema: z.object({
        code: z.string().describe("Park code, e.g. 'yose' (use search_parks)"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement do locally (paywall removed)
        try { return textError("Not yet implemented: do") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof NpsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
