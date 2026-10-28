import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { aircraftByCallsign, aircraftByHex, aircraftNear, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "adsb-mcp", version: "1.0.0" })

  server.tool(
    "aircraft_near",
    "Aircraft currently within a radius of a latitude and longitude.",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude"),
      longitude: z.number().min(-180).max(180).describe("Longitude"),
      radiusNm: z.number().int().min(1).max(250).default(40).describe("Radius in nautical miles"),
      limit: z.number().int().min(1).max(50).default(15).describe("Aircraft to return")
    },
    async (a) => {
      try {
        return text(await aircraftNear(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "aircraft_by_callsign",
    "Find aircraft broadcasting a callsign.",
    {
      callsign: z.string().min(2).describe('Callsign, e.g. "DLH123"')
    },
    async (a) => {
      try {
        return text(await aircraftByCallsign(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "aircraft_by_hex",
    "Find an aircraft by its 24-bit ICAO hex code.",
    {
      hex: z.string().regex(/^[0-9a-fA-F]{6}$/).describe("ICAO hex like 404714")
    },
    async (a) => {
      try {
        return text(await aircraftByHex(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
