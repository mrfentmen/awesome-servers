import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { companyNews, earningsCalendar, FinnhubError, stockQuote } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "finnhub-mcp",
        version: "1.0.0",
    });
    server.registerTool("stock_quote", {
        title: "Stock quote",
        description: "Quote with previous close, change, day range.",
        inputSchema: z.object({
            symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol }) => {
        try {
            return text(await stockQuote(symbol));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("company_news", {
        title: "Company news",
        description: "Recent headlines for a ticker with sources and links.",
        inputSchema: z.object({
            symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
            days: z.number().int().min(1).max(365).default(7),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol, days }) => {
        try {
            const rows = await companyNews(symbol, days);
            if (rows.length === 0)
                return text(`No news for ${symbol}.`);
            return text(rows.join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("earnings_calendar", {
        title: "Earnings calendar",
        description: "Upcoming earnings with dates and EPS estimates.",
        inputSchema: z.object({
            days: z.number().int().min(1).max(365).default(14),
        }),
        annotations: READ_ONLY,
    }, async ({ days }) => {
        try {
            const rows = await earningsCalendar(days);
            if (rows.length === 0)
                return text("No upcoming earnings.");
            return text(rows.join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "finnhub-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof FinnhubError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
