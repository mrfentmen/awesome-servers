import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { categories, random, jokeById } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "chuck-norris-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random Chuck Norris joke.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "Joke categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await categories(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_jokes",
    {
      title: "Search jokes",
      description: "Search the whole Chuck Norris joke set by keyword, with the real match count and each joke's id.",
      inputSchema: z.object( { query: z.string().describe("Search words, 3 to 120 characters. The API rejects anything shorter or longer."), limit: z.number().describe("How many jokes to print, 1-50. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_jokes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_chuck_norris_search_jokes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "random_by_category",
    {
      title: "Random by category",
      description: "A random Chuck Norris joke restricted to one category. The category is checked against the API's own list first, so a typo lists the real categories instead of failing.",
      inputSchema: z.object( { category: z.string().describe("Category name, e.g. dev, movie or science.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: random_by_category ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_chuck_norris_random_by_category", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "joke_by_id",
    {
      title: "Joke by id",
      description: "One Chuck Norris joke by its id, with its categories and permalink. Ids are printed by search_jokes and random_by_category.",
      inputSchema: z.object( { id: z.string().describe("Joke id, as printed by another tool.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jokeById(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
