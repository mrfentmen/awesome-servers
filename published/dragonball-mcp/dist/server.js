import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { character, characters, planets, characterDetail } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "dragonball-mcp", version: "1.0.0" });
    server.registerTool("characters", {
        title: "Characters",
        description: "List characters.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await characters(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character", {
        title: "Character",
        description: "Get one character by name.",
        inputSchema: z.object({ name: z.string().describe("Character name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await character(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character_detail", {
        title: "Character detail",
        description: "One Dragon Ball character by id, with the transformations list and home planet the name lookup does not return.",
        inputSchema: z.object({ id: z.number().describe("Character id, like 1 for Goku. The characters list prints ids.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await characterDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("planets", {
        title: "Planets",
        description: "Page the Dragon Ball planet catalogue with its real totals and each planet's destroyed state.",
        inputSchema: z.object({ page: z.number().describe("Page number, starting at 1. Defaults to 1.").optional(), limit: z.number().describe("Planets per page, 1-50. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await planets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dragonball-mcp";
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
