import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { filter, suggest } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "wordle-helper-mcp", version: "1.0.0" });
    server.registerTool("suggest", {
        title: "Suggest",
        description: "Suggest a starting guess.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await suggest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("filter", {
        title: "Filter",
        description: "Filter candidates given feedback.",
        inputSchema: z.object({ guesses: z.string().describe("JSON array of {word, marks} where marks are g, y, or x per letter.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await filter(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pattern_words", {
        title: "Pattern words",
        description: "Real dictionary words matching a letter pattern, with corpus frequency, where ? matches any single letter. Lets you guess against the real lexicon instead of a bundled list.",
        inputSchema: z.object({ pattern: z.string().describe("Letter pattern using ? for a blank, e.g. 'c?o?e'."), limit: z.number().describe("Max words, 1-50, default 20.").optional(), definition: z.boolean().describe("Include a short definition for each word.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement words locally (paywall removed)
        try {
            return textError("Not yet implemented: words");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rhyming_words", {
        title: "Rhyming words",
        description: "Real words that rhyme with a given word, each with its corpus frequency, for building rhymes and finding near misses.",
        inputSchema: z.object({ word: z.string().describe("Word to rhyme, e.g. 'crane'."), limit: z.number().describe("Max words, 1-50, default 20.").optional(), definition: z.boolean().describe("Include a short definition for each word.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement words locally (paywall removed)
        try {
            return textError("Not yet implemented: words");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_facts", {
        title: "Word facts",
        description: "Wiktionary entry for a word: pronunciation, rhymes, hyphenation, etymology and the range of meanings, so you can tell a rare word from a common one.",
        inputSchema: z.object({ word: z.string().describe("Word to look up, e.g. 'crane'."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement facts locally (paywall removed)
        try {
            return textError("Not yet implemented: facts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("related_words", {
        title: "Related words",
        description: "Find real dictionary words commonly modified by a given word, with corpus frequency.",
        inputSchema: z.object({ word: z.string().describe("Word to look up."), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement words locally (paywall removed)
        try {
            return textError("Not yet implemented: words");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wordle-helper-mcp";
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
