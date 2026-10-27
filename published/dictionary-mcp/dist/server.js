import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_define, m0_wordOfDay, m1_randomWord, m1_wordOfTheDay, wordPhonetics } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'dictionary-mcp', version: '1.0.0' });
    server.registerTool("define", {
        title: "Define",
        description: "Get the definition of a word.",
        inputSchema: z.object({ word: z.string().describe("Word to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_define(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_of_day", {
        title: "Word of day",
        description: "Get a random word with its definition.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_wordOfDay(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_of_the_day", {
        title: "Word of the day",
        description: "Get the featured word of the day.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_wordOfTheDay(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_word", {
        title: "Random word",
        description: "Get a random word with its definition.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_randomWord(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_relations", {
        title: "Word relations",
        description: "The synonyms and antonyms a dictionary entry holds, gathered from every part of speech and from every individual definition and deduped, with the count per part of speech, how many definitions carry an example, and the entry's licence and sources. The define tool prints definitions and examples and never reads any of this.",
        inputSchema: z.object({ word: z.string().describe("Word to look up, like cat.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement relations locally (paywall removed)
        try {
            return textError("Not yet implemented: relations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_phonetics", {
        title: "Word phonetics",
        description: "Every pronunciation a dictionary entry records, deduped, with each one's audio file, the source it was recorded from and its own licence, plus the headword phonetic. The existing tools print at most a comma joined list of the phonetic text, with no audio and no licence.",
        inputSchema: z.object({ word: z.string().describe("Word to look up, like cat.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wordPhonetics(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dictionary-mcp";
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
