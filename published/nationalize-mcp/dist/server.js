import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { nationality } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "nationalize-mcp", version: "1.0.0" });
    server.registerTool("nationality", {
        title: "Nationality",
        description: "Estimated nationalities for a name.",
        inputSchema: z.object({ name: z.string().describe("First name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nationality(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nationality_countries", {
        title: "Nationality countries",
        description: "Estimated nationalities for a first name, each ISO code resolved to the real country with its World Bank region, income level and capital.",
        inputSchema: z.object({ name: z.string().describe("First name."), limit: z.number().int().min(1).max(10).default(5) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement countries locally (paywall removed)
        try {
            return textError("Not yet implemented: countries");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_indicators", {
        title: "Country indicators",
        description: "World Bank basics for a two letter country code: region, income level, lending type, capital, coordinates and latest total population.",
        inputSchema: z.object({ code: z.string().max(3).describe("ISO country code like PL.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement indicators locally (paywall removed)
        try {
            return textError("Not yet implemented: indicators");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nationalize-mcp";
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
