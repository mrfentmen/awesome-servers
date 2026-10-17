import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { locate, distanceBetween } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "geolocation-db-mcp", version: "1.0.0" })
  server.registerTool(
    "locate",
    {
      title: "Locate",
      description: "Location for your IP or one IP.",
      inputSchema: z.object( { ip: z.string().describe("IP address.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await locate(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "locate_many",
    {
      title: "Locate many",
      description: "Look up several IPv4 or IPv6 addresses at once and report each location, a country tally, and any address the database could not resolve.",
      inputSchema: z.object( { ips: z.string().describe("IP addresses separated by spaces or commas, up to 20.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement many locally (paywall removed)
    try { return textError("Not yet implemented: many") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "distance_between",
    {
      title: "Distance between",
      description: "Great-circle distance and initial bearing between the locations of two IP addresses.",
      inputSchema: z.object( { from: z.string().describe("First IP address."), to: z.string().describe("Second IP address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await distanceBetween(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
