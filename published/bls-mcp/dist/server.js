import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { latestValue, listSurveys, popularSeries, series, seriesRange } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bls-mcp", version: "1.0.0" });
    server.registerTool("series", {
        title: "Series",
        description: "Get a BLS series.",
        inputSchema: z.object({ id: z.string().describe("Series id like CES0000000001."), year: z.string().describe("Start year like 2023.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await series(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("latest_value", {
        title: "Latest value",
        description: "Latest data point of a BLS series.",
        inputSchema: z.object({ id: z.string().describe("Series id like LNS14000000.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await latestValue(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("series_range", {
        title: "Series range",
        description: "BLS series values over a year range.",
        inputSchema: z.object({ id: z.string().describe("Series id like LNS14000000."), start: z.string().describe("Start year like 2020.").optional(), end: z.string().describe("End year like 2024.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await seriesRange(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("popular_series", {
        title: "Popular series",
        description: "Most-requested BLS series ids.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await popularSeries());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("list_surveys", {
        title: "List surveys",
        description: "BLS surveys (CPI, employment, productivity...).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listSurveys());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
