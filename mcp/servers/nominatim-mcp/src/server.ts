import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { lookupOsmIds, reverseGeocode, searchPlaces, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nominatim-mcp", version: "1.0.1" })

  server.tool(
    "search_places",
    "Find places by free-text name or address.",
    {
      query: z.string().min(2).describe("What to look for, e.g. eiffel tower or Berlin"),
      limit: z.number().int().min(1).max(10).default(5).describe("Results to return"),
      countryCode: z.string().length(2).optional().describe("Optional two-letter country filter")
    },
    async (a) => {
      try {
        return text(await searchPlaces(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "reverse_geocode",
    "Turn coordinates into the address OpenStreetMap holds there.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude")
    },
    async (a) => {
      try {
        return text(await reverseGeocode(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup_osm_ids",
    "Resolve OpenStreetMap element ids (N/W/R) to full details.",
    {
      osmIds: z.array(z.string().regex(/^[NWR]\d+$/)).min(1).max(5).describe("Ids like W98616190 (N node, W way, R relation)")
    },
    async (a) => {
      try {
        return text(await lookupOsmIds(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
