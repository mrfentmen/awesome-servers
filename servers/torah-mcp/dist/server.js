import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getCommentaries, getConnections, getTanakhText, getWeeklyPortion, searchTexts, bookIndex, wordLookup } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "torah-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_weekly_portion", {
        title: "Get weekly Torah portion",
        description: "This week's Torah portion (Parashat HaShavua) plus holidays. Optional lat/lon adds candle-lighting times.",
        inputSchema: z.object({
            latitude: z.number().describe("Latitude for candle-lighting times").optional(),
            longitude: z.number().describe("Longitude for candle-lighting times").optional(),
            timezone: z.string().describe("IANA timezone, e.g. 'America/New_York'").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude, timezone }) => {
        try {
            return text(await getWeeklyPortion(latitude, longitude, timezone));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_tanakh_text", {
        title: "Read Tanakh text",
        description: "Read a Tanakh passage in English and Hebrew: 'Genesis.1', 'Exodus 20', 'Psalms.23', 'Deuteronomy.6.4'.",
        inputSchema: z.object({
            ref: z.string().describe("Sefaria reference, e.g. 'Genesis.1' or 'Psalms.23'"),
            language: z.string().describe("'en', 'he' or 'both' (default both)").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ ref, language }) => {
        try {
            return text(await getTanakhText(ref, language));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_commentaries", {
        title: "Read commentaries",
        description: "Classical commentaries on a passage: Rashi, Ramban, Ibn Ezra. Filter by commentator name.",
        inputSchema: z.object({
            ref: z.string().describe("Reference, e.g. 'Genesis.1.1'"),
            commentator: z.string().describe("Filter, e.g. 'Rashi' or 'Ramban'").optional(),
            maxResults: z.number().int().min(1).max(5).describe("How many commentaries").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ ref, commentator, maxResults }) => {
        try {
            return text(await getCommentaries(ref, commentator, maxResults));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_connections", {
        title: "Get linked sources",
        description: "Sources linked to a verse: commentaries, midrash, halakhah, cross-references. Optional category filter.",
        inputSchema: z.object({
            ref: z.string().describe("Verse reference, e.g. 'Genesis.1.1'"),
            category: z.string().describe("Filter, e.g. 'Commentary', 'Midrash', 'Halakhah'").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ ref, category }) => {
        try {
            return text(await getConnections(ref, category));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_texts", {
        title: "Search Jewish texts",
        description: "Full-text search across Sefaria's library: Tanakh, Mishnah, Talmud, midrash and more.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            size: z.number().int().min(1).max(20).describe("How many results").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ query, size }) => {
        try {
            return text(await searchTexts(query, size));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("book_index", {
        title: "Book index",
        description: "How Sefaria structures a book: its address scheme and depth, section names, categories, composition and publication data.",
        inputSchema: z.object({ book: z.string().describe("Book name, e.g. Genesis or Psalms.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: book_index ----
        const paywallMessage = await premiumRequired("book_index");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await bookIndex(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("word_lookup", {
        title: "Word lookup",
        description: "Dictionary lookup for a Hebrew or Aramaic word in Sefaria's lexicon, with its morphology, source lexicon and every published sense.",
        inputSchema: z.object({ word: z.string().describe("Hebrew or Aramaic word."), limit: z.number().describe("Max dictionary entries.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: word_lookup ----
        const paywallMessage = await premiumRequired("word_lookup");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await wordLookup(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
