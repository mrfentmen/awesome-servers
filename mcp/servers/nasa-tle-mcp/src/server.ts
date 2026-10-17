import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { satellite, search, browseCatalog } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-tle-mcp", version: "1.0.0" })
  server.registerTool(
    "satellite",
    {
      title: "Satellite",
      description: "Get TLE for a satellite by id.",
      inputSchema: z.object( { satid: z.number().describe("NORAD catalog id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await satellite(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search satellites by name.",
      inputSchema: z.object( { query: z.string().describe("Name search query.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "browse_catalog",
    {
      title: "Browse catalog",
      description: "Page through the whole TLE catalog, with sorting and a total object count.",
      inputSchema: z.object( {
        page: z.number().int().min(1).optional().describe("1-based page number. Default 1."),
        pageSize: z.number().int().min(1).max(50).optional().describe("Objects per page, 1-50. Default 20."),
        sort: z.enum(["popularity", "name"]).optional().describe("Sort key. Default popularity."),
        direction: z.enum(["asc", "desc"]).optional().describe("Sort direction. Default desc."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await browseCatalog(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "orbital_elements",
    {
      title: "Orbital elements",
      description: "Decode a satellite's two-line element set into inclination, RAAN, eccentricity, period and the rest.",
      inputSchema: z.object( { satid: z.number().describe("NORAD catalog id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement elements locally (paywall removed)
    try { return textError("Not yet implemented: elements") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "fleet_tles",
    {
      title: "Fleet TLEs",
      description: "Full two-line element sets for the top name matches, for example every Starlink batch.",
      inputSchema: z.object( {
        query: z.string().describe("Satellite name or batch fragment."),
        limit: z.number().int().min(1).max(50).optional().describe("How many element sets to return, 1-50. Default 5."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement tles locally (paywall removed)
    try { return textError("Not yet implemented: tles") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
