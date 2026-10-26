import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listMovies, getQueue, getHealth, filmFacts, filmography } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "radarr-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_movies", {
        title: "List movies",
        description: "Movies in the Radarr library, with status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listMovies());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_queue", {
        title: "Download queue",
        description: "Active downloads and imports in the queue.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getQueue());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_health", {
        title: "Health checks",
        description: "Radarr health warnings and errors.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getHealth());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("film_facts", {
        title: "Film facts",
        description: "The structured facts about a film from Wikidata: release date, runtime, director, cast, genre, studio, country, budget, box office and the IMDb and TMDB identifiers a library matches on.",
        inputSchema: z.object({
            title: z.string().describe("Film title, e.g. 'The Shawshank Redemption'"),
            year: z.string().describe("Release year, to disambiguate remakes.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await filmFacts(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("filmography", {
        title: "Filmography",
        description: "A director's or actor's credits as Wikidata has them: every titled work with its year and IMDb identifier, ordered oldest first.",
        inputSchema: z.object({
            name: z.string().describe("Person or studio name, e.g. 'Christopher Nolan'"),
            limit: z.number().describe("Max titles, 1-50. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await filmography(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "radarr-mcp";
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
