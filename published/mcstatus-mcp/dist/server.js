import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { status, playerProfile } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mcstatus-mcp", version: "1.0.0" });
    server.registerTool("status", {
        title: "Status",
        description: "Get Minecraft server status.",
        inputSchema: z.object({ host: z.string().describe("Server host or IP."), port: z.number().describe("Server port.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await status(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("latest_versions", {
        title: "Latest versions",
        description: "Latest Minecraft Java releases and snapshots from the official Mojang version manifest, with release dates.",
        inputSchema: z.object({ kind: z.string().describe("release, snapshot or both.").optional(), limit: z.number().describe("Max versions.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement versions locally (paywall removed)
        try {
            return textError("Not yet implemented: versions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("player_profile", {
        title: "Player profile",
        description: "Resolve a Minecraft username to its account UUID using the official Mojang profile API.",
        inputSchema: z.object({ name: z.string().describe("Minecraft username.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await playerProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mcstatus-mcp";
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
