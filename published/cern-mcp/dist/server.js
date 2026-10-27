import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CernError, formatRecord, getRecord, searchRecords, recordFiles } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "cern-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_records", {
        title: "Search records",
        description: "Search CERN Open Data: datasets, software, news, glossary.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'Higgs', 'CMS muon', 'ROOT'"),
            type: z.string().default("").describe("Filter: Dataset, Software, News, Glossary (empty = all)"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, type, limit }) => {
        try {
            if (!query.trim())
                return textError("Error: query is empty.");
            const rows = await searchRecords(query, type, limit);
            if (rows.length === 0)
                return text(`No CERN records for "${query}".`);
            return text(rows.map((r, i) => formatRecord(r, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_record", {
        title: "Get record",
        description: "One CERN record: abstract, type, files, link.",
        inputSchema: z.object({
            id: z.string().describe("Numeric record id (use search_records)"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(await getRecord(id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("record_files", {
        title: "Record files",
        description: "The files inside a CERN Open Data record, with their type, size and checksum, read from the record's own file bucket.",
        inputSchema: z.object({ id: z.number().describe("CERN record id, e.g. 60."), limit: z.number().describe("Max files.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recordFiles(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "cern-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof CernError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
