import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { comparePodcasts, errorMessage, latestEpisodes, podcastCharts, podcastDetails, podcastStats, searchEpisodes, searchPodcasts } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "simplecast-mcp",
        version: "2.0.0",
    });
    server.registerTool("search_podcasts", {
        title: "Search podcasts",
        description: "Search the Apple Podcasts catalogue by name or topic and get each show's episode count, genre, Apple id and RSS feed URL. No API key needed.",
        inputSchema: z.object({
            query: z.string().describe("Search term, for example technology news."),
            limit: z.number().describe("How many shows to return, 1 to 50. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchPodcasts({ query, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_episodes", {
        title: "Search episodes",
        description: "Search podcast episode titles across the whole Apple Podcasts catalogue and return the show, date and length of each match.",
        inputSchema: z.object({
            query: z.string().describe("Words to find in episode titles."),
            limit: z.number().describe("How many episodes to return, 1 to 50. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchEpisodes({ query, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("podcast_charts", {
        title: "Podcast charts",
        description: "Apple Podcasts top chart for a country, with rank, publisher and genre for every show.",
        inputSchema: z.object({
            country: z.string().describe('Two-letter country code such as "us", "gb" or "de". Defaults to us.').optional(),
            limit: z.number().describe("How many chart entries, 1 to 100. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ country, limit }) => {
        try {
            return text(await podcastCharts({ country, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("podcast_details", {
        title: "Podcast details",
        description: "Look up one show by Apple id or by name and get its publisher, genre, episode count, latest release and a live check of its RSS feed.",
        inputSchema: z.object({
            podcastId: z.number().describe("Apple Podcasts collection id, for example 1434243584.").optional(),
            name: z.string().describe("Show name to look up instead of an id.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ podcastId, name }) => {
        try {
            return text(await podcastDetails({ podcastId, name }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("latest_episodes", {
        title: "Latest episodes",
        description: "Read any podcast RSS feed and list its newest episodes with publication date, length and audio URL.",
        inputSchema: z.object({
            feedUrl: z.string().describe("Podcast RSS feed URL."),
            count: z.number().describe("How many episodes to list, 1 to 25. Defaults to 5.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ feedUrl, count }) => {
        try {
            return text(await latestEpisodes({ feedUrl, count }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("podcast_stats", {
        title: "Podcast stats",
        description: "Analyse a podcast feed: episode count, first and latest episode, average length, publishing cadence and whether the show is overdue.",
        inputSchema: z.object({
            feedUrl: z.string().describe("Podcast RSS feed URL."),
        }),
        annotations: READ_ONLY,
    }, async ({ feedUrl }) => {
        try {
            return text(await podcastStats({ feedUrl }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("compare_podcasts", {
        title: "Compare podcasts",
        description: "Compare two podcast feeds side by side on episode count, latest episode, average length and publishing cadence.",
        inputSchema: z.object({
            feedA: z.string().describe("First podcast RSS feed URL."),
            feedB: z.string().describe("Second podcast RSS feed URL."),
        }),
        annotations: READ_ONLY,
    }, async ({ feedA, feedB }) => {
        try {
            return text(await comparePodcasts({ feedA, feedB }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("feed_audit", {
        title: "Feed audit",
        description: "Whether a podcast feed is well formed the way a directory grades it: per-item coverage of duration, enclosure length, explicit flag, guid, summary and artwork, the episode-type split, and the gaps a directory would notice.",
        inputSchema: z.object({
            feed_url: z.string().describe("Podcast feed URL, e.g. https://feeds.megaphone.fm/darknetdiaries"),
            limit: z.number().describe("Unused for coverage counts; kept so the schema matches the other feed tools.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: feed_audit ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_simplecast_feed_audit", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("audio_profile", {
        title: "Audio profile",
        description: "The audio side of a feed: declared file size and MIME type per episode, the implied bitrate, total hours carried, and the episodes that are bitrate outliers against the show's own median.",
        inputSchema: z.object({
            feed_url: z.string().describe("Podcast feed URL"),
            limit: z.number().describe("Max recent items listed, 1-30. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: audio_profile ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_simplecast_audio_profile", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
