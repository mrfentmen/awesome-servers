import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatAlbum, listArtists, NavidromeError, ping, searchLibrary, streamUrl } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "navidrome-mcp",
        version: "1.0.0",
    });
    server.registerTool("ping", {
        title: "Ping server",
        description: "Check the Navidrome server answers. Set NAVIDROME_URL for non-default hosts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await ping());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_artists", {
        title: "List artists",
        description: "Artists in the library. Needs NAVIDROME_USER + NAVIDROME_PASSWORD.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listArtists();
            if (rows.length === 0)
                return text("No artists.");
            return text(rows.map((a, i) => `${i + 1}. [${a.id}] ${a.name}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_library", {
        title: "Search library",
        description: "Search artists and albums by name.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'miles davis'"),
            limit: z.number().int().min(1).max(50).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const { artists, albums } = await searchLibrary(query, limit);
            const parts = [];
            if (artists.length)
                parts.push(`Artists:\n${artists.map((a, i) => `${i + 1}. [${a.id}] ${a.name}`).join("\n")}`);
            if (albums.length)
                parts.push(`Albums:\n${albums.map((a, i) => formatAlbum(a, i)).join("\n")}`);
            if (!parts.length)
                return text(`Nothing found for "${query}".`);
            return text(parts.join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stream_url", {
        title: "Stream URL",
        description: "Build an authenticated stream URL for a song id (no fetch).",
        inputSchema: z.object({
            song_id: z.string().describe("Song id from search results"),
        }),
        annotations: READ_ONLY,
    }, async ({ song_id }) => {
        try {
            if (!song_id.trim())
                return textError("Error: song id is empty.");
            return text(streamUrl(song_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "navidrome-mcp";
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
function errorMessage(e) {
    if (e instanceof NavidromeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
