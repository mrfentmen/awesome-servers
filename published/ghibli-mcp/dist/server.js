import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { film, films } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ghibli-mcp", version: "1.0.0" });
    server.registerTool("films", {
        title: "Films",
        description: "All Studio Ghibli films.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await films(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("film", {
        title: "Film",
        description: "Details for one film.",
        inputSchema: z.object({ id: z.string().describe("Film id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await film(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_films", {
        title: "Search films",
        description: "Find Studio Ghibli films by title, original title, director, character or vehicle name, without needing the film id.",
        inputSchema: z.object({ query: z.string().describe("Title, director or character, e.g. \"Laputa\" or \"Miyazaki\"."), limit: z.number().int().min(1).max(20).default(10).describe("Max results.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement films locally (paywall removed)
        try {
            return textError("Not yet implemented: films");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("film_people", {
        title: "Film people",
        description: "The characters, vehicles, locations and species a Studio Ghibli film features, plus its poster and banner art.",
        inputSchema: z.object({ id: z.string().describe("Film id, from films or search_films.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement people locally (paywall removed)
        try {
            return textError("Not yet implemented: people");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ghibli-mcp";
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
