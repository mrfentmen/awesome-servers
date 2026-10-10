import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, findStations, getTimeseries, nwsStationTimeseries, nwsGridpointHourly } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "synoptic-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "find_stations",
    {
      title: "Find stations",
      description: "Synoptic weather stations by state with ids, names and coordinates.",
      inputSchema: z.object({
        state: z.string().describe("Two-letter state, e.g. 'TX'"),
        limit: z.number().default(20).describe("How many"),
      }),
      annotations: READ_ONLY,
    },
    async ({ state, limit }) => {
      try {
        return text(await findStations(state, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_timeseries",
    {
      title: "Get time series",
      description: "Observations for stations: temp, wind, humidity and more.",
      inputSchema: z.object({
        stid: z.string().describe("Station id(s), comma-separated"),
        vars: z.string().default("air_temp").describe("Variables like air_temp,wind_speed"),
        recent: z.number().default(60).describe("Minutes back"),
      }),
      annotations: READ_ONLY,
    },
    async ({ stid, vars, recent }) => {
      try {
        return text(await getTimeseries(stid, vars, recent));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "nws_station_timeseries",
    {
      title: "NWS station time series",
      description: "Observed weather station time series from the US National Weather Service: temperature, dewpoint, humidity, wind, gust, pressure and visibility, one row per observation. No key needed.",
      inputSchema: z.object({
        stid: z.string().describe("NWS station id, e.g. KJFK, KBOS, KDCA"),
        hours: z.number().default(6).describe("How many hours back to fetch, 1-72"),
        limit: z.number().default(24).describe("How many observations to show, 1-100"),
      }),
      annotations: READ_ONLY,
    },
    async ({ stid, hours, limit }) => {
      // ---- paywall: nws_station_timeseries ----
      const paywallMessage = await premiumRequired("nws_station_timeseries")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await nwsStationTimeseries(stid, hours, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "nws_gridpoint_hourly",
    {
      title: "NWS gridded hourly forecast",
      description: "Hourly model forecast time series for any US point from the National Weather Service grid: temperature, wind, humidity, precipitation chance and conditions. No key needed.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        hours: z.number().default(24).describe("How many hours to show, 1-156"),
        limit: z.number().default(24).describe("How many hourly periods to show, 1-156"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, hours, limit }) => {
      // ---- paywall: nws_gridpoint_hourly ----
      const paywallMessage = await premiumRequired("nws_gridpoint_hourly")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await nwsGridpointHourly(lat, lon, hours, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
