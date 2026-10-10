import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getDailyForecast, getHourlyForecast, getObservations, forecast_window } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bom-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_daily_forecast", {
        title: "Get daily forecast",
        description: "BOM 7-day daily forecast for coordinates: rain chance, min/max, UV, fire danger.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await getDailyForecast(lat, lon));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_hourly_forecast", {
        title: "Get hourly forecast",
        description: "BOM 3-hourly forecast steps for coordinates: temp, rain, wind, humidity.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await getHourlyForecast(lat, lon));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_observations", {
        title: "Get station observations",
        description: "Latest BOM station observations: temp, humidity, wind, pressure, rain. Product like IDN60901 (NSW), station like 94768 (Sydney).",
        inputSchema: z.object({
            product: z.string().describe("Product code, e.g. 'IDN60901'"),
            stationId: z.string().describe("Station id, e.g. '94768'"),
        }),
        annotations: READ_ONLY,
    }, async ({ product, stationId }) => {
        try {
            return text(await getObservations(product, stationId));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("forecast_table", {
        title: "Forecast as a table",
        description: "BOM daily forecast for coordinates as a readable table, with the window's low, high, wettest day and UV peak worked out, instead of a raw JSON dump.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            limit: z.number().optional().describe("How many days to tabulate, 1 to 14. Defaults to all of them."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: forecast_table ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_bom_forecast_table", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("forecast_hazards", {
        title: "Forecast hazards",
        description: "Fire danger with BOM colour ratings, surf danger, UV category and rain confidence for coordinates, collected from across the daily forecast into one hazard reading.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: forecast_hazards ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_bom_forecast_hazards", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("forecast_window", {
        title: "Forecast window summary",
        description: "Summarise the BOM daily forecast over a date range: high and low range, rain chance and measurable rain totals, daylight hours, then the days in the window.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude"),
            lon: z.number().describe("Longitude"),
            fromDate: z.string().optional().describe("Start of the window as YYYY-MM-DD. Defaults to the first forecast day."),
            toDate: z.string().optional().describe("End of the window as YYYY-MM-DD. Defaults to the last forecast day."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecast_window(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("resolve_location", {
        title: "Resolve location",
        description: "Resolve coordinates, or a geohash, to the Bureau of Meteorology's own location record: the named place and state, its timezone, the geohash cell centre and how far it is from your point, whether wave data is published there, and the marine area and tidal point. No other tool reads this endpoint.",
        inputSchema: z.object({ lat: z.number().describe("Latitude, -90 to 90. Needs lon as well.").optional(), lon: z.number().describe("Longitude, -180 to 180. Needs lat as well.").optional(), geohash: z.string().describe("A geohash, e.g. r3gx2f7 for Sydney. Used instead of lat/lon.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: resolve_location ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_bom_resolve_location", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
