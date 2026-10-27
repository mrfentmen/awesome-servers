import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { random } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "kanye-mcp", version: "1.0.0" });
    server.registerTool("random", {
        title: "Random",
        description: "A random Kanye quote.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await random(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("quotes", {
        title: "Quotes",
        description: "The whole api.kanye.rest quote archive in order, with an offset and limit, rather than one random quote per call.",
        inputSchema: z.object({ offset: z.number().describe("First quote index.").optional(), limit: z.number().describe("How many quotes.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement quotes locally (paywall removed)
        try {
            return textError("Not yet implemented: quotes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_quotes", {
        title: "Search quotes",
        description: "Search inside the Kanye quote archive for a word or phrase, returning the archive index of every match.",
        inputSchema: z.object({ query: z.string().describe("Word or phrase to find."), limit: z.number().describe("Max matches.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement quotes locally (paywall removed)
        try {
            return textError("Not yet implemented: quotes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "kanye-mcp";
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
