import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { lookup, reverse } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "postcodes-mcp", version: "1.0.0" })

  server.tool(
    "postcode",
    "Look up a UK postcode: country, region, district, ward, constituency, coordinates and grid reference.",
    { postcode: z.string().min(5).describe('UK postcode, e.g. "SW1A 1AA"') },
    async ({ postcode }) => {
      try {
        return text(await lookup(postcode))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "reverse",
    "Find the nearest UK postcodes to a latitude and longitude.",
    {
      lat: z.number().min(49).max(61).describe("Latitude inside the UK"),
      lon: z.number().min(-9).max(2).describe("Longitude inside the UK"),
      limit: z.number().int().min(1).max(20).default(3).describe("How many postcodes to return"),
    },
    async ({ lat, lon, limit }) => {
      try {
        return text(await reverse(lat, lon, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
