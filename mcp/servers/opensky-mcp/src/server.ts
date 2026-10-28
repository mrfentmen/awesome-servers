import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { aircraft_in_area, aircraft_state, flight_track, aircraft_near, airport_arrivals, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "opensky-mcp", version: "1.0.1" })

  server.tool(
    "aircraft_in_area",
    "Live aircraft inside a bounding box",
    {
      lamin: z.number().min(-90).max(90).describe("South latitude"),
      lomin: z.number().min(-180).max(180).describe("West longitude"),
      lamax: z.number().min(-90).max(90).describe("North latitude"),
      lomax: z.number().min(-180).max(180).describe("East longitude"),
      limit: z.number().int().min(1).max(50).default(15).describe("Aircraft to return")
    },
    async (a) => {
      try {
        return text(await aircraft_in_area(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "aircraft_state",
    "Latest state vector for one aircraft by ICAO24",
    {
      icao24: z.string().min(6).max(6).describe("Six-hex ICAO24 address, e.g. 3c4a0d")
    },
    async (a) => {
      try {
        return text(await aircraft_state(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "flight_track",
    "Recent flight track (breadcrumb path) for an aircraft",
    {
      icao24: z.string().min(6).max(6).describe("Six-hex ICAO24 address"),
      limit: z.number().int().min(5).max(60).default(20).describe("Path points to show")
    },
    async (a) => {
      try {
        return text(await flight_track(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "aircraft_near",
    "Aircraft within a radius of a point",
    {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lon: z.number().min(-180).max(180).describe("Longitude"),
      radiusKm: z.number().min(1).max(500).default(100).describe("Radius in kilometres"),
      limit: z.number().int().min(1).max(50).default(15).describe("Aircraft to return")
    },
    async (a) => {
      try {
        return text(await aircraft_near(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "airport_arrivals",
    "Arrivals at an airport in a short time window",
    {
      airport: z.string().min(4).max(4).describe("ICAO airport code, e.g. EDDF"),
      hours: z.number().int().min(1).max(2).default(1).describe("Look-back window in hours (max 2)")
    },
    async (a) => {
      try {
        return text(await airport_arrivals(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
