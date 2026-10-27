import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { matches, leagues } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "openligadb-soccer-mcp", version: "1.0.0" });
    server.registerTool("matches", {
        title: "Matches",
        description: "Matches for a league and season.",
        inputSchema: z.object({ league: z.string().describe("League like bl1.").optional(), season: z.number().describe("Season year.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await matches(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("top_scorers", {
        title: "Top scorers",
        description: "Top goal scorers for a league and season.",
        inputSchema: z.object({ league: z.string().describe("League like bl1.").optional(), season: z.number().describe("Season year.").optional(), limit: z.number().describe("Max scorers.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement scorers locally (paywall removed)
        try {
            return textError("Not yet implemented: scorers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("leagues", {
        title: "Leagues",
        description: "Available OpenLigaDB league shortcuts, seasons and names.",
        inputSchema: z.object({ limit: z.number().describe("Max leagues.").optional(), sport: z.string().describe("Filter by sport name substring.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await leagues(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "openligadb-soccer-mcp";
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
