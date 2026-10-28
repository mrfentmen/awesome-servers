import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { artworkDetail, searchArt, searchByArtist, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "smk-mcp", version: "1.0.0" });
    server.tool("search_art", "Search the SMK collection by keyword and list matching artworks with dates and artists.", {
        query: z.string().min(1).describe("Search words, e.g. portrait or Christmas"),
        limit: z.number().int().min(1).max(50).default(10).describe("Artworks to return")
    }, async (a) => {
        try {
            return text(await searchArt(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("search_by_artist", "Find artworks by an artist name, filtered from a keyword search.", {
        artist: z.string().min(2).describe("Artist name, e.g. Hammershøi"),
        limit: z.number().int().min(1).max(50).default(10).describe("Artworks to return")
    }, async (a) => {
        try {
            return text(await searchByArtist(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("artwork_detail", "One artwork in full: title, artist(s), production date, techniques, dimensions and image links.", {
        objectNumber: z.string().min(2).describe("SMK object number, e.g. KKSgb2964")
    }, async (a) => {
        try {
            return text(await artworkDetail(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
