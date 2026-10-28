import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { geocode_oneline, geocode_address, congressional_district, geographies, benchmarks, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "census-geocode-mcp", version: "1.0.1" })

  server.tool(
    "geocode_oneline",
    "Geocode a single-line US address",
    {
      address: z.string().min(5).describe("Address, e.g. 1600 Pennsylvania Ave NW, Washington, DC 20500"),
      limit: z.number().int().min(1).max(10).default(3).describe("Matches to return")
    },
    async (a) => {
      try {
        return text(await geocode_oneline(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "geocode_address",
    "Geocode a structured US address",
    {
      street: z.string().min(3).describe("Street address, e.g. 1600 Pennsylvania Ave NW"),
      city: z.string().min(2).describe("City, e.g. Washington"),
      state: z.string().length(2).describe("Two-letter state code, e.g. DC"),
      zip: z.string().regex(/^\d{5}$/).optional().describe("Five-digit ZIP, optional")
    },
    async (a) => {
      try {
        return text(await geocode_address(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "congressional_district",
    "Congressional district for a coordinate",
    {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lon: z.number().min(-180).max(180).describe("Longitude")
    },
    async (a) => {
      try {
        return text(await congressional_district(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "geographies",
    "Census geographies (state, county, tract, block group) for a coordinate",
    {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lon: z.number().min(-180).max(180).describe("Longitude"),
      layers: z.number().int().min(1).max(30).default(12).describe("How many geography layers to list")
    },
    async (a) => {
      try {
        return text(await geographies(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "benchmarks",
    "Available Census geocoder benchmarks and vintages",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await benchmarks(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
