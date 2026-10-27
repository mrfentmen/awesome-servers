import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { search, user } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'mixcloud-mcp', version: '1.0.0' });
    server.registerTool('search', {
        title: "Search",
        description: 'Search Mixcloud cloudcasts.',
        inputSchema: z.object({ query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('user', {
        title: "User",
        description: 'Mixcloud user profile.',
        inputSchema: z.object({ user: z.string().describe('User name.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await user(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("user_cloudcasts", {
        title: "User cloudcasts",
        description: "The most recent cloudcasts a Mixcloud user has uploaded, with length, play, like and comment counts.",
        inputSchema: z.object({ user: z.string().describe("Mixcloud user name."), limit: z.number().int().min(1).max(20).default(8).describe("Max cloudcasts.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement cloudcasts locally (paywall removed)
        try {
            return textError("Not yet implemented: cloudcasts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("user_playlists", {
        title: "User playlists",
        description: "The playlists a Mixcloud user has published, with how many cloudcasts each one holds.",
        inputSchema: z.object({ user: z.string().describe("Mixcloud user name."), limit: z.number().int().min(1).max(30).default(10).describe("Max playlists.") }),
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
    const serverName = "mixcloud-mcp";
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
