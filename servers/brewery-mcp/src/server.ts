import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchBreweries,
  getBrewery,
  randomBrewery,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brewery-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_breweries",
    {
      title: "Search breweries",
      description: "Search by name, city, state or type.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. Denver."),
        by: z.string().describe("name, city, state or type (default name).").optional(),
        limit: z.string().describe("Max results (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, by, limit }) => {
      try {
        return text(await searchBreweries(query, by, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_brewery",
    {
      title: "Get brewery",
      description: "Brewery details by ID.",
      inputSchema: z.object({
        brewery_id: z.string().describe("Brewery UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ brewery_id }) => {
      try {
        return text(await getBrewery(brewery_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "random_brewery",
    {
      title: "Random brewery",
      description: "A random US brewery.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await randomBrewery());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}