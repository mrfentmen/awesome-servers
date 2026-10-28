import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  AirQualityError,
  airQualityForecast,
  compareLocations,
  currentAirQuality,
  pollenForecast,
  pollutantDetail,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof AirQualityError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const latArg = z.number().min(-90).max(90).describe("Latitude, e.g. 52.52")
const lonArg = z.number().min(-180).max(180).describe("Longitude, e.g. 13.41")
const hoursArg = z.number().int().min(3).max(120).default(24).describe("Forecast horizon in hours")

export function createServer(): McpServer {
  const server = new McpServer({ name: "air-quality-mcp", version: "1.0.0" })

  server.tool(
    "current_air_quality",
    "Current AQI plus PM2.5, PM10, ozone, NO2, SO2 and CO for a coordinate.",
    { latitude: latArg, longitude: lonArg },
    async ({ latitude, longitude }) => {
      try {
        return text(await currentAirQuality(latitude, longitude))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "air_quality_forecast",
    "Hourly AQI and PM2.5 forecast with the peak hour flagged.",
    { latitude: latArg, longitude: lonArg, hours: hoursArg },
    async ({ latitude, longitude, hours }) => {
      try {
        return text(await airQualityForecast(latitude, longitude, hours))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "pollutant_detail",
    "Every pollutant Open-Meteo reports for a point, with units.",
    { latitude: latArg, longitude: lonArg },
    async ({ latitude, longitude }) => {
      try {
        return text(await pollutantDetail(latitude, longitude))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "pollen_forecast",
    "Pollen forecast (alder, birch, grass, mugwort, olive, ragweed) — Europe mostly.",
    { latitude: latArg, longitude: lonArg, hours: hoursArg },
    async ({ latitude, longitude, hours }) => {
      try {
        return text(await pollenForecast(latitude, longitude, hours))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_locations",
    "Current air quality side by side for 2 to 5 places.",
    {
      locations: z
        .array(
          z.object({
            name: z.string().optional().describe("Label for the place"),
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          })
        )
        .min(2)
        .max(5)
        .describe("Places to compare"),
    },
    async ({ locations }) => {
      try {
        return text(await compareLocations(locations))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
