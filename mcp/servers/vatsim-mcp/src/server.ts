import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { controllers, pilots, serverList } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vatsim-mcp", version: "1.0.0" })
  server.registerTool(
    "pilots",
    {
      title: "Pilots",
      description: "Connected pilots.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pilots(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "controllers",
    {
      title: "Controllers",
      description: "Connected ATC controllers.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await controllers(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "atis",
    {
      title: "Atis",
      description: "Live VATSIM ATIS stations: frequency, facility, station name, the current text ATIS and when it was last updated.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(40).default(10), frequency: z.string().max(10).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement atis locally (paywall removed)
    try { return textError("Not yet implemented: atis") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "servers",
    {
      title: "Servers",
      description: "The VATSIM server list with location and whether it accepts client connections, plus network-wide connected client and unique user counts.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await serverList(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "pilot_detail",
    {
      title: "Pilot detail",
      description: "One connected pilot by callsign or CID: live position, altitude, speed, heading, transponder, QNH, flight plan and route.",
      inputSchema: z.object( { callsign: z.string().max(20).optional(), cid: z.number().int().min(1).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
