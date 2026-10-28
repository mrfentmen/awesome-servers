import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dailySummaries, monthlySummaries, stationExtremes, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ghcn-mcp", version: "1.0.0" });
    server.tool("daily_summaries", "Daily values for a GHCN station over a short window: max/min temperature, rain, snow and wind.", {
        station: z.string().min(3).describe("GHCN station id, e.g. USW00094728 (New York Central Park)"),
        startDate: z.string().min(8).describe("Start date, YYYY-MM-DD"),
        endDate: z.string().min(8).describe("End date, YYYY-MM-DD (max 45 days after start)"),
        units: z.enum(["metric", "standard"]).default("metric").describe("metric = Celsius and mm, standard = Fahrenheit and inches")
    }, async (a) => {
        try {
            return text(await dailySummaries(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("monthly_summaries", "One row per month for a whole year: mean max/min, rain and extremes, from the monthly summaries dataset.", {
        station: z.string().min(3).describe("GHCN station id, e.g. USW00094728"),
        year: z.number().int().min(1850).max(2100).describe("Calendar year"),
        units: z.enum(["metric", "standard"]).default("metric").describe("metric or standard units")
    }, async (a) => {
        try {
            return text(await monthlySummaries(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("station_extremes", "Scan up to a year of daily data and report the warmest, coldest and wettest days.", {
        station: z.string().min(3).describe("GHCN station id, e.g. USW00094728"),
        startDate: z.string().min(8).describe("Start date, YYYY-MM-DD"),
        endDate: z.string().min(8).describe("End date, YYYY-MM-DD (max 366 days after start)"),
        units: z.enum(["metric", "standard"]).default("metric").describe("metric or standard units")
    }, async (a) => {
        try {
            return text(await stationExtremes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
