import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatShow, imdbOf, searchShows, TraktError, trendingMovies, trendingShows, match_title, dedupe_entries, show_identifiers } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "trakt-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_shows", {
        title: "Search shows",
        description: "TV shows by title with years and IMDb links.",
        inputSchema: z.object({
            query: z.string().describe("Show title, e.g. 'Severance'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const rows = await searchShows(query, limit);
            if (rows.length === 0)
                return text(`No shows for "${query}".`);
            return text(rows.map((s, i) => formatShow(s, imdbOf(s.ids), i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trending_shows", {
        title: "Trending shows",
        description: "Shows trending on Trakt right now.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await trendingShows(limit);
            if (rows.length === 0)
                return text("Nothing trending.");
            return text(rows.map((s, i) => formatShow(s, imdbOf(s.ids), i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trending_movies", {
        title: "Trending movies",
        description: "Movies trending on Trakt right now.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await trendingMovies(limit);
            if (rows.length === 0)
                return text("Nothing trending.");
            return text(rows.map((s, i) => formatShow(s, imdbOf(s.ids), i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("match_title", {
        title: "Match a title",
        description: "Given the title you want and a list of candidate records from searchShows, rank them by how well they match, scoring shared content words at seventy percent and the year at thirty, and say plainly which record to use. A title alone is ambiguous across remakes and reboots, and the existing tools return a list with no way to choose between two shows of the same name.",
        inputSchema: z.object({
            query: z.string().describe("The title you are looking for. A year in the query is used to break ties."),
            candidates: z.array(z.object({}).passthrough()).describe("The show or movie records to choose between, as searchShows returns them: title, year and ids."),
            limit: z.number().int().min(1).max(25).optional().describe("How many candidates to show. Default 8."),
        }),
        annotations: READ_ONLY,
    }, async ({ query, candidates, limit }) => {
        try {
            return text(match_title({ query, candidates, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dedupe_entries", {
        title: "Deduplicate records",
        description: "Find and merge duplicate records in a list of shows or movies. Two records are the same thing if they share any trakt, slug, imdb, tmdb or tvdb identifier, and only failing that if their normalised title and year agree, so two shows of the same name from different years are never merged. Reports what each duplicate carries and which record is the safer one to keep. A search result routinely returns the same show twice under different slugs.",
        inputSchema: z.object({
            entries: z.array(z.object({}).passthrough()).describe("The show or movie records to check, each with title, year and ids."),
        }),
        annotations: READ_ONLY,
    }, async ({ entries }) => {
        try {
            return text(dedupe_entries({ entries }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("show_identifiers", {
        title: "Show identifiers",
        description: "Expand one show or movie record into every identifier it carries and a usable link for each, covering imdb, tmdb and tvdb as well as the trakt slug, and name the ones that are absent along with what a record missing them cannot be used for. The existing tools print the imdb link only, and print nothing at all when the imdb id is missing.",
        inputSchema: z.object({
            entry: z.object({}).passthrough().describe("One show or movie record with title, year and ids."),
        }),
        annotations: READ_ONLY,
    }, async ({ entry }) => {
        try {
            return text(show_identifiers({ entry }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "trakt-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof TraktError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
