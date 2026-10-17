import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { character, characters, planets } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dragonball-mcp", version: "1.0.0" })
  server.registerTool(
    "characters",
    {
      title: "Characters",
      description: "List characters.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await characters(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "character",
    {
      title: "Character",
      description: "Get one character by name.",
      inputSchema: z.object( { name: z.string().describe("Character name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await character(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "character_detail",
    {
      title: "Character detail",
      description: "One Dragon Ball character by id, with the transformations list and home planet the name lookup does not return.",
      inputSchema: z.object( { id: z.number().describe("Character id, like 1 for Goku. The characters list prints ids.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "planets",
    {
      title: "Planets",
      description: "Page the Dragon Ball planet catalogue with its real totals and each planet's destroyed state.",
      inputSchema: z.object( { page: z.number().describe("Page number, starting at 1. Defaults to 1.").optional(), limit: z.number().describe("Planets per page, 1-50. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await planets(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
