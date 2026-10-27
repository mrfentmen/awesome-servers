import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { champion, champions } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "lol-datadragon-mcp", version: "1.0.0" });
    server.registerTool("champions", {
        title: "Champions",
        description: "All champions.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await champions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("champion", {
        title: "Champion",
        description: "Details for one champion.",
        inputSchema: z.object({ name: z.string().describe("Champion name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await champion(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("items", {
        title: "Items",
        description: "Search League of Legends shop items in the current patch, with total gold cost, tags and a short description.",
        inputSchema: z.object({ name: z.string().max(60).optional(), limit: z.number().int().min(1).max(40).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement items locally (paywall removed)
        try {
            return textError("Not yet implemented: items");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("runes", {
        title: "Runes",
        description: "The five League of Legends rune trees in the current patch and the runes in each of their four slots.",
        inputSchema: z.object({ tree: z.string().max(40).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement runes locally (paywall removed)
        try {
            return textError("Not yet implemented: runes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "lol-datadragon-mcp";
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
