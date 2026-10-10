import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listTickers, getTicker, prevClose, aggregates, groupedDaily, openClose, rsi, macd, dividends, splits, news, gainers, secFilings, secRevenue } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "polygon-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_tickers", {
        title: "List tickers",
        description: "Reference tickers, with name and market.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listTickers(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_ticker", {
        title: "Get ticker",
        description: "One ticker's reference details by symbol.",
        inputSchema: z.object({
            ticker: z.string().describe("Ticker symbol, e.g. AAPL")
        }),
        annotations: READ_ONLY,
    }, async ({ ticker }) => {
        try {
            return text(await getTicker(ticker));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("prev_close", {
        title: "Previous close",
        description: "Previous day's bar: open, high, low, close, volume.",
        inputSchema: z.object({
            ticker: z.string().describe("Ticker symbol, e.g. AAPL")
        }),
        annotations: READ_ONLY,
    }, async ({ ticker }) => {
        try {
            return text(await prevClose(ticker));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("aggregates", {
        title: "Daily bars",
        description: "Custom date range.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL."),
            from: z.string().describe("YYYY-MM-DD."),
            to: z.string().describe("YYYY-MM-DD.")
        }),
        annotations: READ_ONLY,
    }, async ({ ticker, from, to }) => {
        try {
            return text(await aggregates(ticker, from, to));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("grouped_daily", {
        title: "Market day",
        description: "Whole-market daily bars.",
        inputSchema: z.object({
            date: z.string().describe("YYYY-MM-DD.")
        }),
        annotations: READ_ONLY,
    }, async ({ date }) => {
        try {
            return text(await groupedDaily(date));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("open_close", {
        title: "Open/close",
        description: "OHLC for a day.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL."),
            date: z.string().describe("YYYY-MM-DD.")
        }),
        annotations: READ_ONLY,
    }, async ({ ticker, date }) => {
        try {
            return text(await openClose(ticker, date));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("rsi", {
        title: "RSI",
        description: "Relative strength.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL.")
        }),
        annotations: READ_ONLY,
    }, async ({ ticker }) => {
        try {
            return text(await rsi(ticker));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("macd", {
        title: "MACD",
        description: "Trend momentum.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL.")
        }),
        annotations: READ_ONLY,
    }, async ({ ticker }) => {
        try {
            return text(await macd(ticker));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("dividends", {
        title: "Dividends",
        description: "Dividend history.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ ticker }) => {
        try {
            return text(await dividends(ticker));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("splits", {
        title: "Splits",
        description: "Split history.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ ticker }) => {
        try {
            return text(await splits(ticker));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("news", {
        title: "Ticker news",
        description: "Latest news.",
        inputSchema: z.object({
            ticker: z.string().describe("e.g. AAPL."),
            limit: z.string().describe("Max results (default 5, max 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ ticker, limit }) => {
        try {
            return text(await news(ticker, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("gainers", {
        title: "Top gainers",
        description: "Day's biggest gainers.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await gainers());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sec_filings", {
        title: "SEC filings",
        description: "A company's SEC filing record: recent filings with their form type, date and document link, plus its SIC classification, state of incorporation and fiscal year end.",
        inputSchema: z.object({
            ticker: z.string().describe("US ticker, e.g. 'AAPL'"),
            limit: z.number().describe("Max filings, 1-40. Defaults to 15.").optional(),
            forms: z.string().describe("Comma-separated form types to keep, e.g. '10-K,10-Q,8-K'").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: sec_filings ----
        const paywallMessage = await premiumRequired("sec_filings");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await secFilings(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sec_revenue", {
        title: "Reported annual revenue",
        description: "A company's annual revenue as tagged in its own 10-K filings, read from the SEC XBRL facts, with the year-on-year change.",
        inputSchema: z.object({
            ticker: z.string().describe("US ticker, e.g. 'MSFT'"),
            years: z.number().describe("How many fiscal years, 2-20. Defaults to 6.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: sec_revenue ----
        const paywallMessage = await premiumRequired("sec_revenue");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await secRevenue(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
