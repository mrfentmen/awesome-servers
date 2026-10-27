import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { brawler, brawlers } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "brawl-stars-mcp", version: "1.0.0" });
    server.registerTool("brawlers", {
        title: "Brawlers",
        description: "List all Brawl Stars brawlers.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await brawlers());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("brawler", {
        title: "Brawler",
        description: "Get a single brawler by name.",
        inputSchema: z.object({ name: z.string().describe("Brawler name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await brawler(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("game_maps", {
        title: "Game maps",
        description: "Brawl Stars maps with their game mode and environment, active by default, optionally filtered to one mode.",
        inputSchema: z.object({ mode: z.string().describe("Game mode name fragment, e.g. Heist.").optional(), include_disabled: z.boolean().describe("Include retired maps.").optional(), limit: z.number().describe("Max maps.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement maps locally (paywall removed)
        try {
            return textError("Not yet implemented: maps");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("game_modes", {
        title: "Game modes",
        description: "Brawl Stars game modes with team size and description, such as Gem Grab, Heist and Bounty.",
        inputSchema: z.object({ include_disabled: z.boolean().describe("Include retired modes.").optional(), limit: z.number().describe("Max modes.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement modes locally (paywall removed)
        try {
            return textError("Not yet implemented: modes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "brawl-stars-mcp";
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
