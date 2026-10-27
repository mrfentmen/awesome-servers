import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatObject, searchObjects, SmithsonianError, openAccessCorpus, openAccessDigest } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "smithsonian-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_objects", {
        title: "Search collections",
        description: "Smithsonian artifacts, art, and specimens by keyword.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'Apollo 11', 'dinosaur'"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const rows = await searchObjects(query, limit);
            if (rows.length === 0)
                return text(`Nothing found for "${query}".`);
            return text(rows.map((o, i) => formatObject(o, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("openaccess_corpus", {
        title: "Open Access corpus",
        description: "Inventory of the Smithsonian Open Access metadata archive on its public S3 bucket - the keyless route to the same records. Lists the unit folders, or the shard count, byte size and update dates for one unit.",
        inputSchema: z.object({ unit: z.string().describe("Unit code, e.g. 'saam', 'nasm'. Omit to list every unit.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await openAccessCorpus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("openaccess_digest", {
        title: "Open Access digest",
        description: "Summarise a bounded sample of the Smithsonian Open Access metadata for one unit: object types, topics, access rights, date span and example records, read straight from the keyless S3 archive.",
        inputSchema: z.object({
            unit: z.string().describe("Unit code, e.g. 'saam'."),
            maxShards: z.number().int().min(1).max(25).default(3),
            maxBytes: z.number().int().min(100000).max(40000000).default(8000000),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await openAccessDigest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "smithsonian-mcp";
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
    if (e instanceof SmithsonianError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
