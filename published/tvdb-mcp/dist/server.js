import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatSeries, getSeries, searchSeries, TvdbError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "tvdb-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_series", {
        title: "Search series",
        description: "TV series by title with years, networks, statuses.",
        inputSchema: z.object({
            query: z.string().describe("Series title, e.g. 'Severance'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const rows = await searchSeries(query, limit);
            if (rows.length === 0)
                return text(`No series for "${query}".`);
            return text(rows.map((s, i) => formatSeries(s, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_series", {
        title: "Get series",
        description: "One series: network, status, overview.",
        inputSchema: z.object({
            id: z.string().describe("TVDB series id (use search_series)"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(await getSeries(id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "tvdb-mcp";
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
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof TvdbError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
