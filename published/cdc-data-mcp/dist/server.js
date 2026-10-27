import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dataset, datasetSearch } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "cdc-data-mcp", version: "1.0.0" });
    server.registerTool("dataset", {
        title: "Dataset",
        description: "Query a CDC Socrata dataset.",
        inputSchema: z.object({ dataset_id: z.string().describe("Socrata dataset id like 9dzk-mvmi."), limit: z.number().describe("Max rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dataset(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dataset_metadata", {
        title: "Dataset metadata",
        description: "Schema and provenance for a CDC dataset: asset type, licence, update dates, view and download counts, and every column with its data type.",
        inputSchema: z.object({ dataset_id: z.string().describe("Socrata dataset id, e.g. bugr-bbfr."), show_columns: z.boolean().describe("Include per-column detail.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement metadata locally (paywall removed)
        try {
            return textError("Not yet implemented: metadata");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dataset_aggregate", {
        title: "Dataset aggregate",
        description: "Run a read-only SoQL aggregation against a CDC dataset with select, where, group and order, for counts, group-by breakdowns and sums.",
        inputSchema: z.object({ dataset_id: z.string().describe("Socrata dataset id, e.g. bugr-bbfr."), select: z.string().describe("SoQL select, e.g. count(*) or state, count(*) as n."), where: z.string().describe("SoQL where filter.").optional(), group: z.string().describe("Group-by expression.").optional(), order: z.string().describe("Order-by expression.").optional(), limit: z.number().describe("Max rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement aggregate locally (paywall removed)
        try {
            return textError("Not yet implemented: aggregate");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dataset_search", {
        title: "Dataset search",
        description: "Search the CDC open data catalog by keyword to discover dataset ids you can then query.",
        inputSchema: z.object({ query: z.string().describe("Search words, e.g. COVID vaccine."), only: z.string().describe("dataset, chart or any.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await datasetSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "cdc-data-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
