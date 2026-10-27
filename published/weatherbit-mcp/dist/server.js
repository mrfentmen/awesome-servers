import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCurrent, getDailyForecast, getHourlyForecast, getAlerts, getAirQuality } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "weatherbit-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_current", {
        title: "Get current weather",
        description: "Current Weatherbit conditions: temperature, feels-like, humidity, wind, clouds, UV, visibility.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await getCurrent(lat, lon));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_daily_forecast", {
        title: "Get daily forecast",
        description: "Weatherbit daily forecast: highs/lows, rain chance, snow, wind, UV per day.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            days: z.number().default(7).describe("Days ahead, max 16"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon, days }) => {
        try {
            return text(await getDailyForecast(lat, lon, days));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_hourly_forecast", {
        title: "Get hourly forecast",
        description: "Weatherbit hourly forecast steps: temperature, precipitation, wind, humidity.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            hours: z.number().default(24).describe("Hours ahead, max 240"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon, hours }) => {
        try {
            return text(await getHourlyForecast(lat, lon, hours));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_alerts", {
        title: "Get severe alerts",
        description: "Active Weatherbit severe weather alerts for a point: title, severity, description, timing.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await getAlerts(lat, lon));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_air_quality", {
        title: "Get air quality",
        description: "Current Weatherbit air quality: AQI, PM2.5, PM10, ozone, NO2, SO2, CO.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await getAirQuality(lat, lon));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nws_point_forecast", {
        title: "NWS point forecast",
        description: "US National Weather Service forecast for any point on Earth: period, temperature, wind and precipitation chance, plus the full sentence forecast. US only, no key needed.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            periods: z.number().default(7).describe("Forecast periods to show, 1-14"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement forecast locally (paywall removed)
            try {
                return textError("Not yet implemented: forecast");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("open_meteo_air_quality", {
        title: "Open-Meteo air quality",
        description: "Keyless air quality for any point on Earth: US and European AQI, PM2.5, PM10, ozone, NO2, SO2, CO, an hourly PM forecast and pollen counts. No key needed.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            hours: z.number().default(12).describe("Hours of hourly PM to show, 1-48"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement quality locally (paywall removed)
            try {
                return textError("Not yet implemented: quality");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "weatherbit-mcp";
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
    return server;
}
