import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ItunesError, albumTracks, artistAlbums, searchApps, searchBooks, searchMusic, searchPodcasts, } from "./api.js";
const ENTITIES = ["song", "album", "musicVideo", "musicArtist"];
function fail(e) {
    const msg = e instanceof ItunesError ? e.message : `Unexpected error: ${e?.message ?? String(e)}`;
    return { content: [{ type: "text", text: msg }], isError: true };
}
function ok(text) {
    return { content: [{ type: "text", text }] };
}
export function createServer() {
    const server = new McpServer({ name: "itunes-mcp", version: "1.0.0" });
    server.tool("search_itunes", "Search iTunes for songs, albums, music videos or artists. Keyless.", {
        term: z.string().min(1).describe("What to search for, e.g. 'daft punk'"),
        entity: z.enum(ENTITIES).default("song").describe("Result type (default song)"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50)"),
    }, async ({ term, entity, limit }) => {
        try {
            return ok(await searchMusic(term, entity, limit));
        }
        catch (e) {
            return fail(e);
        }
    });
    server.tool("artist_albums", "List every album by an artist id (get the id from search_itunes).", {
        artistId: z.number().int().positive().describe("iTunes artistId"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max albums (1-100)"),
    }, async ({ artistId, limit }) => {
        try {
            return ok(await artistAlbums(artistId, limit));
        }
        catch (e) {
            return fail(e);
        }
    });
    server.tool("album_tracks", "Track list with running times for an album (collectionId from search_itunes).", {
        collectionId: z.number().int().positive().describe("iTunes collectionId"),
    }, async ({ collectionId }) => {
        try {
            return ok(await albumTracks(collectionId));
        }
        catch (e) {
            return fail(e);
        }
    });
    server.tool("search_podcasts", "Search podcasts by name or topic, with feed URLs.", {
        term: z.string().min(1).describe("Podcast search term"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50)"),
    }, async ({ term, limit }) => {
        try {
            return ok(await searchPodcasts(term, limit));
        }
        catch (e) {
            return fail(e);
        }
    });
    server.tool("search_apps", "Search iOS/macOS apps with ratings and prices.", {
        term: z.string().min(1).describe("App search term"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50)"),
    }, async ({ term, limit }) => {
        try {
            return ok(await searchApps(term, limit));
        }
        catch (e) {
            return fail(e);
        }
    });
    server.tool("search_books", "Search the Apple Books catalogue.", {
        term: z.string().min(1).describe("Book search term"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results (1-50)"),
    }, async ({ term, limit }) => {
        try {
            return ok(await searchBooks(term, limit));
        }
        catch (e) {
            return fail(e);
        }
    });
    return server;
}
