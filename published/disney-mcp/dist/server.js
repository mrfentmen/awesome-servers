import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { character, characters, charactersByMedium } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "disney-mcp", version: "1.0.0" });
    server.registerTool("character", {
        title: "Character",
        description: "Get a character by id or name.",
        inputSchema: z.object({ query: z.string().describe("Character name or id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await character(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("characters", {
        title: "Characters",
        description: "List characters.",
        inputSchema: z.object({ page: z.number().describe("Page number.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await characters(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character_appearances", {
        title: "Character appearances",
        description: "Every screen and park appearance for a Disney character across films, short films, TV shows, video games and park attractions, plus allies and enemies and the image and profile links.",
        inputSchema: z.object({ query: z.string().describe("Character name or id."), limit: z.number().describe("Max items listed per medium.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement appearances locally (paywall removed)
        try {
            return textError("Not yet implemented: appearances");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("character_directory", {
        title: "Character directory",
        description: "Browse the Disney character catalogue by page with per medium appearance counts for films, short films, TV, video games and park attractions, filterable to one medium or a minimum appearance count.",
        inputSchema: z.object({ page: z.number().describe("Page number, 1 based.").optional(), page_size: z.number().describe("Records per page.").optional(), medium: z.string().describe("films, shortFilms, tvShows, videoGames or parkAttractions.").optional(), min_appearances: z.number().describe("Keep only characters with at least this many appearances.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement directory locally (paywall removed)
        try {
            return textError("Not yet implemented: directory");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("characters_by_medium", {
        title: "Characters by medium",
        description: "Find which Disney characters appear in a given film, show, game or attraction title by scanning the character catalogue, returning each matching title with its character list.",
        inputSchema: z.object({ title: z.string().describe("Title fragment, e.g. The Lion King."), medium: z.string().describe("Restrict to one medium.").optional(), max_pages: z.number().describe("Pages of 50 characters to scan.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await charactersByMedium(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "disney-mcp";
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
