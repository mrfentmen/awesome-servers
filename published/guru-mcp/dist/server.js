import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listTeams, searchCards, getCollection, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "guru-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_teams", {
        title: "List teams",
        description: "Guru teams (also validates credentials).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listTeams());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_cards", {
        title: "Search cards",
        description: "Card search with Guru Query Language.",
        inputSchema: z.object({
            query: z.string().describe("GQL query, e.g. 'verificationState: Trusted'."),
            max_results: z.string().describe("Max results (max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, max_results }) => {
        try {
            return text(await searchCards(query, max_results));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_collection", {
        title: "Get collection",
        description: "Collection by UUID.",
        inputSchema: z.object({
            collection_id: z.string().describe("Collection UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ collection_id }) => {
        try {
            return text(await getCollection(collection_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "guru-mcp";
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
