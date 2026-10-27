import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DatamuseError, formatHits, formatWithDefs, meansLike, relatedTo, rhymesWith, spellCheck, suggest, confusablesWith } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "datamuse-mcp",
        version: "1.0.0",
    });
    server.registerTool("rhymes_with", {
        title: "Rhymes with",
        description: "Find words that rhyme with a word.",
        inputSchema: z.object({ word: z.string().describe("The word to rhyme"), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async ({ word, limit }) => {
        try {
            const hits = await rhymesWith(word, limit);
            return text(hits.length ? `Words that rhyme with "${word}":\n${formatHits(hits)}` : `No rhymes for "${word}".`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("means_like", {
        title: "Means like",
        description: "Find words and phrases with a similar meaning, with definitions.",
        inputSchema: z.object({ word: z.string().describe("The meaning to match, e.g. 'retro gaming'"), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async ({ word, limit }) => {
        try {
            const hits = await meansLike(word, limit);
            return text(hits.length ? `Words meaning like "${word}":\n${formatWithDefs(hits)}` : `Nothing meaning like "${word}".`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("related_to", {
        title: "Related to",
        description: "Find words commonly associated with a topic.",
        inputSchema: z.object({ word: z.string().describe("The topic, e.g. 'cave'"), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async ({ word, limit }) => {
        try {
            const hits = await relatedTo(word, limit);
            return text(hits.length ? `Words related to "${word}":\n${formatHits(hits)}` : `Nothing related to "${word}".`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spell_check", {
        title: "Spell check",
        description: "Check a word's spelling and get corrections.",
        inputSchema: z.object({ word: z.string().describe("The word to check") }),
        annotations: READ_ONLY,
    }, async ({ word }) => {
        try {
            const hits = await spellCheck(word);
            const correct = hits.some((h) => h.word.toLowerCase() === word.toLowerCase());
            const body = hits.length ? `Closest matches:\n${formatHits(hits)}` : "No close matches.";
            return text(correct ? `"${word}" looks correctly spelled. ${body}` : `"${word}" may be misspelled. ${body}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_suggestions", {
        title: "Word suggestions",
        description: "Suggest words starting with a prefix.",
        inputSchema: z.object({ prefix: z.string().describe("Word start, e.g. 'comp'"), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async ({ prefix, limit }) => {
        try {
            const hits = await suggest(prefix, limit);
            return text(hits.length ? `Words starting with "${prefix}":\n${formatHits(hits)}` : `Nothing starts with "${prefix}".`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("confusables_with", {
        title: "Confusables with",
        description: "Find words that look or feel similar to a word but differ in meaning, like form and from.",
        inputSchema: z.object({ word: z.string().describe("The word to look up confusables for"), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await confusablesWith(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("synonyms_of", {
        title: "Synonyms of",
        description: "Find words with the same or a near meaning as a word.",
        inputSchema: z.object({ word: z.string().describe("The word to find synonyms of"), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement of locally (paywall removed)
        try {
            return textError("Not yet implemented: of");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("antonyms_of", {
        title: "Antonyms of",
        description: "Find words with the opposite meaning to a word.",
        inputSchema: z.object({ word: z.string().describe("The word to find antonyms of"), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement of locally (paywall removed)
        try {
            return textError("Not yet implemented: of");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "datamuse-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof DatamuseError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
