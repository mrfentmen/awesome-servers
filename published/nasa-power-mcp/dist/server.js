import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { climatology, dailyPoint, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "nasa-power-mcp", version: "1.0.1" });
    server.tool("daily_point", "Daily climate series for a coordinate over a date range.", {
        latitude: z.number().min(-90).max(90).describe("Latitude"),
        longitude: z.number().min(-180).max(180).describe("Longitude"),
        start: z.string().regex(/^\d{8}$/).describe("Start date YYYYMMDD"),
        end: z.string().regex(/^\d{8}$/).describe("End date YYYYMMDD"),
        parameters: z.string().default("T2M,PRECTOTCORR,WS2M").describe("Comma-separated POWER parameters")
    }, async (a) => {
        try {
            return text(await dailyPoint(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("climatology", "Monthly climatology for a coordinate: the long-term average by month.", {
        latitude: z.number().min(-90).max(90).describe("Latitude"),
        longitude: z.number().min(-180).max(180).describe("Longitude"),
        parameters: z.string().default("T2M,PRECTOTCORR").describe("Comma-separated POWER parameters")
    }, async (a) => {
        try {
            return text(await climatology(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
