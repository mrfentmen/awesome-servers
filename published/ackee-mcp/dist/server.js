import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listDomains, getDomain, getTopBrowsers, appStoreSearch, appStoreReviews } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "ackee-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_domains", {
        title: "List domains",
        description: "All Ackee domains with ids and titles.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listDomains());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_domain", {
        title: "Get domain facts",
        description: "Ackee domain facts: active visitors plus yearly unique views.",
        inputSchema: z.object({
            domainId: z.string().describe("Domain id"),
        }),
        annotations: READ_ONLY,
    }, async ({ domainId }) => {
        try {
            return text(await getDomain(domainId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_top_browsers", {
        title: "Get top browsers",
        description: "Top browsers on an Ackee domain over the last 6 months.",
        inputSchema: z.object({
            domainId: z.string().describe("Domain id"),
        }),
        annotations: READ_ONLY,
    }, async ({ domainId }) => {
        try {
            return text(await getTopBrowsers(domainId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("app_store_search", {
        title: "Search iOS apps",
        description: "Search the public iTunes App Store by keyword: name, developer, genre, price, average rating, rating count and latest version date.",
        inputSchema: z.object({
            query: z.string().describe("App name or keyword, e.g. 'weather', 'pomodoro'"),
            country: z.string().default("us").describe("Two-letter store country, e.g. us, gb, jp"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await appStoreSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("app_store_reviews", {
        title: "Read App Store reviews",
        description: "Most recent customer reviews for one iOS app from the public App Store review feed: star rating, app version, date, author and review text.",
        inputSchema: z.object({
            appId: z.string().describe("Numeric App Store app id from app_store_search, e.g. 553834731"),
            page: z.number().int().min(1).max(10).default(1).describe("Review feed page, 1-10"),
            limit: z.number().int().min(1).max(20).default(10),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await appStoreReviews(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ackee-mcp";
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
