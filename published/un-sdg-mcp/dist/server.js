import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { indicators } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "un-sdg-mcp", version: "1.0.0" });
    server.registerTool("indicators", {
        title: "Indicators",
        description: "List SDG indicators.",
        inputSchema: z.object({ goal: z.string().describe("Goal number like 3.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await indicators(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("goals", {
        title: "Goals",
        description: "The 17 UN Sustainable Development Goals with their official title and description.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(17).default(17).describe("Max goals.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement goals locally (paywall removed)
        try {
            return textError("Not yet implemented: goals");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("series", {
        title: "Series",
        description: "Global SDG indicator series for a goal or an indicator, with the targets each series reports and its data release.",
        inputSchema: z.object({ goal: z.string().max(4).describe("Goal number like 3.").optional(), indicator: z.string().max(12).describe("Indicator code like 1.1.1.").optional(), limit: z.number().int().min(1).max(60).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement series locally (paywall removed)
        try {
            return textError("Not yet implemented: series");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "un-sdg-mcp";
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
