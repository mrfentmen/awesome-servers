import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { character, characters } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "futurama-mcp", version: "1.0.0" })
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
      description: "Get a character by id.",
      inputSchema: z.object( { id: z.number().describe("Character id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await character(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "episodes",
    {
      title: "Episodes",
      description: "The Futurama episode list with season and episode number, original air date, writers and plot summary, optionally for one season.",
      inputSchema: z.object( { limit: z.number().describe("Max episodes.").optional(), season: z.number().describe("Filter to one season.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement episodes locally (paywall removed)
    try { return textError("Not yet implemented: episodes") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
