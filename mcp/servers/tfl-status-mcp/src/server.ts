import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { status } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "tfl-status-mcp", version: "1.0.0" })
  server.registerTool(
    "status",
    {
      title: "Status",
      description: "Status for London tube lines.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await status(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "mode_status",
    {
      title: "Mode status",
      description: "Live status for a London TfL mode other than the tube, e.g. bus, overground, trams, dlr, elizabeth-line, boat or cable-car.",
      inputSchema: z.object( { mode: z.string().describe("Mode name, e.g. bus, overground, trams, dlr, elizabeth-line, boat or cable-car.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement status locally (paywall removed)
    try { return textError("Not yet implemented: status") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "line_detail",
    {
      title: "Line detail",
      description: "One TfL line by id: its name, mode, current status and any active disruptions with dates.",
      inputSchema: z.object( { id: z.string().describe("TfL line id, e.g. central, victoria or northern.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
