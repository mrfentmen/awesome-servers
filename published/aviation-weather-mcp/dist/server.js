import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { metar, taf, airsigmetReports } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "aviation-weather-mcp", version: "1.0.0" });
    server.registerTool("metar", {
        title: "Metar",
        description: "METAR report for airports.",
        inputSchema: z.object({ stations: z.string().describe("Comma separated ICAO codes like KJFK,KLAX.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await metar(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("taf", {
        title: "Taf",
        description: "TAF forecast for airports.",
        inputSchema: z.object({ stations: z.string().describe("Comma separated ICAO codes.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await taf(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("station_info", {
        title: "Station info",
        description: "Station records for ICAO codes: site name, position, elevation, timezone, country and the ICAO, IATA, FAA and WMO identifiers.",
        inputSchema: z.object({ stations: z.string().describe("ICAO codes, comma separated, e.g. KJFK,KLAX.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hazard_reports", {
        title: "Hazard reports",
        description: "Active aviation weather hazards for ICAO codes, such as coastal flood warnings, with issue and expiry times.",
        inputSchema: z.object({ stations: z.string().describe("ICAO codes, comma separated."), limit: z.number().describe("Max hazard records.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement reports locally (paywall removed)
        try {
            return textError("Not yet implemented: reports");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("airsigmet_reports", {
        title: "AIRSIGMET reports",
        description: "Active SIGMETs worldwide from the Aviation Weather Center, with type, validity window and issuing centre.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await airsigmetReports(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "aviation-weather-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    return server;
}
