import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { recent, search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "openplaques-mcp", version: "1.0.0" });
    server.registerTool("recent", {
        title: "Recent",
        description: "Recent plaques.",
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
    server.registerTool("search", {
        title: "Search",
        description: "Search plaques by inscription.",
        inputSchema: z.object({ query: z.string().describe("Search text."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("plaque", {
        title: "Plaque",
        description: "One OpenPlaques record in full: inscription, subjects, address, erection date, whether it is still current, coordinates and photo.",
        inputSchema: z.object({ id: z.string().describe("Numeric OpenPlaques id, e.g. 1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement plaque locally (paywall removed)
        try {
            return textError("Not yet implemented: plaque");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("plaque_photos", {
        title: "Plaque photos",
        description: "Photographs of one OpenPlaques plaque, with photographer credits and file descriptions.",
        inputSchema: z.object({ id: z.string().describe("Numeric OpenPlaques id, e.g. 1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement photos locally (paywall removed)
        try {
            return textError("Not yet implemented: photos");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "openplaques-mcp";
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
