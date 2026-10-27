import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, query } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "myvariant-mcp", version: "1.0.0" });
    server.registerTool("query", {
        title: "Query",
        description: "Query variants.",
        inputSchema: z.object({ q: z.string().describe("Variant query (e.g. chr7:g.140453136A>T)."), size: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await query(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get", {
        title: "Get",
        description: "Get a variant by id.",
        inputSchema: z.object({ id: z.string().describe("Variant id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await get(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("variant_fields", {
        title: "Variant fields",
        description: "Run a MyVariant query projected down to the fields you name - gene symbol, gnomad frequency, ClinVar calls - instead of a full record per hit.",
        inputSchema: z.object({ q: z.string().describe("MyVariant query, e.g. dbnsfp.genename:BRCA1."), fields: z.string().describe("Comma-separated fields to project, max 20.").optional(), size: z.number().describe("Max hits.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement fields locally (paywall removed)
        try {
            return textError("Not yet implemented: fields");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "myvariant-mcp";
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
