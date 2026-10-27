import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { airQuality, flood, hourly, m0_formatForecast, m0_formatPlace, m0_geocode, m0_getForecast, m1_elevation, m2_uvForecast, marine } from './api.js';
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'open-meteo-mcp', version: '1.0.0' });
    server.registerTool("geocode", {
        title: "Geocode",
        description: "Find a place by name and get its coordinates.",
        inputSchema: z.object({ place: z.string().describe("Place name, e.g. 'Tokyo' or 'Austin, TX'"), count: z.number().int().min(1).max(10).default(5) }),
        annotations: READ_ONLY,
    }, async ({ place, count }) => {
        try {
            const results = await m0_geocode(place, count);
            if (results.length === 0)
                return text(`No place found for "${place}".`);
            return text(`Places matching "${place}":\n\n${results.map((p, i) => `${i + 1}. ${m0_formatPlace(p)}`).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_forecast", {
        title: "Get forecast",
        description: "Weather forecast for coordinates.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude, e.g. 40.71"),
            longitude: z.number().describe("Longitude, e.g. -74.0"),
            days: z.number().int().min(1).max(14).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude, days }) => {
        try {
            const f = await m0_getForecast(latitude, longitude, days);
            return text(m0_formatForecast(f, `${latitude}, ${longitude}`));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_forecast_for_place", {
        title: "Get forecast for place",
        description: "Weather forecast for a named place, geocoded for you.",
        inputSchema: z.object({ place: z.string().describe("Place name, e.g. 'Reykjavik'"), days: z.number().int().min(1).max(14).default(5) }),
        annotations: READ_ONLY,
    }, async ({ place, days }) => {
        try {
            const results = await m0_geocode(place, 1);
            if (results.length === 0)
                return text(`No place found for "${place}".`);
            const p = results[0];
            if (p.latitude == null || p.longitude == null)
                return text(`No coordinates for "${place}".`);
            const f = await m0_getForecast(p.latitude, p.longitude, days);
            return text(m0_formatForecast(f, `${p.name}${p.country ? `, ${p.country}` : ""}`));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("elevation", {
        title: "Elevation",
        description: "Get the elevation for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_elevation(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("uv_forecast", {
        title: "Uv forecast",
        description: "Get the daily UV index forecast for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), days: z.number().describe("Days ahead.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m2_uvForecast(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("air_quality", {
        title: "Air quality",
        description: "Current AQI and pollutants for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await airQuality({ lat, lon }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("marine", {
        title: "Marine",
        description: "Wave height and sea temperature for coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await marine({ lat, lon }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("flood", {
        title: "Flood",
        description: "River discharge near coordinates.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async ({ lat, lon }) => {
        try {
            return text(await flood({ lat, lon }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("hourly", {
        title: "Hourly",
        description: "Hour-by-hour temperature and rain chance.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), hours: z.number().int().min(1).max(48).default(12) }),
        annotations: READ_ONLY,
    }, async ({ lat, lon, hours }) => {
        try {
            return text(await hourly({ lat, lon, hours }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
