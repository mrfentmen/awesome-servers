import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { define, wordRevisions, searchEntries } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "wiktionary-mcp", version: "1.0.0" });
    server.registerTool("define", {
        title: "Define",
        description: "Get the definition of a word.",
        inputSchema: z.object({ word: z.string().describe("The word to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await define(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_languages", {
        title: "Word languages",
        description: "Every language the English Wiktionary has an entry for a word in, with the headword used in each language.",
        inputSchema: z.object({ word: z.string().describe("The word to look up."), limit: z.number().int().min(1).max(100).default(25).describe("Max languages.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement languages locally (paywall removed)
        try {
            return textError("Not yet implemented: languages");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("entry_sections", {
        title: "Entry sections",
        description: "The section outline of a Wiktionary entry: which languages it covers and whether each has etymology, pronunciation, nouns, verbs and so on.",
        inputSchema: z.object({ word: z.string().describe("The word to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement sections locally (paywall removed)
        try {
            return textError("Not yet implemented: sections");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_revisions", {
        title: "Word revisions",
        description: "Recent edit history of a Wiktionary entry: who changed it, when, and their edit summary.",
        inputSchema: z.object({ word: z.string().describe("The word to look up."), limit: z.number().int().min(1).max(50).default(10).describe("Max revisions.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wordRevisions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_entries", {
        title: "Search entries",
        description: "Search Wiktionary entry text and return matching titles and snippets.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchEntries(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("entry_categories", {
        title: "Entry categories",
        description: "List the linguistic, regional and maintenance categories attached to a Wiktionary entry.",
        inputSchema: z.object({ word: z.string().describe("Entry title."), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement categories locally (paywall removed)
        try {
            return textError("Not yet implemented: categories");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wiktionary-mcp";
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
