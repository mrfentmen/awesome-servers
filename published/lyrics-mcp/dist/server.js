import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getLyrics } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "lyrics-mcp", version: "1.0.0" });
    server.registerTool("get_lyrics", {
        title: "Get lyrics",
        description: "Get lyrics for an artist and song title.",
        inputSchema: z.object({ artist: z.string().describe("Artist name."), song: z.string().describe("Song title.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await getLyrics(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_artist_metadata", {
        title: "Search artist metadata on MusicBrainz",
        description: "Look up artists by name in the MusicBrainz database: type, country, area, active years, tags and MusicBrainz id.",
        inputSchema: z.object({
            query: z.string().describe("Artist name to search for."),
            limit: z.number().int().min(1).max(10).optional().describe("How many artists to return (1-10, default 5)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement metadata locally (paywall removed)
        try {
            return textError("Not yet implemented: metadata");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_store_songs", {
        title: "Search songs in the iTunes store",
        description: "Search the public iTunes store catalogue for songs: album, release date, runtime, explicitness and a preview when one exists.",
        inputSchema: z.object({
            term: z.string().describe("Song, album or artist text to search for."),
            limit: z.number().int().min(1).max(10).optional().describe("How many songs to return (1-10, default 5)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement songs locally (paywall removed)
        try {
            return textError("Not yet implemented: songs");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lyrics-mcp";
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
