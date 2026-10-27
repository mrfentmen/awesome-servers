import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { character, house, spells } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "harry-potter-mcp", version: "1.0.0" });
    server.registerTool("character", {
        title: "Character",
        description: "Character by name.",
        inputSchema: z.object({ name: z.string().describe("Character name."), limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await character(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("house", {
        title: "House",
        description: "Members of a house.",
        inputSchema: z.object({ house: z.string().describe("Gryffindor, Slytherin, Ravenclaw, or Hufflepuff."), limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await house(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spells", {
        title: "Spells",
        description: "All spells.",
        inputSchema: z.object({ limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spells(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character_profile", {
        title: "Character profile",
        description: "One character's full record: alternate names, appearance, birth date, ancestry, wand, patronus, Hogwarts role and actors.",
        inputSchema: z.object({ name: z.string().max(120).describe("Character name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_spells", {
        title: "Search spells",
        description: "Search spell names and descriptions for a word, with how many spells matched out of the whole list.",
        inputSchema: z.object({ query: z.string().max(120).describe("Words to look for."), limit: z.number().int().min(1).max(77).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement spells locally (paywall removed)
        try {
            return textError("Not yet implemented: spells");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "harry-potter-mcp";
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
