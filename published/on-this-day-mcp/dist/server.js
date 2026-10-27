import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { births, deaths, events } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "on-this-day-mcp", version: "1.0.0" });
    server.registerTool("events", {
        title: "Events",
        description: "Historic events on a date.",
        inputSchema: z.object({ month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await events(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("births", {
        title: "Births",
        description: "Famous births on a date.",
        inputSchema: z.object({ month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await births(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("deaths", {
        title: "Deaths",
        description: "Famous deaths on a date.",
        inputSchema: z.object({ month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await deaths(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("holidays", {
        title: "Holidays",
        description: "Holidays and observances on a date, from the Wikipedia On This Day feed.",
        inputSchema: z.object({ month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
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
    server.registerTool("selected", {
        title: "Selected",
        description: "Wikipedia's editor-selected notable entries for a date, from the On This Day feed.",
        inputSchema: z.object({ month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement selected locally (paywall removed)
        try {
            return textError("Not yet implemented: selected");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "on-this-day-mcp";
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
