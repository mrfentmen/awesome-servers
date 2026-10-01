import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { character, episode, search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rick-and-morty-mcp", version: "1.0.0" })
  server.registerTool(
    "character",
    {
      title: "Character",
      description: "Character by ID.",
      inputSchema: z.object( { id: z.number().describe("Character ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await character(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search characters.",
      inputSchema: z.object( { name: z.string().describe("Name."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "episode",
    {
      title: "Episode",
      description: "Episode by ID.",
      inputSchema: z.object( { id: z.number().describe("Episode ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await episode(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "location",
    {
      title: "Location",
      description: "A Rick and Morty location by ID: its type, dimension and how many residents it lists.",
      inputSchema: z.object( { id: z.number().describe("Location ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: location ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rick_and_morty_location", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "location_residents",
    {
      title: "Location residents",
      description: "A sample of the characters who live at a Rick and Morty location, with status and species.",
      inputSchema: z.object( { id: z.number().describe("Location ID."), limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: location_residents ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rick_and_morty_location_residents", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
