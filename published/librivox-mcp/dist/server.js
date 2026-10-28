import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bookLine, browse, detail, detailText, LibriVoxError, linksText, searchByAuthor, searchByTitle, sectionsText, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof LibriVoxError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "librivox-mcp", version: "1.0.0" });
    server.tool("find_by_title", "Look up LibriVox audiobooks by exact title. The catalogue API matches whole titles only; use books_by_author or browse_catalog when the title is not exact.", {
        title: z.string().min(1).describe("Exact title, e.g. Count of Monte Cristo"),
        limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    }, async ({ title, limit }) => {
        try {
            const books = await searchByTitle(title, limit);
            return text(books.length ? books.map(bookLine).join("\n") : "No audiobooks matched that exact title.");
        }
        catch (e) {
            return text(`${errorMessage(e)} — titles must match exactly; try books_by_author or browse_catalog.`);
        }
    });
    server.tool("books_by_author", "LibriVox audiobooks by an author.", {
        author: z.string().min(1).describe("Author surname, e.g. dickens"),
        limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    }, async ({ author, limit }) => {
        try {
            const books = await searchByAuthor(author, limit);
            return text(books.length ? books.map(bookLine).join("\n") : "No audiobooks matched.");
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("audiobook_detail", "One audiobook: author, language, runtime, section count and description.", { id: z.number().int().positive().describe("LibriVox book id, e.g. 47") }, async ({ id }) => {
        try {
            const book = await detail(id);
            return text(book ? detailText(book) : `No audiobook with id ${id}.`);
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("audiobook_sections", "Chapter list with per-chapter mp3 links and readers.", {
        id: z.number().int().positive().describe("LibriVox book id"),
        limit: z.number().int().min(1).max(200).default(30).describe("Chapters"),
    }, async ({ id, limit }) => {
        try {
            const book = await detail(id);
            return text(book ? sectionsText(book, limit) : `No audiobook with id ${id}.`);
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("audiobook_links", "Download links for an audiobook: zip, RSS feed, source text, archive.", { id: z.number().int().positive().describe("LibriVox book id") }, async ({ id }) => {
        try {
            const book = await detail(id);
            return text(book ? linksText(book) : `No audiobook with id ${id}.`);
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("browse_catalog", "Page through the LibriVox catalog in id order.", {
        limit: z.number().int().min(1).max(50).default(20).describe("Rows"),
        offset: z.number().int().min(0).max(100000).default(0).describe("Rows to skip"),
    }, async ({ limit, offset }) => {
        try {
            const books = await browse(limit, offset);
            return text(books.length ? books.map(bookLine).join("\n") : "No rows at that offset.");
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
