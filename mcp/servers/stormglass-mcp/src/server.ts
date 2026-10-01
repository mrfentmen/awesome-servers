import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getWeather,
  getElevation,
  getTides,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "stormglass-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_weather",
    {
      title: "Get marine weather",
      description: "Hourly marine weather for coordinates from multiple sources.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lng: z.string().describe("Longitude"),
        params: z.string().default("airTemperature,windSpeed,waveHeight").describe("Comma params"),
        start: z.string().optional().describe("Start timestamp"),
        end: z.string().optional().describe("End timestamp"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lng, params, start, end }) => {
      try {
        return text(await getWeather(lat, lng, params, start, end));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_elevation",
    {
      title: "Get elevation",
      description: "Seabed/land elevation for a coordinate.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lng: z.string().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lng }) => {
      try {
        return text(await getElevation(lat, lng));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_tides",
    {
      title: "Get tide extremes",
      description: "High/low tide extremes near a coordinate.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lng: z.string().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lng }) => {
      try {
        return text(await getTides(lat, lng));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
