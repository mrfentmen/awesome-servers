import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convert } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "hebcal-mcp", version: "1.0.0" });
    server.registerTool("convert", {
        title: "Convert",
        description: "Convert a Gregorian date.",
        inputSchema: z.object({ date: z.string().describe("YYYY-MM-DD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convert(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("month_holidays", {
        title: "Month of holidays",
        description: "Every Jewish holiday in one Gregorian month from Hebcal, with its Hebrew date, category and Torah reading.",
        inputSchema: z.object({ year: z.number().describe("Gregorian year.").optional(), month: z.number().describe("Gregorian month 1-12.").optional(), limit: z.number().describe("Max items.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement holidays locally (paywall removed)
        try {
            return textError("Not yet implemented: holidays");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("week_liturgy", {
        title: "Week ahead",
        description: "Hebcal's coming week: candle lighting, the weekly Torah portion with its leyning, and havdalah.",
        inputSchema: z.object({ limit: z.number().describe("Max items.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement liturgy locally (paywall removed)
        try {
            return textError("Not yet implemented: liturgy");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "hebcal-mcp";
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
