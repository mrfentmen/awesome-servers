import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, predictions, tideStatistics, TidesError, waterLevels } from "./api.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer() { const server = new McpServer({ name: "tides-mcp", version: "1.0.0" }); server.registerTool(
    "get_tide_predictions",
    {
      title: "Get tide predictions",
      description: "Get NOAA high low or hourly tide predictions for a station and date range.",
      inputSchema: z.object( { station: z.string().min(3), begin: z.string().describe("YYYY-MM-DD"), end: z.string().describe("YYYY-MM-DD"), interval: z.enum(["hilo", "h"]).default("hilo"), units: z.enum(["english", "metric"]).default("english") }),
      annotations: READ_ONLY,
    },
    async ({ station, begin, end, interval, units }) => { try { return text(format(await predictions(station, begin, end, interval, units))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "get_water_levels",
    {
      title: "Get water levels",
      description: "Get observed NOAA water levels for a station and short date range.",
      inputSchema: z.object( { station: z.string().min(3), begin: z.string(), end: z.string(), interval: z.enum(["6", "h"]).default("6"), units: z.enum(["english", "metric"]).default("english") }),
      annotations: READ_ONLY,
    },
    async ({ station, begin, end, interval, units }) => { try { return text(format(await waterLevels(station, begin, end, interval, units))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  );
  server.registerTool(
    "station_metadata",
    {
      title: "Station metadata",
      description: "What a NOAA station is and what it publishes: name, state, position, tide type, local time zone, SHEF and port codes, and which data product families the station carries.",
      inputSchema: z.object( { station: z.string().min(3).describe("NOAA station id, 7 or 8 digits, e.g. 9414290") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metadata locally (paywall removed)
    try { return textError("Not yet implemented: metadata") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "harmonic_constituents",
    {
      title: "Harmonic constituents",
      description: "The harmonic constants behind a NOAA station's tide: how many constituents are on file, the principal lunar and solar ones with amplitudes and local phases, the form number that classifies the tide as semidiurnal, mixed or diurnal, and the strongest by amplitude.",
      inputSchema: z.object( { station: z.string().min(3).describe("NOAA station id, e.g. 9414290"), units: z.enum(["english", "metric"]).default("english"), limit: z.number().describe("Constituents to list, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement constituents locally (paywall removed)
    try { return textError("Not yet implemented: constituents") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "tide_statistics",
    {
      title: "Tide statistics",
      description: "What a set of NOAA high and low predictions adds up to: how many of each, mean high and low water, mean range, the highest high, the lowest low and the greatest high to following low with its times.",
      inputSchema: z.object( { station: z.string().min(3).describe("NOAA station id, e.g. 9414290"), begin: z.string().describe("YYYY-MM-DD"), end: z.string().describe("YYYY-MM-DD"), units: z.enum(["english", "metric"]).default("english") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tideStatistics(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )
  return server
}
export { TidesError }
