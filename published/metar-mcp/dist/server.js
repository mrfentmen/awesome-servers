import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { metar, stationInfo, taf, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "metar-mcp", version: "1.0.0" });
    server.tool("metar", "Current METAR observation for one or more ICAO stations, decoded plus raw.", {
        station: z.string().min(3).max(4).describe('ICAO code, e.g. "KJFK"')
    }, async (a) => {
        try {
            return text(await metar(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("taf", "Terminal aerodrome forecast for an ICAO station.", {
        station: z.string().min(3).max(4).describe('ICAO code, e.g. "EGLL"')
    }, async (a) => {
        try {
            return text(await taf(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("station_info", "Airport station record: name, coordinates, elevation and which products it publishes.", {
        station: z.string().min(3).max(4).describe('ICAO code, e.g. "KJFK"')
    }, async (a) => {
        try {
            return text(await stationInfo(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
