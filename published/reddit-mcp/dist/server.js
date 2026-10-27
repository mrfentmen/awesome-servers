import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatComment, formatPost, RedditError, searchComments, searchPosts, subredditPosts, userPosts } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "reddit-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_posts", {
        title: "Search Reddit posts",
        description: "Search Reddit posts by subreddit and keywords (via the Arctic Shift archive).",
        inputSchema: z.object({
            subreddit: z.string().default("").describe("Subreddit without r/, e.g. 'python'. Empty = all"),
            query: z.string().default("").describe("Keywords, e.g. 'async tutorial'"),
            sort: z.enum(["newest", "oldest"]).default("newest"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ subreddit, query, sort, limit }) => {
        try {
            if (!subreddit.trim() && !query.trim())
                return textError("Error: give a subreddit, a query, or both.");
            const results = await searchPosts(subreddit, query, sort, limit);
            if (results.length === 0)
                return text("No Reddit posts found.");
            return text(results.map((p, i) => formatPost(p, i)).join("\n\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_comments", {
        title: "Search Reddit comments",
        description: "Search Reddit comments by subreddit and keywords (via the Arctic Shift archive).",
        inputSchema: z.object({
            subreddit: z.string().default("").describe("Subreddit without r/, e.g. 'python'. Empty = all"),
            query: z.string().default("").describe("Keywords"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ subreddit, query, limit }) => {
        try {
            if (!subreddit.trim() && !query.trim())
                return textError("Error: give a subreddit, a query, or both.");
            const results = await searchComments(subreddit, query, limit);
            if (results.length === 0)
                return text("No Reddit comments found.");
            return text(results.map((c, i) => formatComment(c, i)).join("\n\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("user_posts", {
        title: "User posts",
        description: "Posts by one Reddit user (via the Arctic Shift archive).",
        inputSchema: z.object({
            author: z.string().describe("Username without u/, e.g. 'spez'"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ author, limit }) => {
        try {
            const results = await userPosts(author, limit);
            if (results.length === 0)
                return text(`No posts by u/${author}.`);
            return text(results.map((p, i) => formatPost(p, i)).join("\n\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("subreddit_posts", {
        title: "Subreddit posts",
        description: "Latest posts in one subreddit (via the Arctic Shift archive).",
        inputSchema: z.object({
            subreddit: z.string().describe("Subreddit without r/, e.g. 'python'"),
            sort: z.enum(["newest", "oldest"]).default("newest"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ subreddit, sort, limit }) => {
        try {
            const results = await subredditPosts(subreddit, sort, limit);
            if (results.length === 0)
                return text(`No posts in r/${subreddit}.`);
            return text(results.map((p, i) => formatPost(p, i)).join("\n\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof RedditError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
