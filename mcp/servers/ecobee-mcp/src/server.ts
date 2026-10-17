import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { EcobeeError, formatThermostat, listThermostats, setpointAudit } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ecobee-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_thermostats",
    {
      title: "List thermostats",
      description: "ecobee thermostats: temperature, humidity, mode, sensors.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listThermostats()
        if (rows.length === 0) return text("No thermostats.")
        return text(rows.map((t, i) => formatThermostat(t, i)).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "outdoor_air",
    {
      title: "Outdoor air",
      description: "What the outdoor air is doing at a point right now, as the readings a ventilation decision depends on: the European and US AQI, the UV index, PM2.5, PM10, carbon monoxide, nitrogen dioxide, sulphur dioxide, ozone, and the six tracked pollen species with their units.",
      inputSchema: z.object({ lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement air locally (paywall removed)
        try { return textError("Not yet implemented: air") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "air_quality_trend",
    {
      title: "Air quality trend",
      description: "The hourly air quality trend at a point over one to seven days, judged against the WHO 24 hour PM2.5 guideline: the mean and peak PM2.5, how many hours sit above the guideline and which, plus the PM10 and European AQI means and bands.",
      inputSchema: z.object({ lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude."), days: z.number().describe("Forecast days, 1-7.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement trend locally (paywall removed)
        try { return textError("Not yet implemented: trend") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "setpoint_audit",
    {
      title: "Setpoint audit",
      description: "Degree-hour arithmetic for an overnight heating setback, computed locally: the deficit at the coldest and warmest hour, the runtime to hold the setback, the runtime to hold the target all night instead, what the setback saves, and what the morning catch-up adds back.",
      inputSchema: z.object({
        indoorC: z.number().describe("Indoor target in C, default 21."),
        setbackC: z.number().describe("Setback depth in C, default 3."),
        outdoorLowC: z.number().describe("Overnight low in C, default 2."),
        outdoorHighC: z.number().describe("Overnight high in C, default 8."),
        hours: z.number().describe("Setback window in hours, 1-24.").optional(),
        runtimeRateC: z.number().optional().describe("C of temperature change per runtime hour, default 1.5."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await setpointAudit(args))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof EcobeeError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
