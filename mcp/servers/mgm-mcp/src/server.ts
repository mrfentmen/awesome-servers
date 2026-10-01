import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, listProvinces, listDistricts, getDaily, getHourly } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mgm-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_provinces",
    {
      title: "List provinces",
      description: "All Turkish provinces with center ids from MGM.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProvinces());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_districts",
    {
      title: "List districts",
      description: "Districts of a province with station ids for forecasts (gunlukTahminIstNo) and current conditions (sondurumIstNo).",
      inputSchema: z.object({
        il: z.string().describe("Province, e.g. 'Ankara', 'Istanbul'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ il }) => {
      try {
        return text(await listDistricts(il));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_daily",
    {
      title: "Get daily forecast",
      description: "MGM multi-day forecast for a station. Use gunlukTahminIstNo from list_districts.",
      inputSchema: z.object({
        istno: z.string().describe("Forecast station id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ istno }) => {
      try {
        return text(await getDaily(istno));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_hourly",
    {
      title: "Get hourly forecast",
      description: "MGM hourly forecast steps for a station.",
      inputSchema: z.object({
        istno: z.string().describe("Forecast station id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ istno }) => {
      try {
        return text(await getHourly(istno));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "current_conditions",
    {
      title: "Current conditions",
      description: "Live observation from an MGM station: temperature, humidity, pressure, wind, " +
      "visibility, cloud cover and precipitation totals. Use sondurumIstNo from list_districts.",
      inputSchema: z.object({
        istno: z.string().describe("Observation station id (sondurumIstNo)"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: current_conditions ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_mgm_current_conditions", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "province_board",
    {
      title: "Province board",
      description: "Multi-day low/high forecast for every district in a Turkish province, side by side.",
      inputSchema: z.object({
        il: z.string().describe("Province, e.g. 'Ankara', 'Istanbul'"),
        days: z.number().int().min(1).max(5).default(3),
        limit: z.number().int().min(1).max(40).default(15),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: province_board ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_mgm_province_board", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
