import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchVideos, instance } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'peertube-mcp', version: '1.0.0' });
    server.registerTool('searchVideos', {
        title: "Search Videos",
        description: 'Search PeerTube.tv videos.',
        inputSchema: z.object({ query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchVideos(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('instance', {
        title: "Instance",
        description: 'PeerTube.tv instance info.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await instance(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("top_videos", {
        title: "Top videos",
        description: "Browse videos across the whole PeerTube federation on peertube.tv, sorted by trending, views, likes, recency or duration.",
        inputSchema: z.object({ sort: z.string().describe("trending, views, likes, published or duration.").optional(), limit: z.number().int().min(1).max(25).default(8).describe("Max videos.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement videos locally (paywall removed)
        try {
            return textError("Not yet implemented: videos");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("video_detail", {
        title: "Video detail",
        description: "Full detail for one PeerTube video by UUID: channel, views, likes, tags, licence, language and available qualities.",
        inputSchema: z.object({ uuid: z.string().describe("Video UUID from searchVideos or topVideos.") }),
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
    const serverName = "peertube-mcp";
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
