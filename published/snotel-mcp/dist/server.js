import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { stationReadings, stationsInState, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "snotel-mcp", version: "1.0.1" });
    server.tool("stations_in_state", "Snow and soil stations in one state, with elevation and coordinates.", {
        state: z.string().length(2).describe('Two-letter state code, e.g. "CO"'),
        network: z.string().default("SNTL").describe('Network code: SNTL (snow), SCAN (soil climate), SNOW or BOR'),
        limit: z.number().int().min(1).max(50).default(20).describe("Stations to return")
    }, async (a) => {
        try {
            return text(await stationsInState(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("station_readings", "Recent daily readings for one station: snow water equivalent, snow depth, precipitation, temperature.", {
        stationTriplet: z.string().describe('Station triplet, e.g. "1344:CO:SNTL"'),
        elements: z.string().default("WTEQ,SNWD,PREC,TOBS").describe("Comma-separated element codes"),
        days: z.number().int().min(1).max(60).default(10).describe("How many days back to fetch")
    }, async (a) => {
        try {
            return text(await stationReadings(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
