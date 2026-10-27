import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MetNoError, compare, currentConditions, daily, hourly, precipitationOutlook } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof MetNoError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "met-no-mcp", version: "1.0.0" });
    const lat = z.number().min(-90).max(90).describe("Latitude, e.g. 59.9139");
    const lon = z.number().min(-180).max(180).describe("Longitude, e.g. 10.7522");
    server.tool("current_conditions", "Weather right now for a coordinate, from the data behind yr.no.", { lat, lon }, async ({ lat: la, lon: lo }) => {
        try {
            return text(await currentConditions(la, lo));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("hourly_forecast", "Hour by hour temperature, wind, sky and rain.", {
        lat,
        lon,
        hours: z.number().int().min(3).max(48).default(24).describe("How many hours ahead (3-48)"),
    }, async ({ lat: la, lon: lo, hours }) => {
        try {
            return text(await hourly(la, lo, hours));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("daily_forecast", "Daily min and max temperature with total rain, up to nine days.", {
        lat,
        lon,
        days: z.number().int().min(1).max(9).default(5).describe("How many days (1-9)"),
    }, async ({ lat: la, lon: lo, days }) => {
        try {
            return text(await daily(la, lo, days));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("rain_outlook", "Only the hours when rain or snow is expected, with amounts.", {
        lat,
        lon,
        hours: z.number().int().min(3).max(48).default(24).describe("How many hours ahead (3-48)"),
    }, async ({ lat: la, lon: lo, hours }) => {
        try {
            return text(await precipitationOutlook(la, lo, hours));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("compare_locations", "Temperature at two coordinates side by side for the first forecast day.", {
        latA: z.number().min(-90).max(90).describe("First latitude"),
        lonA: z.number().min(-180).max(180).describe("First longitude"),
        latB: z.number().min(-90).max(90).describe("Second latitude"),
        lonB: z.number().min(-180).max(180).describe("Second longitude"),
    }, async ({ latA, lonA, latB, lonB }) => {
        try {
            return text(await compare(latA, lonA, latB, lonB));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
