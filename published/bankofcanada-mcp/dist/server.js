import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { list, rate } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bankofcanada-mcp", version: "1.0.0" });
    server.registerTool("rate", {
        title: "Rate",
        description: "Latest rate for a series.",
        inputSchema: z.object({ series: z.string().describe("Series id like FXUSDCAD.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list", {
        title: "List",
        description: "Available series.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await list(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rate_range", {
        title: "Rate range",
        description: "A Bank of Canada series over a date window rather than just the latest value, with the low and high across the window.",
        inputSchema: z.object({ series: z.string().describe("Series code, e.g. FXUSDCAD."), start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD."), limit: z.number().describe("Max observations.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement range locally (paywall removed)
        try {
            return textError("Not yet implemented: range");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bankofcanada-mcp";
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
