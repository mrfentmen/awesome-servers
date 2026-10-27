import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SpaceflightError, articleDetail, latestBlogs, latestNews, latestReports, newsBySite, newsSources, searchNews, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SpaceflightError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "spaceflight-news-api-mcp", version: "1.0.0" });
    const limitArg = z.number().int().min(1).max(50).default(10).describe("Items to return (1-50)");
    server.tool("latest_news", "Newest spaceflight articles across every tracked outlet.", { limit: limitArg }, async ({ limit }) => {
        try {
            return text(await latestNews(limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("search_news", "Full-text search over 36k+ spaceflight articles.", {
        term: z.string().min(2).describe("Search term, e.g. 'Starship' or 'Europa Clipper'"),
        limit: limitArg,
    }, async ({ term, limit }) => {
        try {
            return text(await searchNews(term, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("news_by_site", "Articles from one outlet, e.g. 'NASASpaceflight', 'SpaceNews', 'Arstechnica'.", {
        site: z.string().min(2).describe("Exact news site name (see news_sources)"),
        limit: limitArg,
    }, async ({ site, limit }) => {
        try {
            return text(await newsBySite(site, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("article_detail", "One article with its full summary and image.", { id: z.number().int().positive().describe("Article id from any list tool") }, async ({ id }) => {
        try {
            return text(await articleDetail(id));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("latest_reports", "Space agency reports and mission updates.", { limit: limitArg }, async ({ limit }) => {
        try {
            return text(await latestReports(limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("latest_blogs", "Newest blog posts from the tracked outlets.", { limit: limitArg }, async ({ limit }) => {
        try {
            return text(await latestBlogs(limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("news_sources", "Every outlet the API tracks, plus the API version.", {}, async () => {
        try {
            return text(await newsSources());
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
