import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { random, triviaCategories } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "riddles-mcp", version: "1.0.0" });
    server.registerTool("random", {
        title: "Random",
        description: "A random riddle.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await random(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trivia_questions", {
        title: "Trivia questions",
        description: "Trivia questions with answers and distractors from Open Trivia DB, filtered by category, difficulty and question type.",
        inputSchema: z.object({ amount: z.number().describe("How many questions, 1-20, default 5.").optional(), category: z.string().describe("Category name, for example 'science & nature' or 'history'.").optional(), difficulty: z.string().describe("easy, medium or hard.").optional(), type: z.string().describe("multiple or boolean.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement questions locally (paywall removed)
        try {
            return textError("Not yet implemented: questions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_entry", {
        title: "Word entry",
        description: "Wiktionary entry for a word: pronunciation, etymology and meanings, useful for building word puzzles and clues.",
        inputSchema: z.object({ word: z.string().describe("Word to look up, for example 'acrostic'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement entry locally (paywall removed)
        try {
            return textError("Not yet implemented: entry");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rhyme_candidates", {
        title: "Rhyme candidates",
        description: "Find rhyming words and reported syllable counts for writing verse riddles.",
        inputSchema: z.object({ word: z.string().max(100).describe("Word to rhyme, default light.").optional(), limit: z.number().int().min(1).max(30).describe("Maximum results, default 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement candidates locally (paywall removed)
        try {
            return textError("Not yet implemented: candidates");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("crossword_matches", {
        title: "Crossword matches",
        description: "Find words matching a spelling pattern: ? is one unknown letter and * is any number of letters.",
        inputSchema: z.object({ pattern: z.string().max(100).describe("Spelling pattern, default ??zzle.").optional(), limit: z.number().int().min(1).max(30).describe("Maximum results, default 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement matches locally (paywall removed)
        try {
            return textError("Not yet implemented: matches");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("trivia_categories", {
        title: "Trivia categories",
        description: "Discover the current category names and IDs available from Open Trivia DB.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await triviaCategories(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "riddles-mcp";
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
