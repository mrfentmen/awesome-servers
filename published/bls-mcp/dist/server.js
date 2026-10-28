import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listSurveys, popularSeries, seriesData, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "bls-mcp", version: "1.0.0" });
    server.tool("series_data", "Observations for one BLS series id over a year range.", {
        seriesId: z.string().regex(/^[A-Za-z0-9]{4,40}$/).describe("BLS series id, e.g. CES0000000001 or CUUR0000SA0"),
        startYear: z.string().regex(/^\d{4}$/).describe("First year YYYY"),
        endYear: z.string().regex(/^\d{4}$/).describe("Last year YYYY, at most 20 years after startYear")
    }, async (a) => {
        try {
            return text(await seriesData(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_surveys", "Every BLS survey with its abbreviation and name.", {
        limit: z.number().int().min(1).max(120).default(40).describe("Surveys to return")
    }, async (a) => {
        try {
            return text(await listSurveys(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("popular_series", "The series BLS highlights as most requested, with their ids.", {
        limit: z.number().int().min(1).max(50).default(20).describe("Series to return")
    }, async (a) => {
        try {
            return text(await popularSeries(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
