import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { breweryDetail, listBreweries, searchBreweries, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "brewery-mcp", version: "1.0.0" })

  server.tool(
    "search_breweries",
    "Search breweries by name or keyword.",
    {
      query: z.string().describe('Search text, e.g. "dog"'), limit: z.number().int().min(1).max(50).optional().describe('Results, default 10')
    },
    async (a) => {
      try {
        return text(await searchBreweries(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "list_breweries",
    "List breweries filtered by city, state and/or type, page by page.",
    {
      city: z.string().optional().describe('City, e.g. "san diego"'), state: z.string().optional().describe('State, e.g. "oregon"'), type: z.string().optional().describe('One of micro, nano, regional, brewpub, large, planning, bar, contract, proprietor, closed'), limit: z.number().int().min(1).max(50).optional().describe('Results per page, default 10'), page: z.number().int().min(1).max(100).optional().describe('Page number, default 1')
    },
    async (a) => {
      try {
        return text(await listBreweries(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "brewery_detail",
    "Full record for one brewery by UUID: type, address, coordinates, phone and website.",
    {
      id: z.string().describe('Brewery UUID from a search or list result')
    },
    async (a) => {
      try {
        return text(await breweryDetail(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
