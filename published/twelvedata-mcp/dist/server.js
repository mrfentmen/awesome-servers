import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { quote, fxBoard, fxHistory } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "twelvedata-mcp", version: "1.0.0" });
    server.registerTool("quote", {
        title: "Quote",
        description: "Latest quote for a symbol, e.g. AAPL: price and change.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like AAPL.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await quote(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fx_board", {
        title: "FX board",
        description: "The European Central Bank's daily reference rate board against one base currency: every published rate, each currency's move since the prior fixing, the strongest and weakest, the size of the move, and how many currencies the service covers. No API key needed.",
        inputSchema: z.object({
            base: z.string().describe("Base currency code, e.g. EUR or USD. Defaults to EUR.").optional(),
            limit: z.number().describe("Max currencies listed, 1-30. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fxBoard(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fx_history", {
        title: "FX history",
        description: "What one currency pair did over a stretch of published ECB fixings: opening and closing rate, net change, the high and low dates, the mean, and every day-to-day step. No API key needed.",
        inputSchema: z.object({
            base: z.string().describe("Base currency code, e.g. EUR."),
            quote: z.string().describe("Quote currency code, e.g. USD."),
            days: z.number().describe("Window in days, 2-400. Defaults to 30.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fxHistory(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "twelvedata-mcp";
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
