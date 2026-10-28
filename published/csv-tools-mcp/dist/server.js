import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { csvFilter, csvSummary, csvToJson, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "csv-tools-mcp", version: "1.0.0" });
    server.tool("csv_summary", "Columns, row count and detected value types for a CSV text.", {
        csv: z.string().min(1).describe("CSV text, including a header row"),
        delimiter: z.string().optional().describe("Field delimiter; detected automatically when omitted")
    }, async (a) => {
        try {
            return text(await csvSummary(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("csv_to_json", "Convert CSV rows into JSON objects keyed by column name.", {
        csv: z.string().min(1).describe("CSV text with a header row"),
        limit: z.number().int().min(1).max(100).default(20).describe("Rows to convert"),
        delimiter: z.string().optional().describe("Field delimiter; detected automatically when omitted")
    }, async (a) => {
        try {
            return text(await csvToJson(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("csv_filter", "Rows where one column contains a value.", {
        csv: z.string().min(1).describe("CSV text with a header row"),
        column: z.string().min(1).describe("Column name to test"),
        value: z.string().describe("Text the column must contain (case-insensitive)"),
        limit: z.number().int().min(1).max(50).default(10).describe("Rows to return"),
        delimiter: z.string().optional().describe("Field delimiter; detected automatically when omitted")
    }, async (a) => {
        try {
            return text(await csvFilter(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
