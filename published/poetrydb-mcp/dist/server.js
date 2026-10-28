import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findPoem, poemsByAuthor, poemsByTitle, randomPoem, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "poetrydb-mcp", version: "1.0.1" });
    server.tool("poems_by_author", "Poems by one author, with their lines.", {
        author: z.string().min(2).describe("Author name, e.g. Shakespeare or Emily Dickinson"),
        limit: z.number().int().min(1).max(5).default(2).describe("Poems to return")
    }, async (a) => {
        try {
            return text(await poemsByAuthor(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("poems_by_title", "Poems whose title matches, with author and lines.", {
        title: z.string().min(2).describe("Title, e.g. Sonnet 18 or The Raven"),
        limit: z.number().int().min(1).max(5).default(2).describe("Poems to return")
    }, async (a) => {
        try {
            return text(await poemsByTitle(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("find_poem", "One poem by both author and title.", {
        author: z.string().min(2).describe("Author name"),
        title: z.string().min(2).describe("Poem title")
    }, async (a) => {
        try {
            return text(await findPoem(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("random_poem", "A random poem (or a few) from the collection.", {
        count: z.number().int().min(1).max(5).default(1).describe("Poems to return")
    }, async (a) => {
        try {
            return text(await randomPoem(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
