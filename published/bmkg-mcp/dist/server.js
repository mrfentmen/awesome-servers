import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getForecast, getFeltEarthquakes, getLatestEarthquakes, warningDetail } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bmkg-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_forecast", {
        title: "Get village forecast",
        description: "3-hourly 3-day BMKG forecast for an Indonesian village by adm4 code (e.g. 31.71.03.1001 Kemayoran, Jakarta). Codes at kodewilayah.id.",
        inputSchema: z.object({
            adm4: z.string().describe("Village code W.X.Y.Z"),
        }),
        annotations: READ_ONLY,
    }, async ({ adm4 }) => {
        try {
            return text(await getForecast(adm4));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_felt_earthquakes", {
        title: "Get felt earthquakes",
        description: "Recently felt Indonesian earthquakes: magnitude, depth, location, MMI scale.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getFeltEarthquakes());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_latest_earthquakes", {
        title: "Get latest earthquakes",
        description: "Latest Indonesian earthquakes M5+: time, coordinates, magnitude, region.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getLatestEarthquakes());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("latest_earthquake", {
        title: "Latest earthquake",
        description: "The single most recent BMKG earthquake in full: magnitude, depth, coordinates, tsunami potential and where it was felt.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement earthquake locally (paywall removed)
        try {
            return textError("Not yet implemented: earthquake");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("weather_warnings", {
        title: "Weather warnings",
        description: "BMKG's live nowcast warning feed, filtered by region, with CAP document links.",
        inputSchema: z.object({ region: z.string().describe("Optional region name in the warning title.").optional(), limit: z.number().describe("Maximum warnings, 1-30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement warnings locally (paywall removed)
        try {
            return textError("Not yet implemented: warnings");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("warning_detail", {
        title: "Warning severity and affected areas",
        description: "Read a BMKG CAP alert's urgency, severity, certainty, validity period, instructions and geographic boundary.",
        inputSchema: z.object({ alertUrl: z.string().describe("CAP XML URL returned by weather_warnings.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await warningDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bmkg-mcp";
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
    return server;
}
