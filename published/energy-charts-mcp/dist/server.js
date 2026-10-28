import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { power_mix, day_ahead_price, installed_power, renewable_share, power_series, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "energy-charts-mcp", version: "1.0.0" });
    server.tool("power_mix", "Current electricity generation mix for a country", {
        country: z.string().length(2).default("de").describe("Two-letter country code, e.g. de, fr, nl"),
        limit: z.number().int().min(1).max(25).default(12).describe("Generation types to list")
    }, async (a) => {
        try {
            return text(await power_mix(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("day_ahead_price", "Day-ahead electricity prices for a bidding zone", {
        bzn: z.string().min(2).default("DE-LU").describe("Bidding zone, e.g. DE-LU, FR, NL, AT"),
        limit: z.number().int().min(1).max(48).default(8).describe("Price intervals to show")
    }, async (a) => {
        try {
            return text(await day_ahead_price(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("installed_power", "Installed generation capacity by type for a country", {
        country: z.string().length(2).default("de").describe("Two-letter country code, e.g. de"),
        limit: z.number().int().min(1).max(25).default(12).describe("Types to list")
    }, async (a) => {
        try {
            return text(await installed_power(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("renewable_share", "Renewable share of generation, with solar and wind split", {
        country: z.string().length(2).default("de").describe("Two-letter country code, e.g. de")
    }, async (a) => {
        try {
            return text(await renewable_share(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("power_series", "Average generation by type over a date range", {
        country: z.string().length(2).default("de").describe("Two-letter country code"),
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date, YYYY-MM-DD"),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date, YYYY-MM-DD"),
        limit: z.number().int().min(1).max(20).default(8).describe("Types to list")
    }, async (a) => {
        try {
            return text(await power_series(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
