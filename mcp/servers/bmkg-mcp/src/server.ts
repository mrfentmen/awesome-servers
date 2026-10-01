import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getForecast, getFeltEarthquakes, getLatestEarthquakes, warningDetail } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "bmkg-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_forecast",
    {
      title: "Get village forecast",
      description: "3-hourly 3-day BMKG forecast for an Indonesian village by adm4 code (e.g. 31.71.03.1001 Kemayoran, Jakarta). Codes at kodewilayah.id.",
      inputSchema: z.object({
        adm4: z.string().describe("Village code W.X.Y.Z"),
      }),
      annotations: READ_ONLY,
    },
    async ({ adm4 }) => {
      try {
        return text(await getForecast(adm4));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_felt_earthquakes",
    {
      title: "Get felt earthquakes",
      description: "Recently felt Indonesian earthquakes: magnitude, depth, location, MMI scale.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getFeltEarthquakes());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_latest_earthquakes",
    {
      title: "Get latest earthquakes",
      description: "Latest Indonesian earthquakes M5+: time, coordinates, magnitude, region.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getLatestEarthquakes());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "latest_earthquake",
    {
      title: "Latest earthquake",
      description: "The single most recent BMKG earthquake in full: magnitude, depth, coordinates, tsunami potential and where it was felt.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: latest_earthquake ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bmkg_latest_earthquake", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  );

  server.registerTool(
    "weather_warnings",
    {
      title: "Weather warnings",
      description: "BMKG's live nowcast warning feed, filtered by region, with CAP document links.",
      inputSchema: z.object({ region: z.string().describe("Optional region name in the warning title.").optional(), limit: z.number().describe("Maximum warnings, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: weather_warnings ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bmkg_weather_warnings", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "warning_detail",
    {
      title: "Warning severity and affected areas",
      description: "Read a BMKG CAP alert's urgency, severity, certainty, validity period, instructions and geographic boundary.",
      inputSchema: z.object({ alertUrl: z.string().describe("CAP XML URL returned by weather_warnings.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await warningDetail(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
