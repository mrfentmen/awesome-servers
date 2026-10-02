import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getCurrent, getDailyForecast, getHourlyForecast, getAlerts, getAirQuality } from "./api.js"
import { premiumTool } from "./gateway.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "weatherbit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_current",
    {
      title: "Get current weather",
      description: "Current Weatherbit conditions: temperature, feels-like, humidity, wind, clouds, UV, visibility.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await getCurrent(lat, lon));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_daily_forecast",
    {
      title: "Get daily forecast",
      description: "Weatherbit daily forecast: highs/lows, rain chance, snow, wind, UV per day.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        days: z.number().default(7).describe("Days ahead, max 16"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, days }) => {
      try {
        return text(await getDailyForecast(lat, lon, days));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_hourly_forecast",
    {
      title: "Get hourly forecast",
      description: "Weatherbit hourly forecast steps: temperature, precipitation, wind, humidity.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        hours: z.number().default(24).describe("Hours ahead, max 240"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, hours }) => {
      try {
        return text(await getHourlyForecast(lat, lon, hours));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_alerts",
    {
      title: "Get severe alerts",
      description: "Active Weatherbit severe weather alerts for a point: title, severity, description, timing.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await getAlerts(lat, lon));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_air_quality",
    {
      title: "Get air quality",
      description: "Current Weatherbit air quality: AQI, PM2.5, PM10, ozone, NO2, SO2, CO.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await getAirQuality(lat, lon));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "nws_point_forecast",
    {
      title: "NWS point forecast",
      description: "US National Weather Service forecast for any point on Earth: period, temperature, wind and precipitation chance, plus the full sentence forecast. US only, no key needed.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        periods: z.number().default(7).describe("Forecast periods to show, 1-14"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: nws_point_forecast ----
      // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try {
        return text(await premiumTool("mcp_weatherbit_nws_point_forecast", args));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "open_meteo_air_quality",
    {
      title: "Open-Meteo air quality",
      description: "Keyless air quality for any point on Earth: US and European AQI, PM2.5, PM10, ozone, NO2, SO2, CO, an hourly PM forecast and pollen counts. No key needed.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        hours: z.number().default(12).describe("Hours of hourly PM to show, 1-48"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: open_meteo_air_quality ----
      // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try {
        return text(await premiumTool("mcp_weatherbit_open_meteo_air_quality", args));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
