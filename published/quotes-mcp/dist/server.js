import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_quoteOfTheDay, m0_randomQuote, m1_qotd, m1_search, m2_random, m3_many, m4_today, m4_quotes } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'quotes-mcp', version: '1.0.0' });
    server.registerTool("quote_of_the_day", {
        title: "Quote of the day",
        description: "Get the quote of the day.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_quoteOfTheDay(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_quote", {
        title: "Random quote",
        description: "Get a random quote.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_randomQuote(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("qotd", {
        title: "Qotd",
        description: "Quote of the day.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_qotd(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search quotes.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random", {
        title: "Random",
        description: "A random inspirational quote.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m2_random(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("many", {
        title: "Many",
        description: "Several quotes.",
        inputSchema: z.object({ count: z.number().describe("How many.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m3_many(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('today', {
        title: "Today",
        description: 'Quote of the day.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m4_today(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('quotes', {
        title: "Quotes",
        description: 'List of quotes.',
        inputSchema: z.object({ limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m4_quotes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("quote_by_id", {
        title: "Quote by id",
        description: "One specific quote from the DummyJSON catalogue by its numeric id, for pulling a known line.",
        inputSchema: z.object({ id: z.number().describe("Quote id, 1 to 1000.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement id locally (paywall removed)
        try {
            return textError("Not yet implemented: id");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "quotes-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    return server;
}
