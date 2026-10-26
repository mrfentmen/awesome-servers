import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getShow, listShowEpisodes, getEpisode, searchShows, createShow, episodeSearch, publisherProfile } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "spreaker-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_show", {
        title: "Get show",
        description: "Retrieve a single Spreaker show by numeric ID.",
        inputSchema: z.object({
            show_id: z.string().describe("Numeric Spreaker show ID."),
        }),
        annotations: READ_ONLY,
    }, async ({ show_id }) => {
        try {
            return text(await getShow(show_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_show_episodes", {
        title: "List show episodes",
        description: "List episodes of a Spreaker show.",
        inputSchema: z.object({
            show_id: z.string().describe("Numeric Spreaker show ID."),
            limit: z.string().describe("Max items (default 50, max 100).").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ show_id, limit }) => {
        try {
            return text(await listShowEpisodes(show_id, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_episode", {
        title: "Get episode",
        description: "Retrieve a single Spreaker episode by numeric ID.",
        inputSchema: z.object({
            episode_id: z.string().describe("Numeric Spreaker episode ID."),
        }),
        annotations: READ_ONLY,
    }, async ({ episode_id }) => {
        try {
            return text(await getEpisode(episode_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_shows", {
        title: "Search shows",
        description: "Search public Spreaker shows. No API key required.",
        inputSchema: z.object({
            query: z.string().describe("Search query."),
            limit: z.string().describe("Max items to return, e.g. 20").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchShows(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_show", {
        title: "Create show",
        description: "Create a new Spreaker show (requires SPREAKER_ACCESS_TOKEN).",
        inputSchema: z.object({
            title: z.string().describe("Show title (5-40 chars)."),
            language: z.string().describe("ISO 639-1 language code, e.g. en."),
        }),
        annotations: MUTATING,
    }, async ({ title, language }) => {
        try {
            return text(await createShow(title, language));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("publisher_profile", {
        title: "Publisher profile",
        description: "Who is behind a Spreaker account: show count, follower and following totals, plan, the categories its shows are filed under, how recently each show published, how much of it is flagged explicit or machine-generated, and the most recent shows and episodes. Works from a Spreaker user id.",
        inputSchema: z.object({
            user_id: z.string().describe("Numeric Spreaker user id, e.g. 9808747."),
            limit: z.number().describe("Max shows and episodes sampled, 1-50. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await publisherProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("episode_search", {
        title: "Episode search",
        description: "Find individual published episodes anywhere on Spreaker by keyword, with the show and author each belongs to, duration, publish date, type, explicit and machine-generated flags, and whether download is enabled. Searches across every show rather than one feed.",
        inputSchema: z.object({
            query: z.string().describe("Phrase to search episode titles for, e.g. budget."),
            limit: z.number().describe("Max hits, 1-50. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await episodeSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "spreaker-mcp";
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
    return server;
}
