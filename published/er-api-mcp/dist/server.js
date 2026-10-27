import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_convert, m0_latest, m1_history } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'er-api-mcp', version: '1.0.0' });
    server.registerTool("latest", {
        title: "Latest",
        description: "Get latest exchange rates.",
        inputSchema: z.object({ base: z.string().describe("Base currency code (USD or EUR).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_latest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("convert", {
        title: "Convert",
        description: "Convert an amount between currencies.",
        inputSchema: z.object({ from: z.string().describe("Source currency."), to: z.string().describe("Target currency."), amount: z.number().describe("Amount.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_convert(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("history", {
        title: "History",
        description: "Rates for a date range.",
        inputSchema: z.object({ base: z.string().describe("Base currency.").optional(), symbols: z.string().describe("Comma separated targets.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_history(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("currency_list", {
        title: "Currency list",
        description: "Every currency the free ExchangeRate API covers with its name and current rate against USD, or filtered by code or name.",
        inputSchema: z.object({ search: z.string().describe("Filter by code or name, e.g. yen or JPY.").optional(), limit: z.number().describe("Max currencies.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "er-api-mcp";
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
