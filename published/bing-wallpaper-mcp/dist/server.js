import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { recent, today, markets } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bing-wallpaper-mcp", version: "1.0.0" });
    server.registerTool("today", {
        title: "Today",
        description: "Today Bing wallpaper.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await today(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent", {
        title: "Recent",
        description: "Recent Bing wallpapers.",
        inputSchema: z.object({ count: z.number().describe("How many days back.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recent(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("archive", {
        title: "Archive",
        description: "Walk back through Bing's wallpaper archive by day offset, in any market, which the recent tool's few days cannot do. Reports the feed's real per-request cap.",
        inputSchema: z.object({ idx: z.number().describe("How many days back to start, 0 is today. Defaults to 0.").optional(), count: z.number().describe("How many days from there, 1-16. Defaults to 4.").optional(), market: z.string().describe("Market code like en-US, en-GB or de-DE. Defaults to en-US.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement archive locally (paywall removed)
        try {
            return textError("Not yet implemented: archive");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("markets", {
        title: "Markets",
        description: "The same day's wallpaper side by side across several markets, which shows that the market parameter really changes the picture rather than being ignored.",
        inputSchema: z.object({ markets: z.string().describe("Comma separated market codes, 2 to 6, like en-US,en-GB,de-DE. Defaults to en-US,en-GB,de-DE,ja-JP.").optional(), idx: z.number().describe("How many days back, 0 is today. Defaults to 0.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await markets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bing-wallpaper-mcp";
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
