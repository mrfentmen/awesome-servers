import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { zones, zoneCatalogue, zoneHierarchy } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "electricitymap-mcp", version: "1.0.0" });
    server.registerTool("zones", {
        title: "Zones",
        description: "List electricity zones.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await zones(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("zone_hierarchy", {
        title: "Zone hierarchy",
        description: "The parent and sub-zone tree inside the Electricity Map catalogue: with no argument, every zone that has sub-zones and what they are; with a zone key, that zone's parent, its sub-zones and whether any of them are themselves parents. The zones tool prints the key, the name and the country and never reaches the parent or sub-zone fields.",
        inputSchema: z.object({ zone: z.string().describe("A zone key such as AU, CA-NT or DE. Omit for the whole tree.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await zoneHierarchy(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("zone_catalogue", {
        title: "Zone catalogue",
        description: "A profile of the whole Electricity Map zone catalogue: how many zones and country codes it holds, the data tier breakdown and which zones carry no tier, the counts of top level, sub and leaf zones, the untiered zones by name, and the parent zones with the most sub-zones. The zones tool shows at most 50 rows of key, name and country and no totals.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await zoneCatalogue());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "electricitymap-mcp";
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
