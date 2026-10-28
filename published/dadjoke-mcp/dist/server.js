import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jokeById, randomDadjoke, searchDadjokes, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "dadjoke-mcp", version: "1.0.0" });
    server.tool("random_dadjoke", "One random dad joke.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await randomDadjoke());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_dadjokes", "Search dad jokes by keyword.", {
        term: z.string().min(2).describe('Keyword, e.g. "cat" or "cheese"'),
        limit: z.number().int().min(1).max(20).default(5).describe("Jokes to return")
    }, async (a) => {
        try {
            return text(await searchDadjokes(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("joke_by_id", "Look up one dad joke by its id.", {
        jokeId: z.string().min(3).describe('Joke id, e.g. "EdpjyXSfNCd"')
    }, async (a) => {
        try {
            return text(await jokeById(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
