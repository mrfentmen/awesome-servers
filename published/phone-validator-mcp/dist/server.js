import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validate, zoneTime, countryContext } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "phone-validator-mcp", version: "1.0.0" });
    server.registerTool("validate", {
        title: "Validate",
        description: "Check a phone number and show its parts.",
        inputSchema: z.object({ number: z.string().describe("Phone number in any format."), country: z.string().describe("Two letter country code for context.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await validate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("zone_time", {
        title: "Zone time",
        description: "Current local date, time, weekday and daylight saving flag for an IANA time zone, from the TimeAPI.io public API.",
        inputSchema: z.object({ timezone: z.string().max(60).describe("IANA time zone like Europe/London.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await zoneTime(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_context", {
        title: "Country context",
        description: "The country a phone number belongs to, then what that country is like: World Bank region, income level, capital and latest population.",
        inputSchema: z.object({ number: z.string().max(40).describe("Phone number in any format.").optional(), country: z.string().max(2).describe("Two letter country code as a hint.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await countryContext(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "phone-validator-mcp";
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
