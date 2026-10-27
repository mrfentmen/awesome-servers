import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { profile, subscriptions, streamContents, discoverFeeds, unreadCounts, boardCatalogue } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "feedly-mcp",
        version: "1.0.0",
    });
    server.registerTool("profile", {
        title: "Profile",
        description: "The Feedly account the token belongs to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await profile());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("subscriptions", {
        title: "Subscriptions",
        description: "Feeds the account follows, with titles.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await subscriptions());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stream_contents", {
        title: "Stream contents",
        description: "Recent entries in a stream, newest first.",
        inputSchema: z.object({
            stream_id: z.string().describe("Stream ID, e.g. feed/https://example.com/feed"),
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ stream_id, count }) => {
        try {
            return text(await streamContents(stream_id, count));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("discover_feeds", {
        title: "Search for feeds to subscribe to",
        description: "Searches Feedly's feed index for publications matching a query, with subscriber count, Feedly's own velocity score for update rate, language, topics and last-updated date. Feedly serves this without a token, so it is the only tool in the server that works with no credentials configured at all. States that the index is built from what users subscribe to, so a new site with no subscribers does not appear however real it is.",
        inputSchema: z.object({
            query: z.string().describe("Topic or publication name to search for, e.g. 'space news'."),
            size: z.number().int().min(1).max(50).default(10).describe("Results to return, default 10"),
            offset: z.number().int().min(0).default(0).describe("Offset for paging, default 0"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await discoverFeeds(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("unread_counts", {
        title: "Unread counts by feed, board and tag",
        description: "Returns the unread count for every feed, board and tag, ranked, with a share of the backlog per feed and how much of it the busiest few hold. This is the call a reader makes constantly and nothing in the server had it: profile says who you are and subscriptions says what you read, neither says how much of it is unread. Makes clear that board and tag counts are views over the same feeds, so the group totals must not be added together.",
        inputSchema: z.object({
            top: z.number().int().min(1).max(200).default(20).describe("Entries per group, default 20"),
            group_by: z.enum(["all", "feeds", "boards", "tags"]).default("all").describe("Which counts to show, default all"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await unreadCounts(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("board_catalogue", {
        title: "Boards and the feeds in them",
        description: "Lists the account's boards with the feeds filed in each, and reports the board that holds the largest share of the subscriptions. The existing subscriptions tool returns a flat list of feeds, so the folder structure a reader navigates by is invisible and two feeds filed together look unrelated. Says so when Feedly returns a feed count without expanding the list, which is the shape of a response on a plan that does not do it.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(200).default(20).describe("Boards to list, default 20"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await boardCatalogue(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "feedly-mcp";
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
