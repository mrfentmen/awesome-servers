import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { date, latest } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "nasa-epic-mcp", version: "1.0.0" });
    server.registerTool("latest", {
        title: "Latest",
        description: "Latest Earth images from EPIC.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await latest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("date", {
        title: "Date",
        description: "Earth images for a date.",
        inputSchema: z.object({ date: z.string().describe("Date like 2026-08-01.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await date(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("enhanced_latest", {
        title: "Latest enhanced images",
        description: "Latest Earth images from EPIC's enhanced product - the reprocessed imagery used for ozone and aerosol retrieval, with the image centroid.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement latest locally (paywall removed)
        try {
            return textError("Not yet implemented: latest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("enhanced_date", {
        title: "Enhanced images for a date",
        description: "EPIC enhanced-product Earth images for one date, with the image centroid and archive link.",
        inputSchema: z.object({ date: z.string().describe("Date like 2026-09-23.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement date locally (paywall removed)
        try {
            return textError("Not yet implemented: date");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nasa-epic-mcp";
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
