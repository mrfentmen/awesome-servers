import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { stations_near, station_detail, results_by_site, results_by_characteristic, activities_by_site, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "water-quality-portal-mcp", version: "1.0.0" });
    server.tool("stations_near", "Water monitoring stations near a coordinate", {
        lat: z.number().min(-90).max(90).describe("Latitude"),
        lon: z.number().min(-180).max(180).describe("Longitude"),
        within: z.number().min(1).max(50).default(10).describe("Radius in miles"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum stations")
    }, async (a) => {
        try {
            return text(await stations_near(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("station_detail", "Details for one monitoring station", {
        siteId: z.string().min(3).describe("Station id such as USGS-06752260")
    }, async (a) => {
        try {
            return text(await station_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("results_by_site", "Water sample results at one station", {
        siteId: z.string().min(3).describe("Station id such as USGS-06752260"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum results")
    }, async (a) => {
        try {
            return text(await results_by_site(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("results_by_characteristic", "Results for one measured characteristic at a station", {
        siteId: z.string().min(3).describe("Station id"),
        characteristic: z.string().min(2).describe("Characteristic, e.g. Nitrate or pH"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum results")
    }, async (a) => {
        try {
            return text(await results_by_characteristic(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("activities_by_site", "Sampling activities recorded at a station", {
        siteId: z.string().min(3).describe("Station id"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum activities")
    }, async (a) => {
        try {
            return text(await activities_by_site(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
