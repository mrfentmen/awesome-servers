import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cotHistory, latestCotReport, searchMarkets, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "cftc-mcp", version: "1.0.0" });
    server.tool("latest_cot_report", "Latest Commitments of Traders report for a market.", {
        market: z.string().min(2).describe('Market name or part, e.g. "GOLD" or "S&P 500"')
    }, async (a) => {
        try {
            return text(await latestCotReport(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("cot_history", "Recent weekly COT rows for a market.", {
        market: z.string().min(2).describe("Market name or part"),
        limit: z.number().int().min(1).max(50).default(10).describe("Weeks to return")
    }, async (a) => {
        try {
            return text(await cotHistory(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("search_markets", "Find futures markets whose name matches a keyword.", {
        query: z.string().min(2).describe("Keyword such as crude or wheat"),
        limit: z.number().int().min(1).max(50).default(10).describe("Markets to return")
    }, async (a) => {
        try {
            return text(await searchMarkets(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
