import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { estimateAge, estimateGender } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "name-age-mcp", version: "1.0.0" });
    server.registerTool("estimate_age", {
        title: "Estimate age",
        description: "Estimate the typical age for a first name.",
        inputSchema: z.object({ name: z.string().describe("First name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await estimateAge(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("estimate_gender", {
        title: "Estimate gender",
        description: "Estimate the gender for a first name.",
        inputSchema: z.object({ name: z.string().describe("First name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await estimateGender(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("famous_namesakes", {
        title: "Famous namesakes",
        description: "Notable people, works and places that share a name, straight from Wikidata, with each item's short description.",
        inputSchema: z.object({ name: z.string().max(120).describe("Name to look up."), limit: z.number().int().min(1).max(25).default(8) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement namesakes locally (paywall removed)
        try {
            return textError("Not yet implemented: namesakes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("namesake_lifespan", {
        title: "Namesake lifespan",
        description: "Birth date, death date and age at death of the top Wikidata match for a name.",
        inputSchema: z.object({ name: z.string().max(120).describe("Name to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lifespan locally (paywall removed)
        try {
            return textError("Not yet implemented: lifespan");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "name-age-mcp";
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
