import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  breweryStats,
  errorMessage,
  findBreweries,
  getBrewery,
  randomBrewery,
  searchAllBreweries,
  searchBreweries,
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
      description:
        "Search breweries on one specific field. Returns names, types, addresses, websites and ids.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. Denver."),
        by: z.string().describe("name, city, state, type, country or postal (default name).").optional(),
        limit: z.string().describe("Max results (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, by, limit }) => {
      try {
        return text(await searchBreweries(query, by, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_all_breweries",
    {
      title: "Search all fields",
      description:
        "Free-text search across every brewery field — name, city, state, country, postal code and website — for when you do not know which field the text is in.",
      inputSchema: z.object({
        query: z.string().describe("Free text, e.g. dog or brewing."),
        limit: z.number().describe("Max results, 1-50 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchAllBreweries(query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "find_breweries",
    {
      title: "Find breweries",
      description:
        "List breweries matching structured filters — city, state, country, type and postal code — optionally sorted by name, city, state or type. Use it for questions like 'micro breweries in Vermont'.",
      inputSchema: z.object({
        city: z.string().describe("City name, e.g. denver.").optional(),
        state: z.string().describe("State or region, e.g. vermont.").optional(),
        country: z.string().describe("Country, e.g. Germany.").optional(),
        type: z.string().describe("micro, nano, regional, brewpub, large, planning, bar, contract, proprietor, closed.").optional(),
        postal: z.string().describe("Postal code, e.g. 05401.").optional(),
        sort: z.string().describe("Sort key and direction, e.g. name:asc or city:desc (default API order).").optional(),
        limit: z.number().describe("Max results, 1-50 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await findBreweries(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_brewery",
    {
      title: "Get brewery",
      description: "Full details for one brewery by its id, including address, coordinates and contact info.",
      inputSchema: z.object({
        brewery_id: z.string().describe("Brewery UUID from a search result.")
      }),
      annotations: READ_ONLY,
    },
    async ({ brewery_id }) => {
      try {
        return text(await getBrewery(brewery_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_brewery",
    {
      title: "Random brewery",
      description: "A random brewery from the directory, useful for discovery and examples.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await randomBrewery())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "brewery_stats",
    {
      title: "Brewery stats",
      description:
        "Directory totals from Open Brewery DB broken down by country, brewery type and state/region. Good for market sizing and picking valid filter values.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await breweryStats())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
