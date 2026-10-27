import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { communities, searchCommunities } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "lemmy-mcp", version: "1.0.0" });
    server.registerTool("communities", {
        title: "Communities",
        description: "Public communities on an instance.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await communities(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_posts", {
        title: "Recent posts",
        description: "The most active posts on lemmy.world across every community, with score, comment count, author and permalink.",
        inputSchema: z.object({ limit: z.number().describe("Max posts.").optional(), sort: z.string().describe("Active, Hot, New, TopAll, TopDay, TopWeek, TopMonth, TopYear, MostComments or NewComments.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement posts locally (paywall removed)
        try {
            return textError("Not yet implemented: posts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("instance_info", {
        title: "Instance info",
        description: "What the lemmy.world instance is: name, software version, publish date, user and content counts, and its sidebar rules.",
        inputSchema: z.object({}),
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
    server.registerTool("search_communities", {
        title: "Search communities",
        description: "Search for communities by keyword across the federation indexed by lemmy.world.",
        inputSchema: z.object({ query: z.string().min(1).max(200), limit: z.number().int().min(1).max(20).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchCommunities(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("community_details", {
        title: "Community details",
        description: "Community description, moderators, subscriber and activity counts.",
        inputSchema: z.object({ name: z.string().min(1).max(200).describe("Community name, e.g. science.") }),
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
    server.registerTool("recent_comments", {
        title: "Recent comments",
        description: "Recent discussion comments in local communities with author, score and permalink.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(20).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement comments locally (paywall removed)
        try {
            return textError("Not yet implemented: comments");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lemmy-mcp";
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
