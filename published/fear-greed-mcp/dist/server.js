import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { current, history, bandDistribution } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fear-greed-mcp", version: "1.0.0" });
    server.registerTool("current", {
        title: "Current",
        description: "The current fear and greed index.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await current(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("history", {
        title: "History",
        description: "Recent fear and greed index values.",
        inputSchema: z.object({ days: z.number().describe("How many days back.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await history(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("market_extremes", {
        title: "Market extremes",
        description: "The highest and lowest fear and greed readings on record, with their dates, plus the mean and full band counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement extremes locally (paywall removed)
        try {
            return textError("Not yet implemented: extremes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("greed_trend", {
        title: "Greed trend",
        description: "Fear and greed moving averages over 7, 30, 90 and 365 days, each compared with the period before it.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement trend locally (paywall removed)
        try {
            return textError("Not yet implemented: trend");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("band_distribution", {
        title: "Band distribution",
        description: "How many days of a recent window fell into each fear and greed band.",
        inputSchema: z.object({ days: z.number().describe("Window size in days, 1-365.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bandDistribution(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fear-greed-mcp";
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
