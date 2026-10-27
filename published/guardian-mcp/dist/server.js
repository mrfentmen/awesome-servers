import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { latest, search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "guardian-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Guardian articles.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("latest", {
        title: "Latest",
        description: "Latest Guardian articles.",
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
    server.registerTool("section_feed", {
        title: "Section feed",
        description: "The Guardian's RSS feed for one section, which needs no API key, so you can follow a beat without the open API.",
        inputSchema: z.object({ section: z.string().describe("Section slug, e.g. environment or world/uk."), limit: z.number().describe("Max items.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement feed locally (paywall removed)
        try {
            return textError("Not yet implemented: feed");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("front_page_feed", {
        title: "Front page feed",
        description: "The Guardian's front page RSS feed, keyless: everything currently on the front page with its standfirst and link.",
        inputSchema: z.object({ limit: z.number().describe("Max items.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement feed locally (paywall removed)
        try {
            return textError("Not yet implemented: feed");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "guardian-mcp";
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
