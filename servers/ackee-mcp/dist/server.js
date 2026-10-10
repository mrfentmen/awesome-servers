import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listDomains, getDomain, getTopBrowsers, appStoreSearch, appStoreReviews } from "./api.js";
import { premiumRequired } from "./license.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
    }, async ({ query, country, limit }) => {
        // ---- paywall: app_store_search ----
        const paywallMessage = await premiumRequired("app_store_search");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await appStoreSearch({ query, country, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
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
    }, async ({ appId, page, limit }) => {
        // ---- paywall: app_store_reviews ----
        const paywallMessage = await premiumRequired("app_store_reviews");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await appStoreReviews({ appId, page, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
