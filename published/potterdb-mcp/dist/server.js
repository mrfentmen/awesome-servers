import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { characterDetail, listBooks, searchCharacters, searchSpells, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "potterdb-mcp", version: "1.0.0" });
    server.tool("search_characters", "Search Harry Potter characters by name fragment, with house, species and birth details.", {
        name: z.string().describe('Name fragment, e.g. "hermione"'), limit: z.number().int().min(1).max(25).optional().describe('Characters to return, default 10')
    }, async (a) => {
        try {
            return text(await searchCharacters(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("character_detail", "Full profile for one character by slug: house, blood status, patronus, boggart, wands, family, titles and wiki link.", {
        slug: z.string().describe('Character slug, e.g. harry-potter')
    }, async (a) => {
        try {
            return text(await characterDetail(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("search_spells", "Search spells by name, with incantation, category and effect.", {
        query: z.string().describe('Spell name fragment, e.g. "Wingardium"'), limit: z.number().int().min(1).max(25).optional().describe('Spells to return, default 10')
    }, async (a) => {
        try {
            return text(await searchSpells(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_books", "The Potter DB book list with release dates, page counts and summaries.", {
        limit: z.number().int().min(1).max(20).optional().describe('Books to show, default 8')
    }, async (a) => {
        try {
            return text(await listBooks(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
