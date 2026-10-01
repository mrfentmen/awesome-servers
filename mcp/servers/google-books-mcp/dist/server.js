import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchBooks, getVolume } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "google-books-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_books", {
        title: "Search books",
        description: "Search Google Books volumes by title or author.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. Dune Herbert."),
            limit: z.string().describe("Max results (default 10, max 40).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchBooks(query, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_volume", {
        title: "Get volume",
        description: "One volume by id, with description and ISBNs.",
        inputSchema: z.object({
            volume_id: z.string().describe("Google Books volume ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ volume_id }) => {
        try {
            return text(await getVolume(volume_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("isbn_lookup", {
        title: "ISBN lookup",
        description: "Check an ISBN-10 or ISBN-13 checksum, then read the Open Library edition record: title, authors, publisher, date, pages, classification and subjects.",
        inputSchema: z.object({
            isbn: z.string().describe("ISBN-10 or ISBN-13, digits only is fine, e.g. 9780140449136"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: isbn_lookup ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_google_books_isbn_lookup", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("author_works", {
        title: "Author works",
        description: "An author's bibliography from Open Library with first publication year, edition count and reader rating for each title, plus the best rated on the page.",
        inputSchema: z.object({
            author: z.string().describe("Author name, e.g. Ursula Le Guin"),
            limit: z.number().int().min(1).max(25).default(10).describe("How many titles to print (default 10, max 25)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: author_works ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_google_books_author_works", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
