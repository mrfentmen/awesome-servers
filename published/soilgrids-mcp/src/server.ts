import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { classifySoil, listSoilCodes, soilProperties, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "soilgrids-mcp", version: "1.0.0" })

  server.tool(
    "soil_properties",
    "Soil property values at a coordinate for chosen properties and depth layers.",
    {
      lat: z.number().min(-90).max(90).describe("Latitude, e.g. 52.0"),
      lon: z.number().min(-180).max(180).describe("Longitude, e.g. 5.0"),
      properties: z.string().optional().describe("Comma-separated property codes (default clay,sand,silt,soc,phh2o)"),
      depths: z.string().optional().describe("Comma-separated depths (default 0-5cm,5-15cm,15-30cm)")
    },
    async (a) => {
      try {
        return text(await soilProperties(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "classify_soil",
    "The most likely World Reference Base soil classes at a coordinate with probabilities.",
    {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lon: z.number().min(-180).max(180).describe("Longitude"),
      classes: z.number().int().min(1).max(5).default(3).describe("How many candidate classes to show")
    },
    async (a) => {
      try {
        return text(await classifySoil(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "list_soil_codes",
    "The property codes and depth layers this API accepts.",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await listSoilCodes())
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
