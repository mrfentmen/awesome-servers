import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { systems, station_status, station_info, free_bikes, system_info, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "gbfs-mcp", version: "1.0.0" });
    server.tool("systems", "List supported bike-share cities", {
    // no arguments
    }, async (a) => {
        try {
            return text(await systems(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("station_status", "Live bike and dock availability per station", {
        city: z.string().min(2).default("nyc").describe("City: nyc, chicago, sf, boston or montreal"),
        search: z.string().min(2).optional().describe("Only stations whose name contains this text"),
        limit: z.number().int().min(1).max(50).default(15).describe("Stations to return")
    }, async (a) => {
        try {
            return text(await station_status(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("station_info", "Station locations and capacity", {
        city: z.string().min(2).default("nyc").describe("City: nyc, chicago, sf, boston or montreal"),
        search: z.string().min(2).optional().describe("Only stations whose name contains this text"),
        limit: z.number().int().min(1).max(50).default(15).describe("Stations to return")
    }, async (a) => {
        try {
            return text(await station_info(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("free_bikes", "Free-floating bikes not docked at a station", {
        city: z.string().min(2).default("nyc").describe("City: nyc, chicago, sf, boston or montreal"),
        limit: z.number().int().min(1).max(50).default(15).describe("Bikes to return")
    }, async (a) => {
        try {
            return text(await free_bikes(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("system_info", "System metadata for a bike-share city", {
        city: z.string().min(2).default("nyc").describe("City: nyc, chicago, sf, boston or montreal")
    }, async (a) => {
        try {
            return text(await system_info(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
