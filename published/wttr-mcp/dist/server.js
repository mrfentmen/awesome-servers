import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { current, sunMoon } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "wttr-mcp", version: "1.0.0" });
    server.registerTool("current", {
        title: "Current",
        description: "Current weather for a place.",
        inputSchema: z.object({ location: z.string().describe("City name or coordinates.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await current(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("forecast", {
        title: "Forecast",
        description: "Three-day daily forecast for a place: minimum, maximum and average temperature, hours of sunshine, UV index, snowfall and sunrise/sunset.",
        inputSchema: z.object({ location: z.string().describe("City name or coordinates, e.g. 'Lisbon'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement forecast locally (paywall removed)
        try {
            return textError("Not yet implemented: forecast");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hourly", {
        title: "Hourly",
        description: "Hour-by-hour conditions for one forecast day: temperature, feels-like, chance of rain, snow and thunder, humidity, wind and gusts, pressure, UV and visibility.",
        inputSchema: z.object({ location: z.string().describe("City name or coordinates."), day: z.number().int().min(0).max(2).default(0).describe("0 for today, 1 for tomorrow, 2 for the day after") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement hourly locally (paywall removed)
        try {
            return textError("Not yet implemented: hourly");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sun_moon", {
        title: "Sun and moon",
        description: "Sunrise, sunset, moon phase, moon illumination, moonrise and moonset for a place across the forecast window.",
        inputSchema: z.object({ location: z.string().describe("City name or coordinates.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sunMoon(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("resolve_location", {
        title: "Resolve location",
        description: "Report what wttr.in made of a place name or a coordinate pair: the area, region and country it resolved to, the latitude and longitude it will actually report weather for, the days the forecast covers and the observation time. Accepts coordinates as well as names. The current tool prints the area name and country only, so an ambiguous name that resolved somewhere unexpected looks exactly like a correct one.",
        inputSchema: z.object({ location: z.string().describe("City name or coordinates, for example 'Lisbon' or '38.72,-9.14'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement location locally (paywall removed)
        try {
            return textError("Not yet implemented: location");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("forecast_ranking", {
        title: "Rank forecast days",
        description: "Rank the forecast days for a place against each other by peak chance of rain, snow, thunder, fog or frost, strongest wind or gust, or the difference between the day's high and low, each taken from wttr.in's own three-hourly blocks and reported with the block the peak fell in. The forecast tool lists the days without ranking them and the hourly tool prints one day at a time, so neither can say which day to pick.",
        inputSchema: z.object({ location: z.string().describe("City name or coordinates, for example 'Lisbon'."), by: z.string().describe("rain, snow, thunder, fog, frost, wind, gust or temperature_swing. Optional, rain by default.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement ranking locally (paywall removed)
        try {
            return textError("Not yet implemented: ranking");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wttr-mcp";
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
