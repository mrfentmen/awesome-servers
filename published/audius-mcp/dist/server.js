import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AudiusError, formatTrack, formatUser, getUserTracks, searchTracks, searchUsers, trendingTracks, artistFollowers } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "audius-mcp",
        version: "1.0.0",
    });
    server.registerTool("trending_tracks", {
        title: "Trending tracks",
        description: "Trending tracks on Audius — underground/independent music that isn't " +
            "on the mainstream charts. Filter by genre.",
        inputSchema: z.object({
            genre: z.string().default("all").describe("Genre filter. Use exact Audius genre values, e.g. 'Hip-Hop/Rap', 'Electronic', 'Dubstep', 'Trap', or 'all' for every genre"),
            limit: z.number().int().min(1).max(25).default(8),
        }),
        annotations: READ_ONLY,
    }, async ({ genre, limit }) => {
        try {
            const tracks = await trendingTracks(genre, limit);
            if (tracks.length === 0)
                return text(`No trending tracks${genre !== "all" ? ` in ${genre}` : ""}.`);
            return text(`Trending${genre !== "all" ? ` ${genre}` : ""} on Audius:\n\n` +
                tracks.map((t, i) => formatTrack(t, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_tracks", {
        title: "Search tracks",
        description: "Search tracks by title/artist keyword.",
        inputSchema: z.object({ query: z.string().describe("Search terms"), limit: z.number().int().min(1).max(25).default(8) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const tracks = await searchTracks(query, limit);
            if (tracks.length === 0)
                return text(`No tracks match "${query}".`);
            return text(`Tracks matching "${query}":\n\n${tracks.map((t, i) => formatTrack(t, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_artists", {
        title: "Search artists",
        description: "Search artists by handle or name.",
        inputSchema: z.object({ query: z.string().describe("Artist name or handle"), limit: z.number().int().min(1).max(25).default(8) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const users = await searchUsers(query, limit);
            if (users.length === 0)
                return text(`No artists match "${query}".`);
            return text(`Artists matching "${query}":\n\n${users.map((u, i) => formatUser(u, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_artist_tracks", {
        title: "Get artist tracks",
        description: "Get an artist's uploaded tracks by user id.",
        inputSchema: z.object({ userId: z.string().describe("User id from search_artists"), limit: z.number().int().min(1).max(25).default(8) }),
        annotations: READ_ONLY,
    }, async ({ userId, limit }) => {
        try {
            const tracks = await getUserTracks(userId, limit);
            if (tracks.length === 0)
                return text(`No tracks for user ${userId}.`);
            return text(`Tracks from user ${userId}:\n\n${tracks.map((t, i) => formatTrack(t, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trending_playlists", {
        title: "Trending playlists",
        description: "Trending playlists and albums on Audius, with the curator and play counts.",
        inputSchema: z.object({ limit: z.number().describe("Max playlists.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement playlists locally (paywall removed)
        try {
            return textError("Not yet implemented: playlists");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("track_comments", {
        title: "Track comments",
        description: "Comments left on an Audius track, with timestamped notes, reply and reaction counts.",
        inputSchema: z.object({ track_id: z.string().describe("Track id."), limit: z.number().describe("Max comments.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement comments locally (paywall removed)
        try {
            return textError("Not yet implemented: comments");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_followers", {
        title: "Artist followers",
        description: "Who follows an Audius artist, with each follower's own follower and track counts.",
        inputSchema: z.object({ user_id: z.string().describe("Audius user id."), limit: z.number().describe("Max followers.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await artistFollowers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("track_detail", {
        title: "Track detail",
        description: "One Audius track in full: BPM, musical key, tags, ISRC, rights and artwork, none of which the list tools return.",
        inputSchema: z.object({ track_id: z.string().describe("Track id from trending_tracks or search_tracks.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "audius-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof AudiusError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
