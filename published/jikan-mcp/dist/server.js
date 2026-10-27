import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { animeCharacters, animeInfo, mangaInfo, scheduleDay, searchAnime, searchManga, topAnime, topManga } from "./api.js";
import { seasonAnime } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "jikan-mcp", version: "1.0.0" });
    server.registerTool("search_anime", {
        title: "Search anime",
        description: "Search anime by title.",
        inputSchema: z.object({ query: z.string().describe("Anime title."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchAnime(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("anime_info", {
        title: "Anime info",
        description: "Get details for an anime by MyAnimeList ID.",
        inputSchema: z.object({ animeId: z.number().describe("MAL anime ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await animeInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("season_anime", {
        title: "Season anime",
        description: "List anime airing in the current season.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await seasonAnime(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_manga", {
        title: "Search manga",
        description: "Search manga by title.",
        inputSchema: z.object({ query: z.string().describe("Manga title."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchManga(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("manga_info", {
        title: "Manga info",
        description: "Get details for a manga by MyAnimeList ID.",
        inputSchema: z.object({ mangaId: z.number().describe("MAL manga ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mangaInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_anime", {
        title: "Top anime",
        description: "Highest-rated anime of all time.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topAnime(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_manga", {
        title: "Top manga",
        description: "Highest-rated manga of all time.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topManga(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("anime_characters", {
        title: "Anime characters",
        description: "Main characters and Japanese voice actors.",
        inputSchema: z.object({ animeId: z.number().describe("MAL anime ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await animeCharacters(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("schedule_day", {
        title: "Schedule day",
        description: "Anime airing on one weekday.",
        inputSchema: z.object({ day: z.string().describe("Weekday like monday."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await scheduleDay(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
