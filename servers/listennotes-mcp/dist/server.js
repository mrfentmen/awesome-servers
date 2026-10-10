import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, search, bestPodcasts, getEpisode, justListen, getPodcast, podcastRecommendations, listGenres, trendingSearches, applePodcastSearch, podcastFeedCadence } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "listennotes-mcp",
        version: "1.0.0",
    });
    server.registerTool("search", {
        title: "Search episodes",
        description: "Podcast episodes matching a query, with podcast and date.",
        inputSchema: z.object({
            query: z.string().describe("Search text.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await search(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("best_podcasts", {
        title: "Best podcasts",
        description: "Curated best-podcast lists, e.g. tech.",
        inputSchema: z.object({
            page: z.string().describe("Page (default 1).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ page }) => {
        try {
            return text(await bestPodcasts(page));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_episode", {
        title: "Get episode",
        description: "One episode by id, with audio URL and description.",
        inputSchema: z.object({
            episode_id: z.string().describe("Episode UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ episode_id }) => {
        try {
            return text(await getEpisode(episode_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("just_listen", {
        title: "Random episode",
        description: "Serendipity listen.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await justListen());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_podcast", {
        title: "Get podcast",
        description: "Show details.",
        inputSchema: z.object({
            podcast_id: z.string().describe("Podcast UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ podcast_id }) => {
        try {
            return text(await getPodcast(podcast_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("podcast_recommendations", {
        title: "Similar shows",
        description: "Recommended podcasts.",
        inputSchema: z.object({
            podcast_id: z.string().describe("Podcast UUID.")
        }),
        annotations: READ_ONLY,
    }, async ({ podcast_id }) => {
        try {
            return text(await podcastRecommendations(podcast_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_genres", {
        title: "Podcast genres",
        description: "Genre list.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listGenres());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("trending_searches", {
        title: "Trending searches",
        description: "Trending queries.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await trendingSearches());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("apple_podcast_search", {
        title: "Apple podcast search",
        description: "Search the public Apple Podcasts catalogue by show or topic: show name, publisher, episode count, genres and the show's own RSS feed. No Listen Notes key needed.",
        inputSchema: z.object({
            term: z.string().describe("Show name or topic, e.g. 'history of the romans'."),
            limit: z.number().int().min(1).max(20).default(5).describe("How many shows to print (default 5, max 20)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: apple_podcast_search ----
        const paywallMessage = await premiumRequired("apple_podcast_search");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await applePodcastSearch(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("podcast_feed_cadence", {
        title: "Podcast feed cadence",
        description: "How consistently a show publishes, read from its own RSS feed: episode count, newest and oldest episode, median and longest gap between episodes, and the newest episode titles.",
        inputSchema: z.object({
            feed: z.string().describe("https:// RSS feed URL of the show."),
            limit: z.number().int().min(1).max(25).default(8).describe("How many recent episode titles to print (default 8, max 25)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: podcast_feed_cadence ----
        const paywallMessage = await premiumRequired("podcast_feed_cadence");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await podcastFeedCadence(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
