import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { character, characters, originMap } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "finalspace-mcp", version: "1.0.0" });
    server.registerTool("characters", {
        title: "Characters",
        description: "List characters.",
        inputSchema: z.object({}),
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
        description: "Get a character by id.",
        inputSchema: z.object({ id: z.number().describe("Character id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await character(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("roster_census", {
        title: "Roster census",
        description: "A census of the whole Final Space cast: the status spread and how much of it is alive, the species, gender, origin and hair distributions, how many characters carry abilities, how many distinct abilities there are and which are most common, and the alias count per character.",
        inputSchema: z.object({ limit: z.number().describe("Values to list per distribution, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement census locally (paywall removed)
        try {
            return textError("Not yet implemented: census");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("alias_index", {
        title: "Alias index",
        description: "Resolve a code name or alias back to the character who carries it, by matching across every alias the API records and reporting the character id. With no query it lists the whole alias index and the characters with the most aliases.",
        inputSchema: z.object({ query: z.string().describe("Alias or character name to look for.").optional(), limit: z.number().describe("Matches to list, 1-40.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement index locally (paywall removed)
        try {
            return textError("Not yet implemented: index");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("origin_map", {
        title: "Origin map",
        description: "The origin view of the cast: how many characters come from each origin, how many of those are alive, and which abilities appear in that origin. Name one origin to see its members and their abilities.",
        inputSchema: z.object({ origin: z.string().describe("Origin name to focus on, e.g. Ventrexia or Earth.").optional(), limit: z.number().describe("Origins or members to list, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await originMap(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "finalspace-mcp";
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
