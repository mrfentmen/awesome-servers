import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { browse, genreIndex } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "tunein-mcp", version: "1.0.0" });
    server.registerTool("browse", {
        title: "Browse",
        description: "Browse radio categories.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await browse(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("genre_index", {
        title: "Genre index",
        description: "The TuneIn browse taxonomy across the local, music, talk and sports categories: every subcategory link with its guide id and browse URL, plus the stations each category lists directly with their bitrate.",
        inputSchema: z.object({ limit: z.number().describe("Entries to list per category, 1-40.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await genreIndex(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("station_search", {
        title: "Station search",
        description: "Search TuneIn stations by name, description or now playing text, across a category (local, music, talk, sports) or a subcategory guide id such as g22, and report bitrate, reliability, format and genre for each hit.",
        inputSchema: z.object({ query: z.string().describe("Text to look for in station names, descriptions or now playing."), section: z.string().describe("Category name or subcategory guide id. Default local.").optional(), limit: z.number().describe("Max matches, 1-40.").optional() }),
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
    server.registerTool("stream_survey", {
        title: "Stream survey",
        description: "What a TuneIn directory listing is made of: the bitrate ladder and mean, the reliability spread and how much of the listing is at 90 or above, the format mix, the genre spread and how many stations carry a now playing string or a description.",
        inputSchema: z.object({ section: z.string().describe("Category name or subcategory guide id. Default local.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement survey locally (paywall removed)
        try {
            return textError("Not yet implemented: survey");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "tunein-mcp";
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
