import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { film, films } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ghibli-mcp", version: "1.0.0" })
  server.registerTool(
    "films",
    {
      title: "Films",
      description: "All Studio Ghibli films.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await films(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "film",
    {
      title: "Film",
      description: "Details for one film.",
      inputSchema: z.object( { id: z.string().describe("Film id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await film(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search_films",
    {
      title: "Search films",
      description: "Find Studio Ghibli films by title, original title, director, character or vehicle name, without needing the film id.",
      inputSchema: z.object( { query: z.string().describe("Title, director or character, e.g. \"Laputa\" or \"Miyazaki\"."), limit: z.number().int().min(1).max(20).default(10).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement films locally (paywall removed)
    try { return textError("Not yet implemented: films") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "film_people",
    {
      title: "Film people",
      description: "The characters, vehicles, locations and species a Studio Ghibli film features, plus its poster and banner art.",
      inputSchema: z.object( { id: z.string().describe("Film id, from films or search_films.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement people locally (paywall removed)
    try { return textError("Not yet implemented: people") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
