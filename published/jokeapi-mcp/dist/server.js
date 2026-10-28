import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jokesBatch, randomJoke, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "jokeapi-mcp", version: "1.0.1" });
    server.tool("random_joke", "One joke from a category, safe by default.", {
        category: z.enum(["Any", "Misc", "Programming", "Pun", "Spooky", "Christmas", "Dark"]).default("Any").describe("Joke category"),
        safeMode: z.boolean().default(true).describe("Keep the blacklist filters on (Dark jokes need this false)")
    }, async (a) => {
        try {
            return text(await randomJoke(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("jokes_batch", "Several jokes at once from one category.", {
        category: z.enum(["Any", "Misc", "Programming", "Pun", "Spooky", "Christmas", "Dark"]).default("Any").describe("Joke category"),
        amount: z.number().int().min(2).max(10).default(3).describe("Jokes to return"),
        safeMode: z.boolean().default(true).describe("Keep the blacklist filters on")
    }, async (a) => {
        try {
            return text(await jokesBatch(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
