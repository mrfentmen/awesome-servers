import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, item_detail, collections, collection_detail, search_format, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "library-of-congress-mcp", version: "1.0.0" });
    server.tool("search", "Search the Library of Congress catalogue", {
        query: z.string().min(2).describe("Search text, e.g. hoover dam"),
        limit: z.number().int().min(1).max(25).default(10).describe("Results to return")
    }, async (a) => {
        try {
            return text(await search(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("item_detail", "One digitised item by Library of Congress id", {
        id: z.string().min(3).describe("Item id, e.g. 2011635907")
    }, async (a) => {
        try {
            return text(await item_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("collections", "List Library of Congress digital collections", {
        limit: z.number().int().min(1).max(25).default(10).describe("Collections to return")
    }, async (a) => {
        try {
            return text(await collections(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("collection_detail", "One collection with item count and summary", {
        slug: z.string().min(2).describe("Collection slug, e.g. civil-war-maps")
    }, async (a) => {
        try {
            return text(await collection_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_format", "Search the catalogue filtered by original format", {
        query: z.string().min(2).describe("Search text"),
        format: z.string().min(3).describe("Original format, e.g. map, photo, book, manuscript"),
        limit: z.number().int().min(1).max(25).default(10).describe("Results to return")
    }, async (a) => {
        try {
            return text(await search_format(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
