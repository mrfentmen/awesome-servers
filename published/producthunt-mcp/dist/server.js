import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { viewer, listPosts, showHnLaunches, githubFootprint, competitiveScan } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "producthunt-mcp",
        version: "1.0.0",
    });
    server.registerTool("viewer", {
        title: "Viewer",
        description: "The Product Hunt user the token belongs to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await viewer());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_posts", {
        title: "Top posts",
        description: "Launches ranked by votes, with tagline and maker.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listPosts(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("show_hn_launches", {
        title: "Show HN launches",
        description: "What the Hacker News Show HN feed has launched in a window and how each launch scored: points, comments, author, the external link and the thread.",
        inputSchema: z.object({
            days: z.number().describe("Window in days, 1-3650. Defaults to 30.").optional(),
            min_points: z.number().describe("Only launches with at least this many points.").optional(),
            limit: z.number().describe("Max launches, 1-30. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await showHnLaunches(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("github_footprint", {
        title: "GitHub footprint",
        description: "The public GitHub footprint of a project: stars, forks, contributors, open issues, language, licence, last push, releases and topics.",
        inputSchema: z.object({
            repo: z.string().describe("owner/repository, or a full github.com URL, e.g. 'vercel/next.js'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await githubFootprint(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("competitive_scan", {
        title: "Competitive scan",
        description: "The open-source projects a topic has already produced, ranked by stars, with their language, licence and last push, so a crowded market can be seen before launching into it.",
        inputSchema: z.object({
            query: z.string().describe("Topic or idea, e.g. 'local first sync'"),
            limit: z.number().describe("Max repositories, 1-25. Defaults to 10.").optional(),
            language: z.string().describe("Restrict to one language, e.g. 'TypeScript'.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await competitiveScan(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "producthunt-mcp";
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
    return server;
}
