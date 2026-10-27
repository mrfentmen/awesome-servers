import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pricefeed, ticker } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "gemini-mcp", version: "1.0.0" });
    server.registerTool("ticker", {
        title: "Ticker",
        description: "Ticker for a symbol.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like btcusd.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ticker(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pricefeed", {
        title: "Pricefeed",
        description: "List current prices.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pricefeed(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_symbols", {
        title: "List symbols",
        description: "Every symbol Gemini lists for spot trading, optionally filtered, so you can find the right pair before quoting a price.",
        inputSchema: z.object({ search: z.string().describe("Filter the symbol list, e.g. btc.").optional(), limit: z.number().describe("Max symbols.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement symbols locally (paywall removed)
        try {
            return textError("Not yet implemented: symbols");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("symbol_details", {
        title: "Symbol details",
        description: "A Gemini symbol's trading rules: status, tick size, quote increment, minimum order size and underlying asset.",
        inputSchema: z.object({ symbol: z.string().describe("Symbol like BTCUSD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gemini-mcp";
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
    return server;
}
