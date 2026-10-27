import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createRecord, formatRecord, health, listCollections, listRecords, PocketBaseError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "pocketbase-mcp",
        version: "1.0.0",
    });
    server.registerTool("health", {
        title: "Check health",
        description: "Check that the PocketBase instance answers. Set POCKETBASE_URL for non-default hosts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await health());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_collections", {
        title: "List collections",
        description: "List PocketBase collections. Needs POCKETBASE_EMAIL + POCKETBASE_PASSWORD of a superuser.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listCollections();
            if (rows.length === 0)
                return text("No collections.");
            return text(rows.map((c, i) => `${i + 1}. [${c.id}] ${c.name}${c.type ? ` (${c.type})` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_records", {
        title: "List records",
        description: "List records of a collection, with optional PocketBase filter syntax.",
        inputSchema: z.object({
            collection: z.string().describe("Collection name or id, e.g. 'notes'"),
            filter: z.string().default("").describe("Filter expression, e.g. 'title ~ \"hi\"'"),
            limit: z.number().int().min(1).max(200).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ collection, filter, limit }) => {
        try {
            const rows = await listRecords(collection, filter, limit);
            if (rows.length === 0)
                return text(`No records in ${collection}.`);
            return text(rows.map((r, i) => formatRecord(r, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_record", {
        title: "Create record",
        description: "Create a record in a collection from a JSON object.",
        inputSchema: z.object({
            collection: z.string().describe("Collection name or id"),
            data: z.record(z.string(), z.unknown()).describe("Field values as a JSON object"),
        }),
        annotations: WRITE,
    }, async ({ collection, data }) => {
        try {
            const r = await createRecord(collection, data);
            return text(`Created record ${r.id ?? ""} in ${collection}.`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pocketbase-mcp";
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
function errorMessage(e) {
    if (e instanceof PocketBaseError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
