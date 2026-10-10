import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, webSearch, newsSearch, imageSearch, videoSearch, suggestQueries, spellcheck, listGoggles, faqSearch, discussionSearch, localizedSearch, freshnessSweep, goggleSearch, pagedDive } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "brave-mcp",
        version: "1.0.0",
    });
    server.registerTool("web_search", {
        title: "Web search",
        description: "Web results with titles, URLs and snippets.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, count }) => {
        try {
            return text(await webSearch(query, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("news_search", {
        title: "News search",
        description: "Recent news articles matching a query.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, count }) => {
        try {
            return text(await newsSearch(query, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("image_search", {
        title: "Image search",
        description: "Image results.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, count }) => {
        try {
            return text(await imageSearch(query, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("video_search", {
        title: "Video search",
        description: "Video results.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, count }) => {
        try {
            return text(await videoSearch(query, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("suggest_queries", {
        title: "Suggest",
        description: "Query suggestions.",
        inputSchema: z.object({
            query: z.string().describe("Partial query.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await suggestQueries(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("spellcheck", {
        title: "Spellcheck",
        description: "Spelling fixes.",
        inputSchema: z.object({
            query: z.string().describe("Text to check.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await spellcheck(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_goggles", {
        title: "List goggles",
        description: "Custom search goggles.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listGoggles());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("faq_search", {
        title: "FAQ search",
        description: "FAQ-style answers.",
        inputSchema: z.object({
            query: z.string().describe("Question."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, count }) => {
        try {
            return text(await faqSearch(query, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("discussion_search", {
        title: "Discussions",
        description: "Forum threads.",
        inputSchema: z.object({
            query: z.string().describe("Topic."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, count }) => {
        try {
            return text(await discussionSearch(query, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("localized_search", {
        title: "Local search",
        description: "Country-scoped results.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            country: z.string().describe("Country code, e.g. DE."),
            count: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, country, count }) => {
        try {
            return text(await localizedSearch(query, country, count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("freshness_sweep", {
        title: "Freshness sweep",
        description: "Web and news results for one query inside a recency window (day, week, month or year), with extra snippets and Brave's reported ages.",
        inputSchema: z.object({
            query: z.string().describe("Search query"),
            window: z.string().describe("day, week, month or year. Defaults to week.").optional(),
            count: z.string().describe("Results per vertical (default 8, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: freshness_sweep ----
        const paywallMessage = await premiumRequired("freshness_sweep");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await freshnessSweep(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("goggle_search", {
        title: "Goggle search",
        description: "Re-run a query through Brave Goggles: pass a hosted .goggle URL or an inline $boost / $downrank / $discard spec to re-rank the index for your own sources.",
        inputSchema: z.object({
            query: z.string().describe("Search query"),
            goggles: z.string().describe("Hosted Goggle URL or inline spec, e.g. $boost,site=dev.to. Up to 3 lines."),
            count: z.string().describe("Max results (default 10, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: goggle_search ----
        const paywallMessage = await premiumRequired("goggle_search");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await goggleSearch(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("paged_dive", {
        title: "Paged deep dive",
        description: "Walk a query through several pages of Brave web results via offset, dedupe what comes back and stop when Brave says no further pages exist.",
        inputSchema: z.object({
            query: z.string().describe("Search query"),
            pages: z.string().describe("Pages to walk, 1-10. Defaults to 2.").optional(),
            count: z.string().describe("Results per page (default 10, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pagedDive(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
