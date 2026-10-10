import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, gauges, latestValue, streamflow, WaterError } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer() { const server = new McpServer({ name: "usgs-water-mcp", version: "1.0.0" }); server.registerTool(
    "get_streamflow",
    {
      title: "Get streamflow",
      description: "Get USGS instantaneous water observations for one gauge.",
      inputSchema: z.object( { site: z.string().min(1), parameter: z.string().default("00060").describe("USGS parameter code, 00060 is discharge"), start: z.string().optional(), end: z.string().optional() }),
      annotations: READ_ONLY,
    },
    async ({ site, parameter, start, end }) => { try { return text(format(await streamflow(site, parameter, start, end))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "find_gauges",
    {
      title: "Find gauges",
      description: "Find active USGS stream gauges in a longitude,latitude bounding box.",
      inputSchema: z.object( { bbox: z.string().describe("min longitude,min latitude,max longitude,max latitude"), limit: z.number().int().min(1).max(50).default(20) }),
      annotations: READ_ONLY,
    },
    async ({ bbox, limit }) => { try { return text(format(await gauges(bbox, limit))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  );
  server.registerTool(
    "daily_values",
    {
      title: "Daily values",
      description: "USGS daily-value statistics for one gauge over a period, with the number of readings and the real minimum and maximum, rather than the raw JSON the streamflow tool returns.",
      inputSchema: z.object( { site: z.string().min(1).describe("USGS site number, like 01646500."), parameter: z.string().describe("USGS parameter code, 00060 is discharge, 00065 is gage height. Defaults to 00060.").optional(), period: z.string().describe("ISO period like P7D or P30D. Defaults to P7D.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: daily_values ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_usgs_water_daily_values", args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "latest_value",
    {
      title: "Latest value",
      description: "The most recent instantaneous reading for one gauge in the last hour, with its timestamp, unit and whether USGS still marks it provisional.",
      inputSchema: z.object( { site: z.string().min(1).describe("USGS site number, like 01646500."), parameter: z.string().describe("USGS parameter code, 00060 is discharge. Defaults to 00060.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latestValue(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )
  return server }
export { WaterError }
