import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DadJokeError, getJoke, randomJoke, searchJokes } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "dadjoke-mcp",
        version: "1.0.0",
    });
    server.registerTool("random_joke", {
        title: "Random dad joke",
        description: "Get a random dad joke.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text((await randomJoke()).joke);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_jokes", {
        title: "Search dad jokes",
        description: "Search dad jokes by keyword.",
        inputSchema: z.object({
            term: z.string().describe("Keyword, e.g. 'bicycle', 'dog', 'programmer'"),
            limit: z.number().int().min(1).max(30).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ term, limit }) => {
        try {
            const results = await searchJokes(term, limit);
            if (results.length === 0)
                return text(`No dad jokes about "${term}".`);
            return text(results.map((j, i) => `${i + 1}. ${j.joke}`).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_joke", {
        title: "Get joke by id",
        description: "Get one dad joke by its id.",
        inputSchema: z.object({
            id: z.string().describe("Joke id from search results"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text((await getJoke(id)).joke);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("typed_joke", {
        title: "Typed joke",
        description: "Get a two part joke from the JokeAPI in a category you choose: Programming, Pun, Dark, Spooky, Christmas, Misc or Any. Reports the content flags it sets.",
        inputSchema: z.object({
            category: z.string().describe("Category: Programming, Pun, Dark, Spooky, Christmas, Misc or Any. Defaults to Any.").optional(),
        }),
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
    server.registerTool("chuck_fact", {
        title: "Chuck fact",
        description: "Get a Chuck Norris fact, optionally from one category such as dev, food, science, money or travel.",
        inputSchema: z.object({
            category: z.string().describe("Category name, for example dev. Omit for any category.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement fact locally (paywall removed)
        try {
            return textError("Not yet implemented: fact");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("comic_strip", {
        title: "Comic strip",
        description: "Get an xkcd comic by number, or the latest one when no number is given, with its image link and alt text.",
        inputSchema: z.object({
            number: z.number().describe("Comic number, 1-4000. Omit for the latest.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement strip locally (paywall removed)
        try {
            return textError("Not yet implemented: strip");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dadjoke-mcp";
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
function errorMessage(e) {
    if (e instanceof DadJokeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
