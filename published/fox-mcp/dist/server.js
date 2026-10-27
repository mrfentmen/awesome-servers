import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { random } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fox-mcp", version: "1.0.0" });
    server.registerTool("random", {
        title: "Random",
        description: "A random fox photo.",
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
    server.registerTool("fox_species", {
        title: "Fox species",
        description: "Search the GBIF taxonomic backbone for species matching a name, with family, genus, order and GBIF taxon key.",
        inputSchema: z.object({ query: z.string().describe("Scientific or genus name, e.g. Vulpes.").optional(), limit: z.number().int().min(1).max(25).default(10).describe("Max results.") }),
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
    server.registerTool("fox_sightings", {
        title: "Fox sightings",
        description: "Recent GBIF occurrence records for a fox species: where and when it was recorded, and how the record was made.",
        inputSchema: z.object({ scientific_name: z.string().describe("Scientific name, e.g. Vulpes vulpes.").optional(), limit: z.number().int().min(1).max(20).default(8).describe("Max records.") }),
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
    const serverName = "fox-mcp";
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
