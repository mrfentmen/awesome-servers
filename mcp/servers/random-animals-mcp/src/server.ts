import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { animal } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "random-animals-mcp", version: "1.0.0" })
  server.registerTool(
    "animal",
    {
      title: "Animal",
      description: "A random animal photo with a fact.",
      inputSchema: z.object( { type: z.string().describe("dog, cat, fox, bird, panda, koala, duck.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await animal(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "species_facts",
    {
      title: "Species facts",
      description: "Look up a species on iNaturalist: scientific and common name, rank, conservation status, Wikipedia link and observation count.",
      inputSchema: z.object({ query: z.string().describe("Species or group name, for example 'red panda'."), limit: z.number().describe("Max species, 1-10, default 3.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement facts locally (paywall removed)
    try { return textError("Not yet implemented: facts") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "species_observations",
    {
      title: "Species observations",
      description: "Recent research grade observations of a species on iNaturalist, with date, place, observer and a licensed photo.",
      inputSchema: z.object({ query: z.string().describe("Species name, for example 'red panda'."), limit: z.number().describe("Max observations, 1-20, default 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement observations locally (paywall removed)
    try { return textError("Not yet implemented: observations") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
