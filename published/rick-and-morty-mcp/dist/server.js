import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { character, episode, search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "rick-and-morty-mcp", version: "1.0.0" });
    server.registerTool("character", {
        title: "Character",
        description: "Character by ID.",
        inputSchema: z.object({ id: z.number().describe("Character ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await character(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search characters.",
        inputSchema: z.object({ name: z.string().describe("Name."), limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("episode", {
        title: "Episode",
        description: "Episode by ID.",
        inputSchema: z.object({ id: z.number().describe("Episode ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await episode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("location", {
        title: "Location",
        description: "A Rick and Morty location by ID: its type, dimension and how many residents it lists.",
        inputSchema: z.object({ id: z.number().describe("Location ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement location locally (paywall removed)
        try {
            return textError("Not yet implemented: location");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("location_residents", {
        title: "Location residents",
        description: "A sample of the characters who live at a Rick and Morty location, with status and species.",
        inputSchema: z.object({ id: z.number().describe("Location ID."), limit: z.number().int().min(1).max(30).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement residents locally (paywall removed)
        try {
            return textError("Not yet implemented: residents");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "rick-and-morty-mcp";
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
    return server;
}
