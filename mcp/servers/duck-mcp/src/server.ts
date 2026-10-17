import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { random } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "duck-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random duck photo.",
      inputSchema: z.object( { limit: z.number().describe("How many.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "duck_species",
    {
      title: "Duck Species",
      description: "Look up the scientific classification of a duck or other waterfowl by name.",
      inputSchema: z.object( { name: z.string().describe("Common or scientific name, e.g. 'mandarin duck'.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement species locally (paywall removed)
    try { return textError("Not yet implemented: species") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "duck_sightings",
    {
      title: "Duck Sightings",
      description: "Recent verified waterfowl observations reported to iNaturalist.",
      inputSchema: z.object( { limit: z.number().describe("How many sightings, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement sightings locally (paywall removed)
    try { return textError("Not yet implemented: sightings") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
