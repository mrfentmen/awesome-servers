import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, channelIndex } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "dailymotion-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Dailymotion videos.",
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
    server.registerTool("video_details", {
        title: "Video details",
        description: "The full record for one or more Dailymotion video ids: owner, likes, comments, tags, language, embed url and the flags search does not return.",
        inputSchema: z.object({ ids: z.string().describe("One or more video ids, separated by commas or spaces. A full video url also works.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("browse_channel", {
        title: "Browse channel",
        description: "List videos in one of Dailymotion's fixed channels, with the sort orders the API accepts, and page through them.",
        inputSchema: z.object({ channel: z.string().describe("Channel id like music or news. Call channel_index for the list."), sort: z.string().describe("Sort order, one of recent, visited, visited-week, relevance, random, trending, old and a few others. Defaults to trending.").optional(), limit: z.number().describe("How many videos to list, 1-50. Defaults to 15.").optional(), page: z.number().describe("Page number, starting at 1. Defaults to 1.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement channel locally (paywall removed)
        try {
            return textError("Not yet implemented: channel");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("channel_index", {
        title: "Channel index",
        description: "Every Dailymotion channel id, its display name and its description.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await channelIndex(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dailymotion-mcp";
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
