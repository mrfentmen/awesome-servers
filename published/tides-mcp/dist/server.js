import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, predictions, stationList, stationMetadata, tideRange, TidesError, waterLevels } from "./api.js";
const text = (s) => ({ content: [{ type: "text", text: s }] });
const fail = (s) => ({ content: [{ type: "text", text: s }], isError: true });
function errorMessage(e) {
    if (e instanceof TidesError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "tides-mcp", version: "1.0.6" });
    server.tool("get_tide_predictions", "Get NOAA high low or hourly tide predictions for a station and date range.", {
        station: z.string().min(3).describe("NOAA station id, e.g. 8443970"),
        begin: z.string().describe("YYYY-MM-DD"),
        end: z.string().describe("YYYY-MM-DD"),
        interval: z.enum(["hilo", "h"]).default("hilo"),
        units: z.enum(["english", "metric"]).default("english")
    }, async (a) => {
        try {
            return text(format(await predictions(a.station, a.begin, a.end, a.interval, a.units)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("get_water_levels", "Get observed NOAA water levels for a station and short date range.", {
        station: z.string().min(3).describe("NOAA station id"),
        begin: z.string().describe("YYYY-MM-DD"),
        end: z.string().describe("YYYY-MM-DD"),
        interval: z.enum(["6", "h"]).default("6"),
        units: z.enum(["english", "metric"]).default("english")
    }, async (a) => {
        try {
            return text(format(await waterLevels(a.station, a.begin, a.end, a.interval, a.units)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_stations", "List NOAA tide prediction stations, optionally by state.", {
        state: z.string().length(2).optional().describe("Two-letter state code, e.g. NY")
    }, async (a) => {
        try {
            return text(await stationList(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("station_metadata", "Station details for one NOAA tide gauge.", {
        station: z.string().min(3).describe("NOAA station id, e.g. 8443970")
    }, async (a) => {
        try {
            return text(await stationMetadata(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("tide_range", "Highest, lowest and total tide range for a date window.", {
        station: z.string().min(3).describe("NOAA station id"),
        begin: z.string().describe("YYYY-MM-DD"),
        end: z.string().describe("YYYY-MM-DD"),
        units: z.enum(["english", "metric"]).default("english")
    }, async (a) => {
        try {
            return text(await tideRange(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
