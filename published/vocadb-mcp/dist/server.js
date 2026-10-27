import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, tagSearch } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "vocadb-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search VocaDB songs.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_search", {
        title: "Artist search",
        description: "Search VocaDB for Vocaloid artists and producers by name, with type, picture flag and a short description.",
        inputSchema: z.object({ query: z.string().describe("Artist name, e.g. camellia."), limit: z.number().int().min(1).max(25).default(8).describe("Max results.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("album_search", {
        title: "Album search",
        description: "Search VocaDB for albums by name, with the credited artist, disc type and release date.",
        inputSchema: z.object({ query: z.string().describe("Album name, e.g. exit."), limit: z.number().int().min(1).max(25).default(8).describe("Max results.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("song_detail", {
        title: "Song detail",
        description: "Retrieve a song by id with duration, original version, tags and video links.",
        inputSchema: z.object({ id: z.number().int().min(1).max(2147483647).describe("Song id from search.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_profile", {
        title: "Artist profile",
        description: "Retrieve an artist biography, translated names, release date and reference links by id.",
        inputSchema: z.object({ id: z.number().int().min(1).max(2147483647).describe("Artist id from artist search.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tag_search", {
        title: "Tag search",
        description: "Discover VocaDB genre and subject tags, their descriptions and usage counts.",
        inputSchema: z.object({ query: z.string().max(200).describe("Tag search terms."), limit: z.number().int().min(1).max(25).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tagSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "vocadb-mcp";
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
    return server;
}
