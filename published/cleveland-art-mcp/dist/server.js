import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ClevelandError, artworkDetail, byCreator, byDepartment, highlights, searchArtworks } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof ClevelandError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "cleveland-art-mcp", version: "1.0.0" });
    const limit = z.number().int().min(1).max(30).default(8).describe("Works to return (1-30)");
    server.tool("search_artworks", "Search 60,000+ works in the Cleveland Museum of Art collection.", {
        query: z.string().min(2).describe("Search term, e.g. 'monet', 'armor', 'ukiyo-e'"),
        limit,
        onlyWithImages: z.boolean().default(false).describe("Only works that have an open-access image"),
    }, async ({ query, limit: n, onlyWithImages }) => {
        try {
            return text(await searchArtworks(query, n, onlyWithImages));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("artwork_detail", "One work with technique, accession number and a CC0 image link.", { id: z.number().int().positive().describe("Artwork id from any list tool") }, async ({ id }) => {
        try {
            return text(await artworkDetail(id));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("works_by_department", "Works in one department, by its exact name, e.g. 'Chinese Art' or 'Photography'.", { department: z.string().min(3).describe("Exact department name"), limit }, async ({ department, limit: n }) => {
        try {
            return text(await byDepartment(department, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("works_by_artist", "Works attributed to one artist.", { artist: z.string().min(3).describe("Artist name, e.g. 'Claude Monet'"), limit }, async ({ artist, limit: n }) => {
        try {
            return text(await byCreator(artist, n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("open_access_highlights", "A random slice of CC0 works that have images, for browsing.", { limit }, async ({ limit: n }) => {
        try {
            return text(await highlights(n));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
