import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup, self } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "geojs-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up an IP address.",
      inputSchema: z.object( { ip: z.string().describe("IP address, defaults to caller.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "self",
    {
      title: "Self",
      description: "Geolocate the caller IP.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await self(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "geo_by_ip",
    {
      title: "Geo by IP",
      description: "GeoJS's network view of an IP: coordinates, city and postal code, continent, area code, timezone and the autonomous system it sits in.",
      inputSchema: z.object( { ip: z.string().describe("IP address, e.g. 8.8.8.8.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: geo_by_ip ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_geojs_geo_by_ip", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
