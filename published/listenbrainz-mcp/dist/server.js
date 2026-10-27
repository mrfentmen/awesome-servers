import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { popular, user } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "listenbrainz-mcp", version: "1.0.0" });
    server.registerTool("user", {
        title: "User",
        description: "Recent listens for a user.",
        inputSchema: z.object({ username: z.string().describe("ListenBrainz username."), count: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await user(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("popular", {
        title: "Popular",
        description: "Top artists for a user.",
        inputSchema: z.object({ username: z.string().describe("ListenBrainz username.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await popular(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("playlists", {
        title: "Playlists",
        description: "Public ListenBrainz playlists for a user, with title, creator, date and link.",
        inputSchema: z.object({ username: z.string().describe("ListenBrainz username."), count: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement playlists locally (paywall removed)
        try {
            return textError("Not yet implemented: playlists");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("top_recordings", {
        title: "Top recordings",
        description: "A user's most played tracks for a time range: week, month, year or all_time.",
        inputSchema: z.object({ username: z.string().describe("ListenBrainz username."), range: z.enum(["week", "month", "year", "all_time"]).default("all_time"), count: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement recordings locally (paywall removed)
        try {
            return textError("Not yet implemented: recordings");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "listenbrainz-mcp";
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
