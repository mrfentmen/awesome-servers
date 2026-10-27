import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { recent } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "jpl-fireball-mcp", version: "1.0.0" });
    server.registerTool("recent", {
        title: "Recent",
        description: "Recent fireball impacts.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recent(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("above_energy", {
        title: "Fireballs above an energy",
        description: "Fireball impacts with a kinetic energy at or above a threshold in kilotons, with impact energy, altitude and speed.",
        inputSchema: z.object({ minKt: z.number().describe("Minimum energy in kilotons.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement energy locally (paywall removed)
        try {
            return textError("Not yet implemented: energy");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("in_date_range", {
        title: "Fireballs in a date range",
        description: "Fireball impacts observed between two dates, with impact position, energy, altitude and speed.",
        inputSchema: z.object({ date_min: z.string().describe("Start date YYYY-MM-DD."), date_max: z.string().describe("End date YYYY-MM-DD."), limit: z.number().describe("Max results.").optional() }),
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
    const serverName = "jpl-fireball-mcp";
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
