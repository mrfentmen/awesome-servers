import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchImages, sourceIndex } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "openverse-mcp", version: "1.0.0" });
    server.registerTool("search_images", {
        title: "Search images",
        description: "Search openly licensed images.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchImages(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("source_index", {
        title: "Source index",
        description: "Every Openverse source with the number of images and audio files it contributes right now, so the source filter names are not guesswork.",
        inputSchema: z.object({ mediaType: z.string().describe("images or audio. Omit for both.").optional(), match: z.string().describe("Only show sources whose name contains this text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sourceIndex(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_audio", {
        title: "Search audio",
        description: "Search Openverse audio with the source, category and licence filters, with real page numbers. Only filters the API actually applies are offered.",
        inputSchema: z.object({ query: z.string().describe("Search terms, like jazz or rain."), source: z.string().describe("A source name from source_index. Openverse rejects a name that is not in that list.").optional(), category: z.string().describe("One of podcast, audiobook, news, music, pronunciation, sound_effect.").optional(), license: z.string().describe("Licence code, like by, by-sa or cc0. Openverse rejects one it does not know.").optional(), licenseType: z.string().describe("all, commercial or modification.").optional(), page: z.number().describe("Page number, starting at 1.").optional(), pageSize: z.number().describe("Results per page, 1 to 20 for anonymous callers. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement audio locally (paywall removed)
        try {
            return textError("Not yet implemented: audio");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("media_detail", {
        title: "Media detail",
        description: "One Openverse image or audio record in full, with the attribution wording to reuse and the optional ten related items.",
        inputSchema: z.object({ mediaType: z.string().describe("images or audio, the plural form the API uses in its URLs."), id: z.string().describe("Record id, as printed by a search."), includeRelated: z.boolean().describe("Also fetch the ten related items. Adds one request.").optional() }),
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
    const serverName = "openverse-mcp";
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
