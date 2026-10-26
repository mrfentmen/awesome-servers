import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cryptoMeta, stockMeta, stockPrices, TiingoError, riskMetrics, drawdownProfile, returnCorrelation } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "tiingo-mcp",
        version: "1.0.0",
    });
    server.registerTool("stock_meta", {
        title: "Stock metadata",
        description: "Stock name, exchange, data range.",
        inputSchema: z.object({
            symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol }) => {
        try {
            return text(await stockMeta(symbol));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stock_prices", {
        title: "Recent prices",
        description: "Recent daily OHLCV prices, newest first.",
        inputSchema: z.object({
            symbol: z.string().describe("Ticker, e.g. 'AAPL'"),
            days: z.number().int().min(1).max(30).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol, days }) => {
        try {
            return text(await stockPrices(symbol, days));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("crypto_meta", {
        title: "Crypto metadata",
        description: "Name and base currency behind a crypto ticker, e.g. btcusd.",
        inputSchema: z.object({
            symbol: z.string().describe("Crypto ticker, e.g. 'btcusd'"),
        }),
        annotations: READ_ONLY,
    }, async ({ symbol }) => {
        try {
            return text(await cryptoMeta(symbol));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("risk_metrics", {
        title: "Risk metrics",
        description: "Risk numbers for a ticker from real daily closes: period return and CAGR, annualised volatility over the full sample and the last 20 and 60 bars, best and worst single day, maximum drawdown with its dates and length, where the last close sits in the 52 week range, and the 50 and 200 day moving averages with the last close relative to each.",
        inputSchema: z.object({
            symbol: z.string().describe("Ticker, e.g. AAPL, BTC-USD or ^GSPC."),
            range: z.string().describe("Yahoo-style range: 1mo, 6mo, 1y, 2y, 5y.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await riskMetrics(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("drawdown_profile", {
        title: "Drawdown profile",
        description: "Every peak-to-trough episode for a ticker, not just the worst one: how many there were, mean depth and mean length, the worst with its start, bottom and recovery date, whether anything is unrecovered right now and for how long, and the deepest few with the days spent below the prior peak.",
        inputSchema: z.object({
            symbol: z.string().describe("Ticker, e.g. SPY, AAPL or ^GSPC."),
            range: z.string().describe("Yahoo-style range. Default 2y.").optional(),
            top: z.number().describe("How many of the deepest episodes to show, 1-6.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await drawdownProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("return_correlation", {
        title: "Return correlation",
        description: "How several tickers actually moved together, over real daily returns: a full pairwise correlation matrix, each symbol's return and annualised volatility, and its beta against a chosen baseline, with every series trimmed to the shortest so the table compares the same days.",
        inputSchema: z.object({
            symbols: z.string().describe("Two to five tickers, comma separated, e.g. 'SPY,QQQ,TLT,GLD'."),
            range: z.string().describe("Yahoo-style range. Default 1y.").optional(),
            baseline: z.string().describe("Ticker to compute beta against. Defaults to the first.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await returnCorrelation(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "tiingo-mcp";
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
function errorMessage(e) {
    if (e instanceof TiingoError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
