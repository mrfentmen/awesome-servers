import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getHourlyForecast,
  getThreeHourlyForecast,
  getDailyForecast,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "metoffice-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_hourly_forecast",
    {
      title: "Get hourly forecast",
      description: "UK Met Office hourly forecast for a point: temperature, feels-like, rain probability, wind, gusts, visibility.",
      inputSchema: z.object({
        latitude: z.number().describe("Latitude"),
        longitude: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude }) => {
      try {
        return text(await getHourlyForecast(latitude, longitude));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_three_hourly_forecast",
    {
      title: "Get three-hourly forecast",
      description: "UK Met Office three-hourly forecast steps for a point, longer range than hourly.",
      inputSchema: z.object({
        latitude: z.number().describe("Latitude"),
        longitude: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude }) => {
      try {
        return text(await getThreeHourlyForecast(latitude, longitude));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_daily_forecast",
    {
      title: "Get daily forecast",
      description: "UK Met Office daily forecast for a point: day/night temperature, rain probability, wind summary.",
      inputSchema: z.object({
        latitude: z.number().describe("Latitude"),
        longitude: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude }) => {
      try {
        return text(await getDailyForecast(latitude, longitude));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
