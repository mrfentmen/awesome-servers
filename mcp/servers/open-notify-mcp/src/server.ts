import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { astronauts, iss, issSunlight } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "open-notify-mcp", version: "1.0.0" })
  server.registerTool(
    "astronauts",
    {
      title: "Astronauts",
      description: "List people in space right now.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await astronauts(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "iss",
    {
      title: "Iss",
      description: "Current ISS position.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await iss(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "iss_ground",
    {
      title: "ISS ground track",
      description: "What the ISS is over right now: reverse-geocodes the live sub-satellite point with BigDataCloud and cross-checks OpenStreetMap features with Photon.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement ground locally (paywall removed)
    try { return textError("Not yet implemented: ground") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "iss_sunlight",
    {
      title: "ISS sunlight",
      description: "Whether the ISS is currently in sunlight or inside Earth's shadow, from solar geometry at the live sub-satellite point.",
      inputSchema: z.object( { altitudeKm: z.number().int().min(200).max(1000).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await issSunlight(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
