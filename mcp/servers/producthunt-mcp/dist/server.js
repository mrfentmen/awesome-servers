import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, viewer, listPosts } from "./api.js";
import { premiumTool } from "./gateway.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
        // ---- paywall: show_hn_launches ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_producthunt_show_hn_launches", args));
        }
        catch (e) {
            return textError(errorMessage(e));
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
        // ---- paywall: github_footprint ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_producthunt_github_footprint", args));
        }
        catch (e) {
            return textError(errorMessage(e));
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
        // ---- paywall: competitive_scan ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_producthunt_competitive_scan", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
