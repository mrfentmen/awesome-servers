import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getWeatherStations,
  getHomeData,
  getHomeStatus,
  getEvents,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "netatmo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_weather_stations",
    {
      title: "Get weather stations",
      description: "Netatmo weather stations: indoor/outdoor modules, temperature, humidity, CO2, noise, pressure.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getWeatherStations());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_home_data",
    {
      title: "Get home data",
      description: "Netatmo homes: rooms, modules, cameras, schedules, place info.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getHomeData());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_home_status",
    {
      title: "Get home status",
      description: "Live Netatmo home status: thermostats, valves, windows, presence per room.",
      inputSchema: z.object({
        homeId: z.string().describe("Home id from get_home_data"),
      }),
      annotations: READ_ONLY,
    },
    async ({ homeId }) => {
      try {
        return text(await getHomeStatus(homeId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_events",
    {
      title: "Get home events",
      description: "Recent Netatmo home events: motion, doorbell, alarms, person seen.",
      inputSchema: z.object({
        homeId: z.string().describe("Home id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ homeId }) => {
      try {
        return text(await getEvents(homeId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
