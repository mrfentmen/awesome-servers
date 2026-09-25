import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  geocode,
  reverse,
  directions,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openrouteservice-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "geocode",
    {
      title: "Geocode",
      description: "Forward geocode a place name.",
      inputSchema: z.object({
        query: z.string().describe("Place name, e.g. Berlin."),
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await geocode(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "reverse",
    {
      title: "Reverse geocode",
      description: "Place name for coordinates.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude."),
        lon: z.string().describe("Longitude.")
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await reverse(lat, lon));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "directions",
    {
      title: "Driving directions",
      description: "Car route between two points.",
      inputSchema: z.object({
        from_lon: z.string().describe("Origin longitude."),
        from_lat: z.string().describe("Origin latitude."),
        to_lon: z.string().describe("Destination longitude."),
        to_lat: z.string().describe("Destination latitude.")
      }),
      annotations: READ_ONLY,
    },
    async ({ from_lon, from_lat, to_lon, to_lat }) => {
      try {
        return text(await directions(from_lon, from_lat, to_lon, to_lat));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
