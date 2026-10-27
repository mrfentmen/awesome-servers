import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fact, many } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "meowfacts-mcp", version: "1.0.0" });
    server.registerTool("fact", {
        title: "Fact",
        description: "One random cat fact.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fact(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("many", {
        title: "Many",
        description: "Several cat facts.",
        inputSchema: z.object({ count: z.number().describe("How many facts.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await many(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fact_by_number", {
        title: "Fact by number",
        description: "One specific numbered MeowFacts cat fact, so a cited fact still resolves to the same text on a later call.",
        inputSchema: z.object({ number: z.number().describe("Fact number, 1 to 9999.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement number locally (paywall removed)
        try {
            return textError("Not yet implemented: number");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "meowfacts-mcp";
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
