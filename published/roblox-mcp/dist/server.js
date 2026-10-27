import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { user } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "roblox-mcp", version: "1.0.0" });
    server.registerTool("user", {
        title: "User",
        description: "Roblox user profile.",
        inputSchema: z.object({ id: z.number().describe("User id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await user(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("user_by_name", {
        title: "User by name",
        description: "Look a Roblox player up by username to get their numeric id and display name, which the id based lookup cannot do.",
        inputSchema: z.object({ username: z.string().describe("Roblox username."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement name locally (paywall removed)
        try {
            return textError("Not yet implemented: name");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("user_games", {
        title: "User games",
        description: "The public games a Roblox player has made, with playing and visit counts, which the profile endpoint never shows.",
        inputSchema: z.object({ userId: z.number().describe("Roblox user id."), limit: z.number().describe("Max games.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement games locally (paywall removed)
        try {
            return textError("Not yet implemented: games");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("group_info", {
        title: "Group info",
        description: "A Roblox group's public record: name, description, owner, member and role counts, which no existing tool returns.",
        inputSchema: z.object({ groupId: z.number().describe("Roblox group id."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "roblox-mcp";
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
