import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { random } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "duck-mcp", version: "1.0.0" });
    server.registerTool("random", {
        title: "Random",
        description: "A random duck photo.",
        inputSchema: z.object({ limit: z.number().describe("How many.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await random(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("duck_species", {
        title: "Duck Species",
        description: "Look up the scientific classification of a duck or other waterfowl by name.",
        inputSchema: z.object({ name: z.string().describe("Common or scientific name, e.g. 'mandarin duck'.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement species locally (paywall removed)
        try {
            return textError("Not yet implemented: species");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("duck_sightings", {
        title: "Duck Sightings",
        description: "Recent verified waterfowl observations reported to iNaturalist.",
        inputSchema: z.object({ limit: z.number().describe("How many sightings, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement sightings locally (paywall removed)
        try {
            return textError("Not yet implemented: sightings");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "duck-mcp";
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
