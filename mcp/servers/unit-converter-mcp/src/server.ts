import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { convert, listUnits } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "unit-converter-mcp", version: "1.0.0" })
  server.registerTool(
    "convert",
    {
      title: "Convert",
      description: "Convert a value between units.",
      inputSchema: z.object( { value: z.number().describe("The value to convert."), from: z.string().describe("Source unit."), to: z.string().describe("Target unit.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convert(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "list_units",
    {
      title: "List units",
      description: "List available units for a category.",
      inputSchema: z.object( { category: z.string().describe("length, weight, temperature, speed, or data.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listUnits(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "convert_many",
    {
      title: "Convert many",
      description: "Convert a whole list of values with one unit pair in a single call, which saves a round trip per amount.",
      inputSchema: z.object( { values: z.array(z.number()).describe("Up to 100 numbers to convert."), from: z.string().describe("Source unit."), to: z.string().describe("Target unit."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement many locally (paywall removed)
    try { return textError("Not yet implemented: many") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
