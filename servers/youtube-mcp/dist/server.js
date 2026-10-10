import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, search, videoDetails, channelDetails, playlistItems, channelPlaylists, mostPopular, videoComments, channelVideos, searchChannels, liveStreams, channelFeed, embedCard } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "youtube-mcp",
        version: "1.0.0",
    });
    server.registerTool("search", {
        title: "Search videos",
        description: "Videos matching a query, with title, channel and views.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, max_results }) => {
        try {
            return text(await search(query, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("video_details", {
        title: "Video details",
        description: "Title, description, view and like counts for a video.",
        inputSchema: z.object({
            video_id: z.string().describe("Video ID, e.g. dQw4w9WgXcQ")
        }),
        annotations: READ_ONLY,
    }, async ({ video_id }) => {
        try {
            return text(await videoDetails(video_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("channel_details", {
        title: "Channel details",
        description: "Subscriber and video counts for a channel.",
        inputSchema: z.object({
            channel_id: z.string().describe("Channel ID, e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw")
        }),
        annotations: READ_ONLY,
    }, async ({ channel_id }) => {
        try {
            return text(await channelDetails(channel_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("playlist_items", {
        title: "Playlist items",
        description: "Videos in a playlist.",
        inputSchema: z.object({
            playlist_id: z.string().describe("Playlist ID."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ playlist_id, max_results }) => {
        try {
            return text(await playlistItems(playlist_id, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("channel_playlists", {
        title: "Channel playlists",
        description: "Playlists of a channel.",
        inputSchema: z.object({
            channel_id: z.string().describe("Channel ID."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ channel_id, max_results }) => {
        try {
            return text(await channelPlaylists(channel_id, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("most_popular", {
        title: "Most popular",
        description: "Trending videos by region.",
        inputSchema: z.object({
            region: z.string().describe("Region code (default US).").optional(),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ region, max_results }) => {
        try {
            return text(await mostPopular(region, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("video_comments", {
        title: "Video comments",
        description: "Top comments.",
        inputSchema: z.object({
            video_id: z.string().describe("Video ID."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ video_id, max_results }) => {
        try {
            return text(await videoComments(video_id, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("channel_videos", {
        title: "Channel videos",
        description: "Latest uploads.",
        inputSchema: z.object({
            channel_id: z.string().describe("Channel ID."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ channel_id, max_results }) => {
        try {
            return text(await channelVideos(channel_id, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_channels", {
        title: "Search channels",
        description: "Channels by query.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, max_results }) => {
        try {
            return text(await searchChannels(query, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("live_streams", {
        title: "Live now",
        description: "Live streams by query.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            max_results: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, max_results }) => {
        try {
            return text(await liveStreams(query, max_results));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("channel_feed", {
        title: "Channel feed",
        description: "A channel's latest uploads from the public Atom feed YouTube publishes for every channel: titles, video ids, links and publish dates, the span they cover, and the median gap between them. No API key and no quota.",
        inputSchema: z.object({
            channel_id: z.string().describe("Channel id beginning UC, or a full https://www.youtube.com/channel/UC... URL"),
            limit: z.number().describe("Entries listed, 1-50. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: channel_feed ----
        const paywallMessage = await premiumRequired("channel_feed");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await channelFeed(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("embed_card", {
        title: "Embed card",
        description: "The card YouTube renders for any public video, playlist or channel: title, channel name and URL, id, thumbnail and embed dimensions. Fetches the same oEmbed document every embed on the web uses, so no API key is needed.",
        inputSchema: z.object({
            url: z.string().describe("Video or playlist URL, or a bare 11-character video id"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await embedCard(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
