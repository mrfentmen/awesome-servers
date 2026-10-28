import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { metar, taf, airport_info, station_info, decode_metar, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "aviationweather-mcp", version: "1.0.0" })

  server.tool(
    "metar",
    "Current METAR observations for one or more stations",
    {
      ids: z.string().min(3).describe("Station ids, comma separated, e.g. KJFK or KJFK,EGLL"),
      limit: z.number().int().min(1).max(20).default(5).describe("Maximum stations")
    },
    async (a) => {
      try {
        return text(await metar(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "taf",
    "Terminal aerodrome forecasts for one or more stations",
    {
      ids: z.string().min(3).describe("Station ids, comma separated, e.g. KJFK")
    },
    async (a) => {
      try {
        return text(await taf(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "airport_info",
    "Airport details: name, location, elevation and radio frequencies",
    {
      ids: z.string().min(3).describe("Airport ids, comma separated, e.g. KJFK")
    },
    async (a) => {
      try {
        return text(await airport_info(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "station_info",
    "Reporting station metadata for an airport code",
    {
      ids: z.string().min(3).describe("Station ids, comma separated, e.g. KJFK")
    },
    async (a) => {
      try {
        return text(await station_info(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "decode_metar",
    "Decode a raw METAR string into wind, visibility, cloud and pressure fields",
    {
      raw: z.string().min(10).describe("Raw METAR text, e.g. METAR KJFK 280151Z 06004KT 10SM SCT250 11/05 A3041")
    },
    async (a) => {
      try {
        return text(await decode_metar(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
