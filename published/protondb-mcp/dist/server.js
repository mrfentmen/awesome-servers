import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { summary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "protondb-mcp", version: "1.0.0" });
    server.registerTool("summary", {
        title: "Summary",
        description: "Proton compatibility summary for a Steam app.",
        inputSchema: z.object({ appid: z.number().describe("Steam app id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await summary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("game_details", {
        title: "Game details",
        description: "The Steam store record behind a ProtonDB app id: name, developer, release date, platforms, genres and controller support.",
        inputSchema: z.object({ appid: z.number().describe("Steam app id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_app_id", {
        title: "Find app id",
        description: "Search the Steam store by game name to find the app id you need for a ProtonDB lookup.",
        inputSchema: z.object({ query: z.string().max(120).describe("Game name."), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement id locally (paywall removed)
        try {
            return textError("Not yet implemented: id");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "protondb-mcp";
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
