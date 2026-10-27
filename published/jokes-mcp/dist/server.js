import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { dadJoke, searchDadJokes, joke, categories } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'jokes-mcp', version: '1.0.0' });
    server.registerTool('dadJoke', {
        title: "Dad Joke",
        description: 'Random dad joke from icanhazdadjoke.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await dadJoke());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('searchDadJokes', {
        title: "Search Dad Jokes",
        description: 'Search dad jokes by term.',
        inputSchema: z.object({ query: z.string().describe('Search term.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchDadJokes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('joke', {
        title: "Joke",
        description: 'Random joke from JokeAPI, optionally by category (Programming, Dark, Pun, etc.).',
        inputSchema: z.object({ category: z.string().describe('Optional category.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await joke(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('categories', {
        title: "Categories",
        description: 'List available JokeAPI categories.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await categories());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("two_part_joke", {
        title: "Two part joke",
        description: "A setup-and-punchline JokeAPI joke from one named category, e.g. Programming, Pun or Spooky.",
        inputSchema: z.object({ category: z.string().describe("JokeAPI category, e.g. Programming.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement joke locally (paywall removed)
        try {
            return textError("Not yet implemented: joke");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("joke_api_info", {
        title: "Joke API info",
        description: "The JokeAPI service catalogue: version, how many jokes it holds, and its categories, flags and joke types.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "jokes-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    return server;
}
